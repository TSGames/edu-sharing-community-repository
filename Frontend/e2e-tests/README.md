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
| `render` | the node detail page, rendered through a mocked **rendering service 2** |
| `dialogs` | 15 dialogs of `DialogsService`, opened through the real UI (see below) |

The metadata editor is a special case: its dialog scrolls internally, so `expandViewportToFit()`
grows the viewport until the dialog no longer scrolls (and asserts that), instead of stitching
several screenshots together. The baseline is therefore ~3600px high. The widget set lives in
`mock-backend/src/fixtures/mds-io.ts`; a widget id must appear **once** across the whole mds, a
duplicate is rendered twice by the editor.

### Rendering service 2

`components/render/:node` uses the render2 page, not the legacy renderer: the mocked `/_about`
announces the `rendering-service-2` plugin. In a **non-production build**
`RenderHelperService.prepareRootUrl()` pins the RS2 root to the dev proxy path `/rendering2`, so the
mock serves RS2 at the **origin root** next to `/edu-sharing` - same origin, no proxy, no CORS
(`mock-backend/src/routes/rendering2.routes.ts`, contract from the committed spec
`projects/rendering-service-api/src/lib/api/openapi.json`).

Two choices keep it deterministic:

* `jobId: null` plus `objectLinks` - `RenderComponent` renders immediately instead of starting a
  500ms polling interval.
* `module: 'IMAGE'` with exactly **one** object link. It is the only module without moving parts:
  video/audio mount media players, PDF the pdf viewer, H5P/Moodle/url an iframe. One link, because
  `ImageComponent.loadOptimalSize()` otherwise picks by container width.

`AssetLinkPipe` cuts the returned link at `/public` and prepends the current root url, so only the
`/public/...` path matters - the mock answers `/rendering2/public/asset*` with a placeholder PNG.

Not covered: the production URL resolution (`about.renderingService2.url` instead of `/rendering2`),
every renderer module except `IMAGE`, and the legacy renderer (`?renderer=legacy`).

### Dialogs

`DialogsService` (`src/app/features/dialogs/dialogs.service.ts`) has 45 `open*` methods. The suite
covers those that are reachable **through the UI** and get by with the endpoints the mock already
serves. They run in the `chromium` project only (`testIgnore` in `playwright.config.ts`): on a phone
almost every dialog is full screen, and one baseline per dialog keeps the run short.

| Dialog | Opened via |
| --- | --- |
| `openAccessibilityDialog` | user menu → `OPTIONS.ACCESSIBILITY` |
| `openThirdPartyLicensesDialog` | user menu → `LICENSE_INFORMATION` |
| `openNodeStoreDialog` | user menu → `SEARCH.NODE_STORE.TITLE` |
| `openAddFolderDialog` | "+" create menu → `WORKSPACE.ADD_FOLDER` |
| `openDeleteNodesDialog` | node context menu → `OPTIONS.DELETE` |
| `openContributorsDialog` | node context menu → `OPTIONS.CONTRIBUTOR` |
| `openShortcutManagementDialog` | node context menu → `OPTIONS.ADD_SHORTCUT` |
| `openCreateVariantDialog` | node context menu → `OPTIONS.VARIANT` |
| `openShareDialog` | node context menu → `OPTIONS.INVITE` |
| `openSimpleEditDialog` | node context menu → `OPTIONS.EDIT_SIMPLE` |
| `openLicenseDialog` | node context menu → `OPTIONS.LICENSE` |
| `openWorkflowDialog` | node context menu → `OPTIONS.WORKFLOW` |
| `openNodeTemplateDialog` | **folder** context menu → `OPTIONS.TEMPLATE` |
| `openShareHistoryDialog` | share dialog → `WORKSPACE.SHARE.SHOW_HISTORY` |
| `openNodeReportDialog` | search page → node context menu → `OPTIONS.NODE_REPORT` |
| `openSavedSearchesDialog` | search page → filter sidebar → `SEARCH.SAVED_SEARCHES.TITLE` |
| `openGenericDialog` (confirm/cancel) | metadata editor → change a value → Escape |
| `openQrDialog` | render page → actionbar menu → `OPTIONS.QR_CODE` |
| `openNodeEmbedDialog` | render page → actionbar menu → `OPTIONS.EMBED` |
| `openNodeRelationsDialog` | render page → actionbar menu → `OPTIONS.RELATIONS` |
| `openGenericDialog` (download metadata) | render page → actionbar menu → `OPTIONS.DOWNLOAD_METADATA` |

Not covered, with the reason:

| Reason | Dialogs |
| --- | --- |
| Would need endpoints the mock does not have | `openNodeStoreDialog`'s "add" action (`…/nodeList/BASKET/{node}`), version management (`…/versions/metadata`), feedback dialogs (`/feedback/v1/…`), `openRevocationDialog` (needs existing shares) |
| Only reachable from an admin page or drag&drop | `openShareLinkDialog` (creates a share on open), `openContributorEditDialog`, `openInputDialog`, `openXmlAppPropertiesDialog`, `openNodeInfoDialog` (admin page), `openCopyMoveDialog` (drag&drop only) |
| External infrastructure or non-deterministic by nature | `openPreviewMediaDialog` (rendering service), `openAddWithConnectorDialog` / `openCreateLtiToolDialog` (popup windows), `openFileUploadProgressDialog` (uploads on open), `openFileChooserDialog` / `openJoinGroupDialog` (live typeahead, embedded browser) |

