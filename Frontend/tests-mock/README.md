# Mock e2e suite

Playwright scenarios that run the built frontend against the [mock backend](../mock-backend/README.md)
and compare screenshots against committed baselines. This suite runs in **every** CI build
(GitLab job `e2e mock`), unlike `../tests/`, which needs a real repository and is gated behind
`$E2E_TEST`.

## Running locally

```
npm run prebuild        # once: build the libraries
npm run build:mock      # Angular build -> dist-mock/
npm run e2e:mock        # compiles tests-mock/ and runs the suite
npx playwright show-report playwright-report-mock
```

`npm run e2e:mock` starts the mock backend itself (Playwright `webServer`); no separate terminal is
needed. `npm run mock-backend` beforehand is fine too — an already running server is reused.

## Screenshots

Baselines live in `tests-mock/__screenshots__/<project>/<spec>/<name>.png` and **are committed**.

Rendering depends on the browser build and the installed fonts, so baselines are only valid when
they were recorded in the same image CI uses:

```
./scripts/e2e-mock-docker.sh --update-snapshots
```

Commit the updated PNGs **together with the UI change that caused them** — the image diff is what
makes a visual change reviewable.

While a scenario has no baseline yet, the comparison is skipped with a warning instead of failing,
so a new test can be merged before its baseline is recorded. Set `E2E_MOCK_REQUIRE_BASELINES=1`
(also a variable of the CI job) to turn a missing baseline into an error once everything is
recorded.

## What makes the run deterministic

`fixtures.ts` sets all of this up before the first navigation:

* fixed clock (`page.clock.setFixedTime`) — relative dates never move.
  `clock.install()` is deliberately *not* used: fake timers stall zone.js change detection.
* seeded `Math.random`
* tutorials dismissed via `localStorage`
* requests to any host other than the mock are aborted
* fixed viewport, locale `de-DE`, timezone `UTC`, `colorScheme: light`, reduced motion
* `screenshot.css` disables animations, transitions, carets, ripples and scrollbars

Additionally, every test fails when the page logs an error or hits an endpoint the mock does not
implement (HTTP 501).

## Adding a scenario

1. Add a spec under `scenarios/`, using the helpers from `../fixtures` (`test`, `settle`,
   `expectScreenshot`) and `../pages/app.page.ts`.
2. If new REST endpoints are needed, implement them in the mock backend — `npm run e2e:mock` tells
   you which ones are missing.
3. Record the baselines with `./scripts/e2e-mock-docker.sh --update-snapshots` and commit them.
