# Phase 1 Data Model: Reading Tracker

## Entity: List Entry (`books` table)

Represents a book the user has added to their personal reading list. This is the only persisted
entity — it stores both the identifying details captured from Open Library at add time and the
user's own tracking data, per spec.md's Key Entities section.

| Field | Type | Constraints / Notes |
|---|---|---|
| `id` | integer | Primary key, auto-generated |
| `open_library_work_id` | text | Required; unique among rows currently in the table (enforces FR-005's "no duplicate while on the list" rule — a `UNIQUE` constraint on this column, satisfied naturally since removed rows are deleted, not soft-deleted, per the re-add clarification) |
| `title` | text | Required; captured from the search result at add time |
| `author` | text | Required; captured from the search result at add time |
| `first_publish_year` | integer | Optional (nullable) — not every Open Library work has one |
| `cover_url` | text | Optional (nullable) — built from the search result's `cover_i`; absent when no cover is available |
| `category` | text | Required; one of `want_to_read`, `reading`, `finished` (FR-004, FR-008) |
| `total_pages` | integer | Required; must be > 0 (FR-013) |
| `current_page` | integer | Required; must be between 0 and `total_pages` inclusive (FR-013) |
| `progress_percent` | integer | Derived/stored value, always equal to `round(current_page / total_pages * 100)`, rounded to a whole number per spec.md Assumptions; recomputed on every write to `current_page` or `category` |
| `created_at` | text (ISO 8601) | Set once, at insert time |

**Validation rules** (enforced server-side before any write, per Constitution Principle I / FR-013):
- `category` MUST be exactly one of `want_to_read`, `reading`, `finished`; any other value is
  rejected with a clear error.
- `total_pages` MUST be an integer greater than 0.
- `current_page` MUST be an integer with `0 <= current_page <= total_pages`.
- `open_library_work_id` MUST be non-empty and MUST NOT already exist among current rows when
  adding a book (duplicate check, FR-005); a removed book's `open_library_work_id` is free to be
  reused since its row no longer exists.

**State transitions** (category, per FR-008/FR-009 and the Clarifications session):
- `want_to_read` ↔ `reading` ↔ `finished`: any category is reachable from any other via an
  explicit user-initiated category change; there is no automatic transition.
- Moving **into** `finished` (from any other category): `current_page` is set to `total_pages` and
  `progress_percent` is set to 100, automatically (FR-009).
- Moving **out of** `finished` (to `want_to_read` or `reading`): `current_page` and
  `progress_percent` are left unchanged (spec.md Assumptions) — the user's last-recorded progress
  is preserved rather than reset.
- Updating `current_page` directly (independent of any category change) recomputes
  `progress_percent` but never changes `category`, even when `current_page` reaches `total_pages`
  (FR-010, Clarifications session).

**Relationships**: none — a single flat table; no foreign keys or joins are needed for this
feature.

## Transient shape: Search Result

Not persisted. Represents one row returned by an Open Library search, used only to let the user
identify and add a book (spec.md Key Entities).

| Field | Type | Notes |
|---|---|---|
| `open_library_work_id` | text | Identifies the work; becomes `open_library_work_id` if added |
| `title` | text | |
| `author` | text | First/primary author as returned by Open Library |
| `first_publish_year` | integer or null | |
| `cover_url` | text or null | Built from `cover_i` when present; null otherwise |

A search response is a list of at most 20 such rows (FR-001), sourced live from Open Library (or
from the in-memory session cache for a repeated identical query, per FR-016) and never written to
the database until/unless the user explicitly adds one (FR-004).

## Derived data: Statistics

Not stored; computed on demand from the current contents of the `books` table (spec.md
Assumptions), per FR-012:

- **Count per category**: `COUNT(*) GROUP BY category` over all rows.
- **Total finished**: `COUNT(*) WHERE category = 'finished'`.
- **Average reading progress**: `AVG(progress_percent) WHERE category = 'reading'`, rounded to a
  whole number; displayed as 0 when no rows match (spec.md Assumptions).
