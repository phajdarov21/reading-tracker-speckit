# Feature Specification: Reading Tracker

**Feature Branch**: `001-reading-tracker`

**Created**: 2026-08-06

**Status**: Draft

**Input**: User description: "Reading Tracker — single-user web application for tracking personal reading: search books via the Open Library API, maintain a personal list organized into want to read / reading / finished categories, track reading progress, and view basic statistics. No authentication. The personal list must persist between application restarts."

## Clarifications

### Session 2026-08-06

- Q: If a user updates a book's current page so that it equals the total page count, should the book's category automatically change to "finished"? → A: No — reaching current page = total pages does not change category automatically; the user must explicitly move the book to "finished".
- Q: How many search results should the app show for a query — a small capped number, or the full result set Open Library returns? → A: Cap at approximately 20 results.
- Q: After a book is removed from the personal list, can the user add that same book again later, or is it permanently blocked from being re-added? → A: It can be re-added — removal is a real deletion, and the duplicate check only considers books currently on the list.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Find and add a book to the list (Priority: P1)

A user searches for a book by title or author, sees matching results with cover, title, author, and publication year, and adds one of them to their personal list under an initial category with the total number of pages.

**Why this priority**: Without the ability to search for and add books, there is no personal list to track — this is the foundation every other capability builds on.

**Independent Test**: Can be fully tested by searching for a known title, adding one result to the list with a category and page count, and confirming it now appears in the personal list. Delivers value on its own: the user has started building their reading list.

**Acceptance Scenarios**:

1. **Given** the user is on the search screen, **When** they search by a book title, **Then** matching results are shown with title, author, first publication year, and cover image when available.
2. **Given** search results are displayed, **When** the user adds a result to their list, choosing a category and entering total pages, **Then** the book appears in the personal list under that category with the given page count.
3. **Given** a book is already in the personal list, **When** the user tries to add the same book (same Open Library work) again, **Then** the system rejects the addition and explains that the book is already on the list.
4. **Given** the user submits a search with an empty query, **When** the search is processed, **Then** the system shows a clear message asking for a search term instead of returning results or failing.

---

### User Story 2 - Track reading progress (Priority: P2)

A user views their personal list, updates the current page for a book they are reading, and sees the progress percentage update. Moving a book to "finished" automatically completes its progress.

**Why this priority**: Tracking progress is the core ongoing value of the app once books are on the list — it's what a user returns to the app to do most often.

**Independent Test**: Can be fully tested by opening the personal list, updating a book's current page, and confirming the displayed progress percentage reflects current page divided by total pages; then moving a book to "finished" and confirming progress shows 100%.

**Acceptance Scenarios**:

1. **Given** a book is in the personal list, **When** the user views the list, **Then** they see its title, author, category, and progress percentage.
2. **Given** a book with a known total page count, **When** the user updates the current page, **Then** the displayed progress percentage recalculates as current page divided by total pages.
3. **Given** a book is in the "reading" category, **When** the user changes its category to "finished", **Then** its progress is automatically set to 100% without the user entering a page number.
4. **Given** a book's total page count is 200, **When** the user enters a current page greater than 200 or a negative number, **Then** the system rejects the update and shows a clear error message.
5. **Given** a book is in the "reading" category, **When** the user updates its current page to equal its total pages, **Then** progress shows 100% but the category remains "reading" until the user explicitly changes it.

---

### User Story 3 - Filter the list by category (Priority: P3)

A user narrows the personal list view to just one category (want to read / reading / finished) to focus on relevant books.

**Why this priority**: Useful for keeping a growing list organized, but the list is still usable without it since User Story 2 already shows category per book.

**Independent Test**: Can be fully tested by adding books to multiple categories, selecting each filter in turn, and confirming only books in the selected category are shown (and all books when "all" is selected).

**Acceptance Scenarios**:

1. **Given** the personal list contains books in all three categories, **When** the user selects a specific category filter, **Then** only books in that category are displayed.
2. **Given** a category filter is active, **When** the user selects "all", **Then** every book in the list is displayed regardless of category.

---

### User Story 4 - View reading statistics (Priority: P4)

A user views a summary of their reading activity: how many books are in each category, how many are finished in total, and the average progress of books currently being read.

**Why this priority**: A useful, motivating overview, but purely derived from data already captured by the higher-priority stories, so it delivers the least standalone value if built first.

**Independent Test**: Can be fully tested by populating the list with books across categories and progress values, then confirming the displayed counts per category, total finished count, and average "reading" progress match the underlying data.

**Acceptance Scenarios**:

1. **Given** the personal list has books in each category, **When** the user views statistics, **Then** the number of books per category and the total number of finished books are shown correctly.
2. **Given** one or more books are in the "reading" category with different progress values, **When** the user views statistics, **Then** the average progress across those books is shown correctly.
3. **Given** no books are in the "reading" category, **When** the user views statistics, **Then** the average reading progress is shown as zero rather than an error.

---

### User Story 5 - Remove a book from the list (Priority: P5)

A user removes a book they no longer want to track, after confirming the removal.

**Why this priority**: List cleanup is convenient but not required for the app's core value; a user can ignore unwanted entries and still benefit from the rest of the app.

**Independent Test**: Can be fully tested by removing a book from the list, confirming the removal when prompted, and verifying it no longer appears in the list or statistics.

**Acceptance Scenarios**:

1. **Given** a book is in the personal list, **When** the user chooses to remove it, **Then** the system asks for confirmation before deleting it.
2. **Given** the removal confirmation is shown, **When** the user confirms, **Then** the book is deleted from the list and no longer appears in the list view or statistics.
3. **Given** the removal confirmation is shown, **When** the user cancels, **Then** the book remains unchanged in the list.

---

### Edge Cases

