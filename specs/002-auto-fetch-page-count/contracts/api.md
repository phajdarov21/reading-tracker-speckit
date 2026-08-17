# Phase 1 API Contract Delta: Automatic Page Count on Add

This documents only the change to `specs/001-reading-tracker/contracts/api.md`. Every endpoint not
listed below (`GET /api/books`, `PATCH /api/books/:id`, `DELETE /api/books/:id`, `GET /api/stats`)
is unchanged.

## `GET /api/search?q=<query>` — response shape modified

Unchanged: query param, 400 (empty query, FR-003), 502 (Open Library unavailable, FR-015), and the
20-result cap (FR-001).

**200 response** — each result gains a `pageCount` field:

```json
{
  "results": [
    {
      "openLibraryWorkId": "OL45804W",
      "title": "Fantastic Mr Fox",
      "author": "Roald Dahl",
      "firstPublishYear": 1970,
      "coverUrl": "https://covers.openlibrary.org/b/id/12345-M.jpg",
      "pageCount": 96
    }
  ]
}
```

- `pageCount`: integer greater than 0 when Open Library reported a usable page count for this
  result, otherwise `null` (research.md §2). No new error responses are introduced by this field —
  it is informational only and never itself causes a `400`/`502`.

## `POST /api/books` — request contract unchanged, semantics clarified

**Request body**: identical shape to `001-reading-tracker` — `openLibraryWorkId`, `title`, `author`,
`firstPublishYear`, `coverUrl`, `category`, `totalPages`. `totalPages` is still required and still
validated as a whole number `> 0` (`validateTotalPages`, unchanged).

- **What changes**: the *caller's* source for `totalPages` (FR-004/FR-004a) — normally copied
  automatically from the matching search result's `pageCount`, or collected from the user via a
  manual-entry prompt when that result's `pageCount` was `null`. The server does not need to know
  which path produced the value.
- **200/201/400/409 responses**: unchanged from `001-reading-tracker`'s contract, including the
  existing `400` message `"Total pages must be a whole number greater than zero."` when `totalPages`
  fails validation, which now also covers the manual-fallback path (FR-004a) in addition to the
  original always-manual flow it already covered.
