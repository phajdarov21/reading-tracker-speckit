# Phase 1 API Contract: Reading Tracker

All endpoints are served by the Express backend under `/api`. Request and response bodies are
JSON. All inputs are validated server-side per data-model.md; validation failures return `400`
with a body of the shape `{ "error": "<clear, human-readable message>" }` and never crash the
server (Constitution Principle I).

## `GET /api/search?q=<query>`

Searches Open Library by title or author (FR-001).

- **Query params**: `q` — required, non-empty string (trimmed).
- **200 response**:
  ```json
  {
    "results": [
      {
        "openLibraryWorkId": "OL45804W",
        "title": "Fantastic Mr Fox",
        "author": "Roald Dahl",
        "firstPublishYear": 1970,
        "coverUrl": "https://covers.openlibrary.org/b/id/12345-M.jpg"
      }
    ]
  }
  ```
  At most 20 results (FR-001). `firstPublishYear` and `coverUrl` may be `null`.
- **400 response**: empty/missing `q` → `{ "error": "Please enter a search term." }` (FR-003).
- **502 response**: Open Library unreachable or errored →
  `{ "error": "Book search is temporarily unavailable. Please try again later." }` (FR-015).

## `GET /api/books?category=<category>`

Returns the personal list, optionally filtered (FR-006, FR-007).

- **Query params**: `category` — optional; one of `all`, `want_to_read`, `reading`, `finished`
  (default `all`). Any other value → `400`.
- **200 response**:
  ```json
  {
    "books": [
      {
        "id": 1,
        "openLibraryWorkId": "OL45804W",
        "title": "Fantastic Mr Fox",
        "author": "Roald Dahl",
        "firstPublishYear": 1970,
        "coverUrl": "https://covers.openlibrary.org/b/id/12345-M.jpg",
        "category": "reading",
        "totalPages": 96,
        "currentPage": 40,
        "progressPercent": 42
      }
    ]
  }
  ```

## `POST /api/books`

Adds a book from a search result to the personal list (FR-004).

- **Request body**:
  ```json
  {
    "openLibraryWorkId": "OL45804W",
    "title": "Fantastic Mr Fox",
    "author": "Roald Dahl",
    "firstPublishYear": 1970,
    "coverUrl": "https://covers.openlibrary.org/b/id/12345-M.jpg",
    "category": "want_to_read",
    "totalPages": 96
  }
  ```
  `category` required, one of `want_to_read`/`reading`/`finished`. `totalPages` required integer
  > 0. `openLibraryWorkId`, `title`, `author` required non-empty strings. `firstPublishYear`,
  `coverUrl` optional.
- **201 response**: the created List Entry (same shape as an item in `GET /api/books`), with
  `currentPage` set to `0` (or to `totalPages` if `category` is `finished`, per data-model.md) and
  `progressPercent` set accordingly.
- **400 response**: any validation failure (FR-013), e.g.
  `{ "error": "Total pages must be greater than zero." }`.
- **409 response**: `openLibraryWorkId` already present among current rows →
  `{ "error": "This book is already on your list." }` (FR-005).

## `PATCH /api/books/:id`

Updates a book's category and/or current page (FR-008, FR-010). At least one of `category`,
`currentPage` must be present.

- **Request body** (either or both fields):
  ```json
  { "category": "finished" }
  ```
  or
  ```json
  { "currentPage": 55 }
  ```
- **200 response**: the updated List Entry. If `category` becomes `finished`, `currentPage` and
  `progressPercent` are forced to 100% server-side regardless of any `currentPage` also sent in
  the same request (FR-009). A `currentPage` update alone never changes `category`, even at 100%
  (FR-010, Clarifications).
- **400 response**: unknown `id`, invalid `category` value, or `currentPage` outside
  `0..totalPages` → clear error message (FR-013).

## `DELETE /api/books/:id`

Removes a book from the personal list (FR-011). The confirmation step required by FR-011 is a
client-side prompt before this request is sent; the server performs the deletion unconditionally
once called.

- **204 response**: no body; the row is deleted (and its `openLibraryWorkId` becomes free to
  re-add, per data-model.md).
- **404 response**: unknown `id` → `{ "error": "Book not found." }`.

## `GET /api/stats`

Returns reading statistics (FR-012).

- **200 response**:
  ```json
  {
    "countsByCategory": { "want_to_read": 3, "reading": 2, "finished": 5 },
    "totalFinished": 5,
    "averageReadingProgress": 42
  }
  ```
  `averageReadingProgress` is `0` when no books are in the `reading` category (spec.md
  Assumptions).