- What happens when a search returns no matching books? The system shows a clear "no results" message rather than an empty, unexplained screen.
- What happens when a search matches more than 20 books? Only the first 20 results are shown; the user is not shown or able to page through further matches.
- What happens when the external book search service is unavailable or returns an error during a search? The system shows a clear error message instead of crashing or hanging.
- What happens when a book has no cover image available? The list and search results display without a cover image rather than failing.
- What happens when a user tries to add a book with zero or negative total pages? The system rejects the input with a clear error message.
- What happens when a user repeats the exact same search during the same session? Previously fetched results are reused instead of calling the external service again.
- What happens when a user tries to set a category to a value other than want to read / reading / finished? The system rejects the change with a clear error message.
- What happens when the application restarts? The personal list and its data (including data originally fetched from the external service) are still available without needing that external service to be reachable.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow the user to search for books by title or author, querying the external book search service (Open Library) and returning matching results, capped at 20 results per search.
- **FR-002**: System MUST display, for each search result, the title, author, first publication year, and a cover image when one is available.
- **FR-003**: System MUST reject search submissions with an empty query and show a clear message asking for a search term.
- **FR-004**: System MUST allow the user to add a book from search results to their personal list, specifying an initial category (want to read / reading / finished) and the total number of pages.

  > **Superseded** (2026-08-16) by [`002-auto-fetch-page-count`](../002-auto-fetch-page-count/spec.md) FR-004: the total page count is now retrieved automatically from Open Library rather than entered manually, with a manual-entry fallback (FR-004a) only when Open Library has no usable page count. The wording above is left unchanged as a historical record of the original requirement.
- **FR-005**: System MUST prevent the same book (identified by its Open Library work ID) from being added to the personal list more than once while it is currently on the list, and MUST show a clear message when a duplicate add is attempted. A book that has been removed (FR-011) is no longer considered a duplicate and MAY be added again.
- **FR-006**: System MUST allow the user to view their personal list, showing each book's title, author, category, and progress percentage.
- **FR-007**: System MUST allow the user to filter the personal list view by category (all / want to read / reading / finished).
- **FR-008**: System MUST allow the user to change a book's category among want to read / reading / finished.
- **FR-009**: When a book's category is changed to "finished", the system MUST automatically set its progress to 100%.
- **FR-010**: System MUST allow the user to update the current page for a book and MUST compute and display progress as a percentage of current page divided by total pages. Updating the current page, even to a value equal to total pages, MUST NOT by itself change the book's category — only an explicit category change (FR-008/FR-009) moves a book to "finished".
- **FR-011**: System MUST allow the user to remove a book from the personal list and MUST require explicit confirmation before the removal is performed.
- **FR-012**: System MUST display reading statistics: the number of books per category, the total number of finished books, and the average progress of books in the "reading" category.
- **FR-013**: System MUST validate all user input on the server, including: search query must not be empty; category must be one of the three allowed values; current page must be between 0 and the book's total pages; total pages must be greater than zero. Invalid input MUST result in a clear error message and MUST NOT crash the application.
- **FR-014**: System MUST persist the personal list (including book details originally fetched from the external search service) so that viewing the list and statistics after an application restart, or while the external search service is unavailable, does not depend on that external service.
- **FR-015**: When the external book search service is unavailable or returns an error, system MUST show the user a clear error message instead of failing unexpectedly.
- **FR-016**: System MUST cache search results for identical queries during the running session, to avoid repeating the same request to the external search service.
- **FR-017**: System MUST interact with the external book search service in a manner consistent with that service's usage policies: every request MUST carry a `User-Agent` header identifying the application by name and including a contact email, and the system MUST NOT send more than three requests per second to that service.
- **FR-018**: System MUST NOT require user accounts, login, or authentication — the personal list is directly accessible to the single user.

### Key Entities

- **List Entry (Book on the list)**: A book the user has added to their personal reading list. Carries the identifying details captured at add time (Open Library work ID, title, author, first publication year, cover image reference), plus the user's own tracking data: category (want to read / reading / finished), total pages, current page, and progress percentage.
- **Search Result**: A book as returned by a search, used only to locate and identify a book to add. Not persisted unless the user adds it to their list.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can search for a specific known book and add it to their personal list in under 30 seconds.
- **SC-002**: 100% of attempts to add a book that is already on the list are blocked, and the list never contains duplicate entries for the same book.
- **SC-003**: After an application restart, the personal list and statistics are fully visible with no data loss and no dependency on the external search service being reachable.
- **SC-004**: When the external search service is unreachable, the existing personal list and statistics remain fully viewable, and any attempted search shows a clear error message rather than a crash.
- **SC-005**: The progress percentage shown for every book always equals its current page divided by its total pages (or exactly 100% once "finished").
- **SC-006**: A new user can search, add, update progress, filter, remove a book, and view statistics without consulting any instructions beyond what is shown on screen.
- **SC-007**: Repeating an identical search within the same session does not trigger a new call to the external search service.

## Assumptions

- The application is used by a single person with no login, accounts, or multi-user access; "personal list" data belongs to that one user.
- The three reading categories (want to read / reading / finished) are fixed; the feature does not support custom or additional categories.
- When a book is added directly under "finished," its progress is set to 100% and its current page is treated as equal to its total pages, consistent with FR-009.
- When a book's category changes away from "finished" to "want to read" or "reading," its current page and progress are left as last recorded rather than being reset.
- Progress percentage is rounded to a whole number for display.
- When no books are in the "reading" category, average reading progress is displayed as 0% rather than an error or blank value.
- The session-scoped search cache (FR-016) is cleared on application restart; it is distinct from the persistent storage of the personal list (FR-014).
- Reading statistics are computed on demand from the current personal list rather than stored separately.
