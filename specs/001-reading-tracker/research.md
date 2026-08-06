# Phase 0 Research: Reading Tracker

The technology stack (Node.js + Express, SQLite, plain HTML/CSS/JS, Jest) was fixed by the user
and is not re-litigated here. This document resolves the remaining implementation-approach
decisions needed before design (Phase 1) can proceed.

## 1. SQLite driver for Node.js

**Decision**: `better-sqlite3`.

**Rationale**: It is synchronous, which keeps route handlers simple (no promise/callback wrapping
for straightforward reads/writes) and avoids a class of race conditions when checking-then-writing
(e.g., duplicate-book checks). It has first-class parameterized-statement support
(`db.prepare(sql).run(...params)` / `.get(...params)` / `.all(...params)`), directly satisfying
Constitution Principle II. It is widely used, actively maintained, and has no native-build
surprises beyond the standard prebuilt binaries.

**Alternatives considered**:
- `sqlite3` (node-sqlite3): callback/promise-based, more ceremony for the same parameterized
  queries, and its async nature complicates the "reject a duplicate add" check-then-insert flow.
- `node:sqlite` (Node's built-in experimental module): avoids a dependency, but is still
  experimental/version-gated in Node 20 LTS; not worth the stability risk for a feature that
  needs to "just work" for a single user.

## 2. HTTP endpoint testing strategy

**Decision**: Jest + `supertest`, driving the real Express app (with an isolated, per-test SQLite
file or in-memory database) rather than mocking the HTTP layer.

**Rationale**: Supertest lets contract and integration tests issue real HTTP requests against the
Express `app` object without binding a network port, directly exercising routing, validation, and
persistence together — closest to how the app is actually used. This matches Constitution
Principle V (Jest-based coverage of functional requirements) and lets each user story (US1–US5)
become one integration test file that walks its acceptance scenarios.

**Alternatives considered**:
- Testing route handler functions in isolation with mocked req/res: faster, but misses
  Express-level concerns (routing, JSON parsing, error middleware) and duplicates effort already
  covered by validation unit tests.
- End-to-end browser testing (e.g., a headless browser tool): out of scope — no such tool is part
  of the fixed stack, and the spec's acceptance scenarios are all verifiable at the API layer plus
  targeted unit tests for pure display logic (e.g., progress rounding).

## 3. Open Library integration approach

**Decision**: A single backend service module (`services/openLibraryClient.js`) is the only code
that talks to Open Library. The browser never calls Open Library directly.

- **Search**: `GET https://openlibrary.org/search.json?q=<query>&limit=20` (the 20-result cap from
  spec FR-001 is passed straight through as the API's own `limit` parameter, avoiding an
  over-fetch-then-truncate step).
- **Covers**: cover image URLs are built directly from the `cover_i` field Open Library already
  returns in search results (`https://covers.openlibrary.org/b/id/<cover_i>-M.jpg`); no separate
  cover lookup call is needed, and books without a `cover_i` simply render without a cover image.
- **Identifying header**: every request sets `User-Agent: reading-tracker/1.0 (<contact email>)`,
  per Open Library's API guidelines and Constitution Principle IV.
- **Rate limiting**: a minimal in-process request queue/timer enforces a minimum spacing between
  outgoing requests (~333ms, i.e. no more than 3 requests/second) so the app self-throttles rather
  than relying on the remote service to reject overuse.
- **Failure handling**: network errors, non-2xx responses, and timeouts are caught in this module
  and translated into a single "search is temporarily unavailable" error surfaced to the caller,
  never an unhandled exception (Constitution Principle IV, spec FR-015).

**Rationale**: Centralizing all outbound calls in one module is the simplest way to guarantee the
header/rate-limit/cache/error-handling rules are applied consistently and can be unit-tested once,
rather than re-implemented at every call site.

**Alternatives considered**:
- Calling Open Library directly from the browser: rejected — cannot reliably enforce a shared
  rate limit or a stable User-Agent from client-side JS, and would leak the external dependency
  into the "no dependency on external services for viewing stored data" boundary (Constitution
  Principle III).
- A generic HTTP-caching library/proxy: unnecessary complexity for a single-user app; a small
  hand-rolled in-memory `Map` (query string → results) fully satisfies FR-016/SC-007 (Constitution
  Principle VI, minimal technology surface).

## 4. Session-scoped search cache

**Decision**: An in-memory `Map` inside `openLibraryClient.js`, keyed by the normalized (trimmed,
case-folded) search query string, storing the parsed result list. Cleared only on process restart.

**Rationale**: Directly satisfies FR-016/SC-007 ("identical queries reused within a session,
cache cleared on restart") with no added infrastructure (no Redis, no disk cache), consistent with
Constitution Principle VI.

**Alternatives considered**:
- Persisting the cache to SQLite: rejected — spec explicitly scopes the cache to "while the
  application is running" (session-scoped), which a persistent store would violate by surviving
  restarts; it would also blur the line with the intentionally-persistent personal list (FR-014).

## 5. Static frontend without a build step

**Decision**: Plain `public/index.html` + `public/css/styles.css` + `public/js/*.js`, loaded via a
native `<script type="module">` tag, served by Express's built-in `express.static` middleware.
`js/api.js` wraps `fetch()` calls to the backend JSON API; `js/app.js` handles rendering and DOM
event wiring for search, the list, filtering, progress updates, remove-confirmation, and stats.

**Rationale**: Native ES modules let the JS be split into a couple of readable files without any
bundler, satisfying Constitution Principle VI (no frontend frameworks, no build step) while still
keeping the code organized.

**Alternatives considered**:
- A single monolithic `app.js`: simpler tooling-wise but harder to keep readable as five user
  stories' worth of UI logic accumulate; native modules solve this without introducing a build
  step.

## 6. Database schema initialization

**Decision**: On server startup, `db/database.js` opens the SQLite file (creating it if absent)
and runs `db/schema.sql` (`CREATE TABLE IF NOT EXISTS books (...)`) synchronously before the
Express app starts listening.

**Rationale**: Guarantees the schema exists before any request can be served, with no separate
migration tool needed for a single-table, single-user schema — consistent with Constitution
Principle VI.

**Alternatives considered**:
- A dedicated migration framework: unnecessary ceremony for one table with no anticipated schema
  churn; would add a dependency with no offsetting benefit at this scale.
