# Phase 1 Data Model: Automatic Page Count on Add

This is a delta on top of `specs/001-reading-tracker/data-model.md`. Only the parts of the model
that change are described here; everything not mentioned (the `books` table, Statistics) is
unchanged.

## Entity: List Entry (`books` table) — unchanged

No schema change. `total_pages` remains `integer`, required, must be `> 0` (FR-013, unchanged). The
only difference introduced by this feature is **how** the value that gets validated and stored is
obtained before it reaches the existing insert path — not the column, its type, or its validation
rule.

## Transient shape: Search Result — modified

Adds one field, `pageCount`, carrying the page count Open Library reported for the result (if any).
Not persisted, same as the rest of this shape (spec.md Key Entities: "the stored total pages value
and its validation rule are otherwise unchanged").

| Field | Type | Notes |
|---|---|---|
| `open_library_work_id` | text | Unchanged |
| `title` | text | Unchanged |
| `author` | text | Unchanged |
| `first_publish_year` | integer or null | Unchanged |
| `cover_url` | text or null | Unchanged |
| `pageCount` | integer or null | **New.** Sourced from Open Library's `number_of_pages_median` field on the same search response (research.md §1). `null` when Open Library did not report a positive integer value for this field (missing, zero, or non-integer — research.md §2) |

**Validation / usability rule** (client-side UX, not a new server validation rule):
- `pageCount` is treated as *usable* only when it is an integer greater than 0 — the same threshold
  `validateTotalPages` already enforces server-side. When usable, the add-book flow (User Story 1)
  uses it as `totalPages` automatically and does not prompt the user. When not usable (`null`), the
  add-book flow instead prompts for manual entry (User Story 2 / FR-004a), reusing the same
  server-side `validateTotalPages` rule (whole number > 0) that already exists.

## Add-book request shape (client → `POST /api/books`) — unchanged

The request body accepted by `POST /api/books` is unchanged from `001-reading-tracker`
(`openLibraryWorkId`, `title`, `author`, `firstPublishYear`, `coverUrl`, `category`, `totalPages`).
What changes is only how the caller (the frontend) arrives at the `totalPages` value it sends:
copied automatically from the search result's `pageCount` when usable, or collected from the user
via the existing manual-entry input when not. The server has no way to distinguish, and does not
need to (data-model.md's existing validation rule — required integer `> 0` — is unconditionally
sufficient for both cases).

## State/flow addition: Add-book fallback

Not a data entity, but a short-lived client-side flow state worth documenting since spec.md FR-004a
introduces it:

1. User selects a search result to add and chooses a category.
2. If the result's `pageCount` is usable → `totalPages` is set from it; the add proceeds directly.
3. If not → the user is shown the manual "Total pages" input (already present in the UI) and must
   enter a valid value before the add can proceed; the previously chosen category is retained
   (spec.md Edge Cases) and reused when the add is finally submitted.
4. Either way, the single `POST /api/books` call and its existing validation/duplicate-check
   behavior (FR-005, FR-013) are unchanged.
