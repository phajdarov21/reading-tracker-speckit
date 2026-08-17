# Phase 0 Research: Automatic Page Count on Add

The technology stack is unchanged from `001-reading-tracker` (Node.js + Express, SQLite via
`better-sqlite3`, plain HTML/CSS/JS, Jest) and is not re-litigated here. This document resolves the
one implementation-approach question this change introduces: how to obtain a book's total page
count from Open Library automatically.

## 1. Source of the page count value

**Decision**: Read the page count off the `number_of_pages_median` field on the same
`openlibrary.org/search.json` request `src/services/openLibraryClient.js` already makes for FR-001
(title/author/year/cover). No additional Open Library endpoint is called — but the existing request
URL must explicitly ask for this field via the `fields` query parameter, alongside every field the
client already reads.

**Correction (found during `/speckit-implement` manual verification, 2026-08-16)**: this document
originally assumed `number_of_pages_median` rides along in Open Library's *default* `search.json`
response with no request change needed. Live verification against the real API during
implementation (T006) showed this is false: Open Library's default field set does **not** include
`number_of_pages_median` (confirmed by inspecting an unfiltered response's `docs[0]` keys), so every
result came back with `pageCount: null` regardless of the book. The fix, applied in
`src/services/openLibraryClient.js`, is to add `&fields=key,title,author_name,first_publish_year,
cover_i,number_of_pages_median` to the request — specifying `fields` at all replaces Open Library's
default set, so every field `mapDoc()` reads had to be listed explicitly, not just the new one.
Re-verified live afterward: e.g. a search for "harry potter philosopher" now returns
`number_of_pages_median: 302` for the matching edition.

**Rationale**:
- Open Library's Search API can return `number_of_pages_median` for docs where edition-level page
  data exists, when explicitly requested via `fields`, alongside the fields the app already consumes
  (`key`, `title`, `author_name`, `first_publish_year`, `cover_i`). It requires no new endpoint and
  no change to the existing throttling/caching behavior in `openLibraryClient.js` — only the query
  string of the one request already being made changes.
- It keeps the change to a pure mapping-plus-query-parameter addition (`mapDoc()` gains one more
  field; the request URL gains one more parameter), which is the smallest change that satisfies
  spec.md FR-004 ("automatically retrieve the total page count from Open Library") while respecting
  the user's explicit direction that this is a functionality-only change on the same stack.
- It keeps Constitution Principle IV intact by construction: the number of outbound Open Library
  requests per search is unchanged (still one request per uncached query, per FR-016/FR-017); only
  that single request's query string grew by one parameter.

**Alternatives considered**:
- **A per-book lookup against the Editions API** (`/works/{id}/editions.json`) at add time, to get a
  more authoritative single-edition page count: rejected. It would add a second Open Library
  endpoint and a second round of User-Agent/rate-limit/error-handling logic to build and test for a
  single-user app where the search API's median value is already "good enough" to remove the manual
  step for the common case; it would also add one additional external request per add (or per
  search-result view), working against Constitution IV's "avoid redundant calls" spirit and this
  change's "functionality-only, same stack" scope.
- **A per-book lookup against the Work API** (`/works/{id}.json`): rejected for the same reasons —
  the work-level document does not reliably carry a single page count either (page counts are an
  edition-level property in Open Library's data model), so it would not even improve accuracy enough
  to justify the added call.

## 2. Treating a missing or zero page count

**Decision**: `pageCount` is treated as "usable" only when Open Library returns a positive integer
for `number_of_pages_median`. Missing, `0`, or a non-integer value all resolve to `null` in the
mapped search result, which the frontend treats identically to "not provided" and triggers the
FR-004a manual-entry fallback.

**Rationale**: Matches the existing `total_pages > 0` validation rule (`validateTotalPages`,
unchanged) exactly, so there is only one definition of "a valid page count" in the system, and it is
consistent with spec.md's Edge Cases section ("a page count of zero ... is treated the same as 'no
page count provided'").

**Alternatives considered**:
- Passing through `0` or other non-positive values and letting the existing `POST /api/books`
  validation reject them after the fact: rejected — it would silently attempt an add with a known-bad
  value instead of proactively prompting for manual entry, producing a confusing "why is it asking me
  to fix a number I never typed" error instead of the fallback prompt spec.md FR-004a calls for.

## 3. Where the fallback decision is made

**Decision**: The fallback decision (auto-fill vs. prompt for manual entry) is made client-side, in
`public/js/app.js`, based on the `pageCount` value already present in the search result the user is
adding. `POST /api/books` keeps its existing, unmodified server-side requirement that `totalPages`
be a whole number greater than zero (`validateTotalPages`), regardless of whether that value was
auto-filled or typed by the user.

**Rationale**: The existing architecture already has the frontend assemble the `POST /api/books`
body entirely from data already in hand (the search result plus user-chosen category) — see
`createResultCard()` in `public/js/app.js`. Extending that same pattern to include an
auto-filled-or-prompted `totalPages` is the smallest change consistent with the existing code, and
the server-side validation that already exists (Constitution Principle I) is exactly what keeps this
safe: the server does not need to know or care whether a given `totalPages` value was auto-filled or
manually entered, because it validates the value itself either way.

**Alternatives considered**:
- Making the fallback decision server-side (e.g., `POST /api/books` accepts an optional `totalPages`
  and only the server decides whether to accept, reject, or request more info): rejected — it would
  require a new "needs more info" response shape/status code and a second round-trip protocol for
  what is otherwise a single, already-known value sitting in the search result the client already
  has from `GET /api/search`; unnecessary complexity for a single-user app with no untrusted clients
  (Constitution Principle VI).
