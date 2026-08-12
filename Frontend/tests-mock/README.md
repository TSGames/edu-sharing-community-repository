# Mock e2e suite

Playwright scenarios that run the built frontend against the [mock backend](../mock-backend/README.md)
and compare screenshots against committed baselines. This suite runs in **every** CI build
(GitLab job `e2e mock`), unlike `../tests/`, which needs a real repository and is gated behind
`$E2E_TEST`.

## Running locally

```
npm run e2e:mock:prepare   # once: build libraries, app (dist-mock/) and mock backend
npm run e2e:mock           # compiles tests-mock/ and runs the suite
npx playwright show-report playwright-report-mock
```

`npm run e2e:mock` starts the mock backend itself (Playwright `webServer`); no separate terminal is
needed. `npm run mock-backend` beforehand is fine too — an already running server is reused.

## Screenshots

Baselines live in `tests-mock/__screenshots__/<project>/<spec>/<name>.png` and **are committed**.

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

## What makes the run deterministic

`fixtures.ts` sets all of this up before the first navigation:

* seeded `Math.random`
* tutorials dismissed via `localStorage`
* requests to any host other than the mock are aborted
* fixed viewport, locale `de-DE`, timezone `UTC`, `colorScheme: light`, reduced motion
* `screenshot.css` disables animations, transitions, carets, ripples and scrollbars
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

1. Add a spec under `scenarios/`, using the helpers from `../fixtures` (`test`, `settle`,
   `expectScreenshot`) and `../pages/app.page.ts`.
2. If new REST endpoints are needed, implement them in the mock backend — `npm run e2e:mock` tells
   you which ones are missing.
3. Record the baselines with `./scripts/e2e-mock-docker.sh --update-snapshots` and commit them.
