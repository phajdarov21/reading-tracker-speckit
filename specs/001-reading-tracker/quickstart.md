# Quickstart: Reading Tracker

Validates the feature end-to-end against the user stories in spec.md. Assumes the project has
been scaffolded per the Project Structure in plan.md.

## Prerequisites

- Node.js 20 LTS installed.
- Dependencies installed: `npm install` (Express, the SQLite driver, Jest, Supertest — see
  research.md for choices).
- Network access to `openlibrary.org` and `covers.openlibrary.org` for the search scenarios below
  (the persistence/offline scenario intentionally tests the case where this is unavailable).

## Run the app

```bash
npm start
```

Starts the Express server (creates the SQLite file and schema on first run per data-model.md) and
serves the frontend from `public/` at `http://localhost:3000` (or the configured port).

## Run the automated tests

```bash
npm test
```

Runs the full Jest suite: contract tests (one per endpoint in contracts/api.md), integration tests
(one per user story below), and unit tests (validation, progress calculation, statistics
calculation). This is the primary way functional requirements are verified, per Constitution
Principle V.

## Manual validation scenarios

Each scenario maps to a user story in spec.md and can be run either through the browser UI at
`http://localhost:3000` or by calling the API directly (`curl`/HTTP client) per contracts/api.md.

### US1 — Find and add a book (P1)

1. Search for a known title (e.g., "Fantastic Mr Fox"). Expect results with title, author, year,
   and cover image where available, capped at 20 (`GET /api/search?q=...`).
2. Add one result, choosing a category and total pages (`POST /api/books`). Expect it to appear in
   the personal list.
3. Attempt to add the same result again. Expect a clear "already on your list" rejection (409).
4. Search with an empty query. Expect a clear validation message, not a crash or empty result set.

### US2 — Track reading progress (P2)

1. View the list (`GET /api/books`). Expect title, author, category, and progress percent per
   book.
2. Update a book's current page to a value between 0 and its total pages (`PATCH /api/books/:id`).
   Expect the returned `progressPercent` to equal `round(currentPage / totalPages * 100)`.
3. Change a "reading" book's category to "finished". Expect `progressPercent` to become 100
   automatically, without supplying a page number.
4. Attempt to set current page above total pages or negative. Expect a clear rejection (400).
5. Update current page to exactly the total. Expect 100% progress but category unchanged until an
   explicit category change is made (Clarifications session).

### US3 — Filter by category (P3)

1. With books in more than one category, request each filter value in turn
   (`GET /api/books?category=...`). Expect only matching books back, and all books for `all`.

### US4 — View statistics (P4)

1. With books across categories, call `GET /api/stats`. Expect correct per-category counts and
   total finished count.
2. With multiple "reading" books at different progress levels, expect
   `averageReadingProgress` to match their average.
3. With zero "reading" books, expect `averageReadingProgress` to be `0`, not an error.

### US5 — Remove a book (P5)

1. Remove a book (`DELETE /api/books/:id`) after confirming in the UI (or calling the endpoint
   directly to simulate a confirmed removal). Expect it gone from subsequent `GET /api/books` and
   `GET /api/stats` calls.
2. In the UI, open the remove confirmation and cancel it. Expect the book to remain unchanged.

### Persistence & offline resilience (FR-014, FR-015, SC-003, SC-004)

1. Add a few books, then restart the server process (`Ctrl+C`, `npm start` again). Expect
   `GET /api/books` and `GET /api/stats` to return the same data with no loss.
2. Simulate Open Library being unreachable (e.g., disconnect network) and call
   `GET /api/search?q=...`. Expect a clear error response, not a crash — and confirm
   `GET /api/books`/`GET /api/stats` still work normally, since they never call Open Library.

### Search caching (FR-016, SC-007)

1. Run the same search query twice in the same running session. The second call should be served
   from the in-memory cache described in research.md rather than issuing a new request to Open
   Library (observable via server logs or a request counter in a test double during automated
   testing).
