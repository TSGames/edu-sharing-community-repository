# Mock backend

A dependency-free (Node built-ins only) stand-in for the edu-sharing repository backend.
It serves the built Angular application **and** a fixed set of REST responses from one process, so
the frontend can be validated in CI without Alfresco, Elasticsearch or Docker.

```
npm run prebuild        # once: build the libraries
npm run build:mock      # Angular build -> dist-mock/
npm run mock-backend    # http://127.0.0.1:4200/edu-sharing/
```

Credentials: `e2e` / `e2e` (or `admin` / `admin`). Everything else is rejected.

## Why a custom server

* **Deterministic.** Every timestamp, id and list order is fixed, which is what makes the
  screenshot baselines of `tests-mock/` comparable. A schema-driven mock (Prism) would generate
  changing sample data.
* **Stateful where it matters.** Login/logout and user preferences are real session state, so the
  login flow can be tested end to end.
* **Same origin.** App and API are served together, so the app's relative API root
  (`/edu-sharing/rest`) and `withCredentials: true` work without a proxy or CORS handling.
* **No new dependencies.** Only Node built-ins — nothing is added to `package.json` /
  `package-lock.json`.

## Layout

| Path | Purpose |
| --- | --- |
| `src/index.ts` | entry point |
| `src/server.ts` | HTTP handling: REST router, static assets, SPA fallback, miss logging |
| `src/router.ts` | small path router (`:param`, trailing `*`) |
| `src/session.ts` | cookie session + the accepted credentials |
| `src/models.ts` | structural types mirroring the OpenAPI schemas |
| `src/routes/*.ts` | one module per REST area |
| `src/fixtures/*.ts` | the response data (node corpus, collections, mds, config, …) |
| `assets/` | placeholder previews and icons |

## Unmocked endpoints

Anything under `/edu-sharing/rest` without a route answers **501** and is recorded in
`mock-backend/out/unmocked.log` (also a CI artifact). The Playwright suite fails when a test
triggers a 501, so a new frontend feature that needs a new endpoint shows up immediately instead of
silently rendering an error state.

To add one: implement the route in `src/routes/<area>.routes.ts`, put the data into
`src/fixtures/`, run `npm run build:mock-backend`.

## Keeping fixtures in sync with the API

`src/models.ts` mirrors `Backend/services/rest/api/src/main/resources/openapi.json` by hand — the
generated client (`ngx-edu-sharing-api`) only exists after `npm run prebuild`, and the mock has to
stay runnable without it. Required properties of a schema are required in `models.ts` too, so an
incomplete fixture fails `tsc`.

When the REST API changes, adjust `models.ts` (and the fixture) accordingly. To cross-check against
the generated models, temporarily import from `ngx-edu-sharing-api` in a scratch file after
`npm run prebuild`.

## Running the app without any backend

Useful for UI work:

```
npm run mock-backend                       # dist-mock build, port 4200
npm run mock-backend -- --api-only         # API only, e.g. next to `ng serve`
BACKEND_URL=http://127.0.0.1:4200 npm start   # ng serve proxying to the mock
```