Share, simple edit, license, workflow and share history are mocked with **content**, the way the
metadata editor is — an empty dialog proves very little:

* `fixtures/authorities.ts` — the node's permission list holds the owner, an invited user, a group
  and "everyone", so the share dialog renders every authority kind it knows. The *parent* folder
  answers with `parentPermissions` (owner only), because the share dialog builds its "inherited"
  section from the parent, and because the simple-edit invite section blocks itself with
  `SIMPLE_EDIT.INVITE.ERROR_INHERIT` when the parent is shared with somebody else.
* `fixtures/node-extras.ts` — share history and workflow history. The three share-history entries
  are chosen so all three change kinds the dialog can draw appear: added, changed, removed.
* `fixtures/node-extras.ts` also holds the relations of a node (two, of different types, so the
  relations dialog draws both of its groups) and the dashboard shortcuts (two `default` entries and
  one `ref` entry, i.e. both entry kinds).
* `fixtures/nodes.ts` — `bookmarkedNodes` fills `nodeList/BASKET`, so the node-store dialog lists
  rows instead of `SEARCH.NODE_STORE.LIST_EMPTY`.
* `fixtures/builders.ts` — every file node carries `ccm:lifecyclecontributer_author` /
  `_publisher` and `ccm:metadatacontributer_creator` as VCard strings, which is what the
  contributors dialog and the `vcard` / `author` widgets render.
* Simple edit shows all three of its sections with their real controls: the mds group `io_simple`
  points at a deliberately short two-widget view, `TOOLPERMISSION_LICENSE` plus a CC BY 4.0 license
  on the node keeps the license section out of its "invalid state" branch, and one mocked
  organization (`GET /organization/v1/organizations/…` plus its `…/type/…` subgroup) gives the
  invite toggles something to offer. The recently-invited tiles mix invited and not-yet-invited
  authorities so both tile states are covered.

Share and simple edit need `GET /iam/v1/authorities/{repo}/recent` before they render.

The default entries of the shortcut dialog carry an explicit `title`. Without one,
`ShortcutEntryTitlePipe` looks the id up below `SHORTCUT_ENTRIES.` and, 500ms later, replaces the
unresolved key with `[MISSING_TRANSLATION: ...]` — under `locale=none` that is the only thing a
default entry can render, and the delay would make the baseline depend on timing.

`OPTIONS.VERSION_MANAGEMENT` looks like a dialog but is not one — it opens the editorial sidebar
(`EditorialSidebarService.showOption`), so it is out of scope for this spec.

Not every dialog can be captured in full: some have a fixed maximum height and stay scrollable no
matter how tall the viewport gets (simple edit is one). `expandViewportToFit(…, { assertFits: false })`
accepts that and captures them scrolled to the top; only the metadata editor insists on fitting
completely.

Two findings from wiring this up, both in the application, not the tests:

* the user-menu entry for `openNotificationDialog` is **commented out** in
  `main-nav.component.ts` — the dialog currently has no UI path at all.
* the confirmation before discarding editor changes only appears on **Escape / X button**, never on
  the CANCEL button: the editor switches to `Closable.Confirm`, and that mode guards only those
  triggers (`card-dialog/card-dialog-ref.ts`).

### Editorial sidebar

`EditorialSidebarComponent` (`src/app/features/editorial-sidebar`) is the same component on every
page — workspace, search, collections and the render page each mount it with a different
`primaryMode`, and that decides the option list. Its options are `OptionItem`s, gated exactly like
the context-menu entries. Covered in `editorial-sidebar.spec.ts`, `chromium` only (below 900px the
sidebar becomes a full-screen overlay).

| Option | Opened via |
| --- | --- |
| option overview, with and without a selection | edge tab at the right screen edge |
| `PREVIEW` | workspace → select a node → `EDITORIAL.OPTIONS.PREVIEW` |
| `VERSION_MANAGEMENT` | same, `…VERSION_MANAGEMENT` — this is where `OPTIONS.VERSION_MANAGEMENT` of the node context menu leads |
| `VIEWS_AND_USAGE` | same, `…VIEWS_AND_USAGE` |
| `MANAGE_CONTENT` | same, `…MANAGE_CONTENT` |
| `SORT_INTO` | workspace **inside a folder** → `…SORT_INTO` (its `customShowCallback` needs a folder or map parent, so it never appears in the workspace root) |
| `ADD_COLLECTION` | collections page → `…ADD_COLLECTION` |

Not covered: `MANAGE_SUBMISSION` and `VIEW_ASSIGNMENT` (editorial page with assignments — a page
type of its own) and `SHARE_QR` (`scopes: ['activity']`, likewise editorial page only; the QR dialog
itself is covered through the render page).

Three things the sidebar needs from the mock that are easy to miss:

* the edge tab is rendered into a **body-level CDK overlay**, so it is not below `es-edge-toggle`
  in the DOM — that host element stays empty by design. `AppPage.openSidebar()` clicks
  `.edge-toggle.side-end`.
* the option list only fills once nodes are selected through the list's **checkbox**; a plain row
  click navigates instead of selecting (`AppPage.selectRow`).
* the node picker's collection tree writes `collection.parent.id`, so every mocked collection needs
  a `parent`. Without it the assignment throws, the enclosing async initializer rejects, and the
  tree stays on its spinner forever — with no failing request to point at it.

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
