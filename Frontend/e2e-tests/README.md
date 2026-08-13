# Mock e2e suite

Everything needed to validate the frontend without a real repository lives in this directory:

```
e2e-tests/
  playwright.config.ts     configuration of the suite
  tsconfig.json            compiles tests/ -> build/tests
  tests/                   fixtures, page objects, scenarios
  __screenshots__/         committed baselines, per project
  mock-backend/            the REST/asset mock (see its own README)
  scripts/                 baseline recording in the pinned container
  build/                   compiled output + unmocked.log (git-ignored)
  test-results/, report/   run artifacts (git-ignored)
```

Playwright scenarios run the built frontend against the [mock backend](mock-backend/README.md)
and compare screenshots against committed baselines. This suite runs in **every** CI build
(GitLab job `e2e mock`), unlike `../tests/`, which needs a real repository and is gated behind
`$E2E_TEST`.

## Running locally

```
npm run e2e:mock:prepare   # once: API clients, app (dist-mock/) and mock backend  (~1.5 min)
npm run e2e:mock           # compiles tests/ and runs the suite                     (~1.5 min)
npx playwright show-report e2e-tests/report
```

`npm run e2e:mock` starts the mock backend itself (Playwright `webServer`); no separate terminal is
needed. `npm run mock-backend` beforehand is fine too — an already running server is reused.

## Scenarios

| Spec | Covers |
| --- | --- |
| `login` | login form, rejected credentials, start page after login |
| `search` | result list of the fixed corpus, filtering by search term |
| `workspace` | home folder, opening a folder |
| `collections` | collection overview, collection with its references |
| `mds` | the metadata editor with one widget of nearly every `MdsWidgetType` plus the native widgets, captured over its **full height** |

The metadata editor is a special case: its dialog scrolls internally, so `expandViewportToFit()`
grows the viewport until the dialog no longer scrolls (and asserts that), instead of stitching
several screenshots together. The baseline is therefore ~3600px high. The widget set lives in
`mock-backend/src/fixtures/mds-io.ts`; a widget id must appear **once** across the whole mds, a
duplicate is rendered twice by the editor.

## Screenshots

Baselines live in `e2e-tests/__screenshots__/<project>/<spec>/<name>.png` and **are committed**.
They capture the **viewport**, not a single element: an element wider or taller than the viewport is
clipped by Playwright, which cut off the rounded border of the content card.
Every scenario runs in four projects, so each screenshot exists four times:

| Project | Viewport | Theme |
| --- | --- | --- |
| `chromium` | 1280×800 | light |
| `chromium-dark` | 1280×800 | dark |
| `mobile` | 393×851 (Pixel 5, portrait) | light |
| `mobile-dark` | 393×851 | dark |

The phone viewport is below the mobile breakpoint (`$mobileTabSwitchWidth`, 900px), where the layout
switches to the bottom navigation. The theme is handed over as `?theme=light|dark`, which takes
priority over the stored accessibility setting (`ThemeService.registerDarkMode`); the browser's
`prefers-color-scheme` is set to match.

All pages are opened with **`locale=none`** (`AppPage.goto` appends it). The application then renders
the raw i18n keys, which makes the baselines independent of the configured default language: a
changed or added translation never invalidates a screenshot, only layout and data do.

Rendering depends on the browser build and the installed fonts, so baselines are only valid when
they were recorded in the same image CI uses:

```
npm run e2e:mock:update:docker     # = ./scripts/e2e-mock-docker.sh --update-snapshots
```

`npm run e2e:mock:update` does the same on the host - only use it when your local browser comes
from the same Playwright version as the pinned image, otherwise the baselines will not match CI.

Commit the updated PNGs **together with the UI change that caused them** — the image diff is what
makes a visual change reviewable.

While a scenario has no baseline yet, the comparison is skipped with a warning instead of failing,
so a new test can be merged before its baseline is recorded. Set `E2E_MOCK_REQUIRE_BASELINES=1`
(also a variable of the CI job) to turn a missing baseline into an error once everything is
recorded.

## Runtime

The scenarios share nothing - each one logs in itself, and the mock backend keeps its state per
session cookie, i.e. per browser context. The suite therefore runs `fullyParallel` with one worker
per core (`workers: '100%'` in CI). Measured on 4 cores: 36 tests in ~80s parallel versus ~140s
sequentially, with identical results - screenshot stability does not depend on machine speed.

If the pipeline needs to be faster still, the run can be spread over several runners:

```yaml
e2e mock:
  parallel: 3
  script:
    - npm run e2e:mock -- --shard=$CI_NODE_INDEX/$CI_NODE_TOTAL
```

## What makes the run deterministic

`tests/fixtures.ts` sets all of this up before the first navigation:

* language `none`, pinned twice: the `locale=none` query parameter *and* the `language` key in
  localStorage plus the mocked user preferences. The query parameter alone is applied only after
  the first render, so a cold load briefly shows the default language - which made screenshots
  differ between runs.
* seeded `Math.random`
* tutorials dismissed via `localStorage`
* requests to any host other than the mock are aborted
* fixed viewport per project, browser locale `de-DE`, timezone `UTC`, `colorScheme: light`,
  reduced motion
* `tests/screenshot.css` disables animations, transitions, carets, ripples and scrollbars
* the progress bar of the main nav is masked in every screenshot (`expectScreenshot` adds it)
* all scroll positions are reset - node lists keep an internal scroll offset across navigations,
  which otherwise shifts a whole table by one row between runs

**No `page.clock`.** Neither `install()` nor `setFixedTime()` can be used: the application measures
elapsed time through `Date.now()` differences and never leaves its loading screen with a frozen
clock. Date stability comes from the fixed timestamps of the mock fixtures instead - anything
rendering a *relative* date has to be masked.

The main nav progress bar stays visible on some pages even when everything has loaded. It is
therefore not part of the idle check and is masked in full-page screenshots (`PROGRESS_BAR`).

Additionally, every test fails when the page logs an error or hits an endpoint the mock does not
implement (HTTP 501).

## Adding a scenario

1. Add a spec under `tests/scenarios/`, using the helpers from `../fixtures` (`test`, `settle`,
   `expectScreenshot`) and the `app` fixture (an `AppPage` pre-configured with the project's
   theme). It has to hold up in **all four** projects - do not assert on elements of the main nav
   (the scope button is hidden on mobile) and not on colours; use `app.expectPageShell()` and
   content assertions instead.
2. If new REST endpoints are needed, implement them in the mock backend — `npm run e2e:mock` tells
   you which ones are missing.
3. Record the baselines with `npm run e2e:mock:update:docker` and commit them.
