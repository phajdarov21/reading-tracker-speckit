# Quickstart: Automatic Page Count on Add

Validates this change end-to-end against the user stories in spec.md, on top of the existing
`001-reading-tracker` app (same run/test commands — see
`specs/001-reading-tracker/quickstart.md` for the full baseline walkthrough). This guide covers only
what's new or changed for the add-book flow.

## Prerequisites

Same as `001-reading-tracker`: Node.js 20 LTS, `npm install`, network access to `openlibrary.org`
for the auto-fill scenario (the manual-fallback scenario can be exercised offline once search
results are already in hand, or by choosing a book known to lack Open Library page data).

## Run the app / tests

```bash
npm start   # serves the app at http://localhost:3000
npm test    # full Jest suite, including this change's new/updated cases (see plan.md Project Structure)
```

## Manual validation scenarios

### US1 — Add a book without typing its page count (P1)

1. Search for a title known to have Open Library edition data (e.g., "Fantastic Mr Fox").
   `GET /api/search?q=...` — confirm each result now includes a `pageCount` (contracts/api.md).
2. In the UI, add that result choosing only a category. Confirm no "Total pages" field is shown or
   required, and the book is added (`POST /api/books`) with `totalPages` equal to the result's
   `pageCount`.
3. View the added book in the list (`GET /api/books`). Confirm `totalPages` matches what Open
   Library reported.
4. Attempt to add the same book again (same `openLibraryWorkId`). Confirm the existing "already on
   your list" rejection (409) still occurs, unchanged from `001-reading-tracker`.

### US2 — Manual entry when Open Library has no page count (P2)

1. Search for (or otherwise obtain via `GET /api/search?q=...`) a result whose `pageCount` is
   `null`.
2. In the UI, choose to add that result and select a category. Confirm the existing "Total pages"
   input is shown and required before the add can proceed.
3. Submit with a valid whole number greater than zero. Confirm the book is added
   (`POST /api/books`) with that value as `totalPages`.
4. Submit with `0`, a negative number, or a non-whole number. Confirm the existing validation
   rejection is shown ("Total pages must be a whole number greater than zero.") and the book is not
   added.
5. Abandon the manual-entry prompt without submitting. Confirm the book is not added to the list.

### Regression check — everything else from `001-reading-tracker`

Run through (or rely on the automated suite for) `001-reading-tracker`'s US2–US5 scenarios
(progress tracking, filtering, statistics, removal) and the persistence/offline/search-caching
scenarios unchanged — none of that behavior is affected by this change; see
`specs/001-reading-tracker/quickstart.md` for the full list.
