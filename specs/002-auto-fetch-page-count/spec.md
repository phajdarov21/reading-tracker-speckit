# Feature Specification: Automatic Page Count on Add

**Feature Branch**: `002-auto-fetch-page-count`

**Created**: 2026-08-16

**Status**: Draft

**Input**: User description: "Reading Tracker — Change Request 02: Modify F02 so that when a user adds a book from search results, the system automatically retrieves the total page count from Open Library instead of requiring manual entry. If Open Library does not provide a page count, the user is asked to enter it manually (same validation as before: whole number greater than zero). This is a change to the existing, already-implemented Reading Tracker application; all other requirements are unchanged."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add a book without typing its page count (Priority: P1)

A user searches for a book, selects a result to add, chooses the initial category, and confirms the add — without being asked to type in the total number of pages, because the system already knows it from Open Library.

**Why this priority**: This is the entire purpose of the change: removing an unnecessary manual data-entry step that duplicates information Open Library already provides. It replaces the current behavior for every "add a book" action, so it must work correctly for the app to be usable at all.

**Independent Test**: Can be fully tested by searching for a book known to have Open Library page data, adding it while choosing only a category, and confirming it appears in the personal list with the correct total page count pre-filled by the system (not typed by the user).

**Acceptance Scenarios**:

1. **Given** the user is viewing search results for a book that has page count data available from Open Library, **When** the user adds it to their list and chooses a category, **Then** the book is added with its total pages set automatically from Open Library, and the user is not prompted to type a page count.
2. **Given** a book has just been added automatically with its page count from Open Library, **When** the user views it in their personal list, **Then** the displayed total pages matches the value Open Library reported for that book.
3. **Given** a book is already in the personal list, **When** the user tries to add the same book (same Open Library ID) again, **Then** the system rejects the addition and explains that the book is already on the list, exactly as before this change.

---

### User Story 2 - Manually enter pages when Open Library has no page count (Priority: P2)

A user tries to add a book for which Open Library does not report a page count. The system asks the user to enter the total number of pages manually, using the same validation as before, before the book is added.

**Why this priority**: Open Library's data is incomplete for some books, so this fallback is required for the feature to work for the full catalog of addable books; it is secondary to the primary automatic path because it only triggers for a subset of books.

**Independent Test**: Can be fully tested by adding a book known to lack Open Library page data and confirming the system prompts for manual page entry, accepts a valid whole number greater than zero, and adds the book with that value as its total pages.

**Acceptance Scenarios**:

1. **Given** the user selects a search result to add whose Open Library data has no page count, **When** the system attempts to retrieve the page count, **Then** the user is prompted to manually enter the total number of pages before the book can be added.
2. **Given** the user is prompted for manual page entry, **When** they enter a whole number greater than zero, **Then** the book is added to the list with that value as its total pages.
3. **Given** the user is prompted for manual page entry, **When** they enter zero, a negative number, or a non-whole number, **Then** the system rejects the input with a clear error message and the book is not added.
4. **Given** the user is prompted for manual page entry, **When** they choose not to complete the entry, **Then** the book is not added to the list.

---

### Edge Cases

- What happens when Open Library reports a page count of zero for a book? Treated the same as "no page count provided" — the user is prompted to enter pages manually (a page count must be greater than zero, consistent with existing validation).
- What happens when the Open Library page count lookup fails or times out for an otherwise-selectable search result (service error, not simply missing data)? The system falls back to the same manual page-entry prompt used when the data is missing, rather than blocking the add entirely or failing unexpectedly.
- What happens when the user is prompted for manual pages and the same book has since been added from another interaction? Duplicate prevention by Open Library ID still applies at the moment the add is finalized.
- What happens to the initial-category choice when the manual page-entry fallback is triggered? The previously chosen category is preserved and used when the book is finally added.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-004 (modified)**: When the user adds a book from search results, the system MUST automatically retrieve the total page count for that book from Open Library and use it as the book's total pages, without requiring the user to enter it manually. The user MUST still choose the initial category (want to read / reading / finished) as before. Duplicate prevention by Open Library ID (FR-005) is unchanged.
- **FR-004a (new)**: If Open Library does not provide a usable page count (missing, or not greater than zero) for the selected book, the system MUST prompt the user to manually enter the total number of pages before the book can be added, applying the same validation as before: the value MUST be a whole number greater than zero. The book MUST NOT be added until a valid value is supplied or the user cancels.

### Key Entities

- **List Entry (Book on the list)**: Unchanged in structure. The **source** of its total pages value is now either "Open Library" (automatic) or "user-entered" (fallback); the stored total pages value and its validation rule (whole number greater than zero) are otherwise unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: When adding a book whose Open Library data includes a page count, a user can add it to their list by choosing only a category — no manual page entry step is shown.
- **SC-002**: 100% of books added via the automatic path have a total page count that matches the value reported by Open Library for that book.
- **SC-003**: When Open Library provides no usable page count, 100% of add attempts prompt the user for manual entry, and no book is added with a missing, zero, or negative total page count.
- **SC-004**: Manually entered page counts are validated with the same rule as before this change (whole number greater than zero), with no regression in rejection of invalid values.

## Assumptions

- "Open Library ID" refers to the same identifier already used for duplicate prevention (Open Library work ID) prior to this change; this change does not alter that identifier or the duplicate-prevention logic.
- The Open Library page count field already used in this application's existing search integration (e.g., an edition or work-level page count field) is the source consulted for FR-004; no new external service is introduced.
- A page count of zero from Open Library is treated as "not provided," consistent with the existing rule that total pages must be greater than zero.
- This change affects only how the total pages value is obtained at add time; it does not alter progress calculation, category behavior, filtering, statistics, or removal, all of which remain governed by the original specification.
- If the Open Library lookup for page count fails due to a service error (as opposed to the data simply being absent), the system degrades to the same manual entry fallback rather than blocking the add or surfacing a raw error, consistent with the existing principle of graceful handling of external service issues.
