---

description: "Task list template for feature implementation"
---

# Tasks: Reading Tracker

**Input**: Design documents from `/specs/001-reading-tracker/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Included. Constitution Principle V requires every functional requirement to be covered by automated Jest tests, so contract, integration, and unit tests are part of the task list (not optional for this project).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

Single deployable web app per plan.md Project Structure: `src/` (Express backend) and `public/`
(static frontend) at the repository root, `tests/contract/`, `tests/integration/`, `tests/unit/`.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Create the project directory structure (`src/db/`, `src/routes/`, `src/services/`, `src/validation/`, `public/css/`, `public/js/`, `tests/contract/`, `tests/integration/`, `tests/unit/`) per plan.md Project Structure
- [ ] T002 Initialize `package.json` with dependencies `express`, `better-sqlite3` and devDependencies `jest`, `supertest` (per research.md decisions), plus `start` and `test` npm scripts
- [ ] T003 [P] Create `jest.config.js` configuring Jest to discover tests under `tests/`
- [ ] T004 [P] Create `src/config.js` exporting environment-driven settings: `PORT`, SQLite file path, and the Open Library contact email used to build the User-Agent header (research.md §3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create `src/db/schema.sql` defining the `books` table (`id`, `open_library_work_id` UNIQUE, `title`, `author`, `first_publish_year`, `cover_url`, `category` with allowed-values check, `total_pages`, `current_page`, `progress_percent`, `created_at`) per data-model.md
- [ ] T006 Create `src/db/database.js`: opens/creates the SQLite file via `better-sqlite3` and runs `schema.sql` synchronously before the app starts listening (research.md §6) — depends on T005
- [ ] T007 [P] Create `src/validation/validators.js` with shared validators for a non-empty search query, the three allowed category values, `totalPages > 0`, and `0 <= currentPage <= totalPages` (data-model.md Validation rules), each returning a clear error message on failure
- [ ] T008 [P] Create `src/services/openLibraryClient.js`: a `search(query)` function that calls Open Library's `search.json` with `limit=20`, sets the `User-Agent` header from `src/config.js`, self-throttles to ~3 requests/second, serves repeated identical queries from an in-memory `Map` cache, builds cover URLs from `cover_i`, and translates any network/HTTP failure into a single clear "search unavailable" error (research.md §3, §4)
- [ ] T009 Create `src/services/bookRepository.js`: parameterized functions `insert`, `findByWorkId`, `listAll`, `listByCategory`, `updateCategory`, `updateCurrentPage`, `deleteById`, and `aggregateStats`, built exclusively on `better-sqlite3` prepared statements (no string concatenation, Constitution Principle II) — depends on T006
- [ ] T010 Create `src/server.js`: Express app bootstrap — JSON body parsing, `express.static('public')`, a centralized error-handling middleware that always responds with `{ "error": "..." }` and never lets an exception crash the process (Constitution Principle I), and a call to initialize the database before the app starts listening — depends on T006
- [ ] T011 [P] Create `public/index.html` skeleton with a labeled search section, personal-list section, category filter control, statistics panel, and a (hidden until triggered) remove-confirmation dialog, per Constitution Principle VII
- [ ] T012 [P] Create `public/css/styles.css` with baseline layout/styling for the sections in `public/index.html`
- [ ] T013 [P] Create `public/js/api.js` with a shared `fetchJson` helper (adds JSON headers, parses `{ error }` bodies on non-2xx responses) that later story tasks extend with one function per endpoint

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Find and add a book to the list (Priority: P1) 🎯 MVP

**Goal**: A user can search Open Library for a book and add one of the results to their personal list under a chosen category and page count, with duplicates rejected.

**Independent Test**: Search for a known title, add one result with a category and page count, confirm it appears in the list; retry the same add and confirm it is rejected as a duplicate; submit an empty search and confirm a clear validation message.

### Tests for User Story 1

- [ ] T014 [P] [US1] Contract test for `GET /api/search` in `tests/contract/search.contract.test.js` — valid query returns ≤20 results in the documented shape, empty/whitespace-only query returns 400, a simulated Open Library failure returns 502 (contracts/api.md)
- [ ] T015 [P] [US1] Contract test for `POST /api/books` in `tests/contract/books-post.contract.test.js` — valid add returns 201 with the created entry, invalid `category`/`totalPages` returns 400, a duplicate `openLibraryWorkId` returns 409 (contracts/api.md)
- [ ] T016 [P] [US1] Integration test for User Story 1's acceptance scenarios in `tests/integration/us1-search-and-add.test.js` — search-then-add end-to-end, duplicate-add rejection, empty-query rejection (spec.md US1, quickstart.md US1)

### Implementation for User Story 1

- [ ] T017 [US1] Implement the `GET /api/search` route in `src/routes/search.js` using `validators.js` for the query check and `openLibraryClient.js` for the search call — depends on T007, T008
- [ ] T018 [US1] Implement the `POST /api/books` route in `src/routes/books.js`: validate the request body with `validators.js`, reject duplicates via `bookRepository.findByWorkId`, insert via `bookRepository.insert`, return 201/400/409 per contracts/api.md — depends on T007, T009
- [ ] T019 [US1] Mount the search and books routers in `src/server.js` — depends on T010, T017, T018
- [ ] T020 [US1] Add `search(query)` and `addBook(book)` functions to `public/js/api.js` — depends on T013
- [ ] T021 [US1] Implement the search results view and add-to-list form (category select, total-pages input, duplicate/empty-query error display) in `public/js/app.js` and `public/index.html` — depends on T011, T020

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - Track reading progress (Priority: P2)

**Goal**: A user can view their list with progress, update a book's current page to recompute progress, and move a book to "finished" to auto-complete it.

**Independent Test**: View the list, update a book's current page and confirm the displayed progress equals current/total pages, move a book to "finished" and confirm progress becomes 100% without entering a page number.

### Tests for User Story 2

- [ ] T022 [P] [US2] Contract test for `GET /api/books` in `tests/contract/books-get.contract.test.js` — returns the list with `title`, `author`, `category`, `progressPercent` per entry (contracts/api.md)
- [ ] T023 [P] [US2] Contract test for `PATCH /api/books/:id` in `tests/contract/books-patch.contract.test.js` — `currentPage` update recomputes `progressPercent`; `category: "finished"` forces `currentPage`/`progressPercent` to 100%; a `currentPage` update alone never changes `category`, even when it equals `totalPages`; out-of-range `currentPage` or unknown `id` returns 400 (contracts/api.md)
- [ ] T024 [P] [US2] Integration test for User Story 2's acceptance scenarios in `tests/integration/us2-track-progress.test.js`, including the "page reaches total but category stays put" scenario from the Clarifications session (spec.md US2)

### Implementation for User Story 2

- [ ] T025 [US2] Implement the `GET /api/books` route (unfiltered) in `src/routes/books.js` using `bookRepository.listAll` — depends on T009
- [ ] T026 [US2] Implement the `PATCH /api/books/:id` route in `src/routes/books.js`: validate `category`/`currentPage` with `validators.js`, apply the "category → finished forces 100%" and "page update never changes category" rules from data-model.md, persist via `bookRepository.updateCategory`/`updateCurrentPage`, return 200/400 — depends on T007, T009
- [ ] T027 [US2] Add `listBooks()` and `updateBook(id, changes)` functions to `public/js/api.js` — depends on T020
- [ ] T028 [US2] Implement the list view with progress display and controls to edit current page and change category in `public/js/app.js` and `public/index.html` — depends on T021, T027

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Filter the list by category (Priority: P3)

**Goal**: A user can narrow the personal list view to one category or see all books.

**Independent Test**: With books in multiple categories, select each filter in turn and confirm only matching books show, and all books show for "all".

### Tests for User Story 3

- [ ] T029 [P] [US3] Contract test for `GET /api/books?category=` in `tests/contract/books-filter.contract.test.js` — each valid category and `all` return the correct subset, an invalid category returns 400 (contracts/api.md)
- [ ] T030 [P] [US3] Integration test for User Story 3's acceptance scenarios in `tests/integration/us3-filter.test.js` (spec.md US3)

### Implementation for User Story 3

- [ ] T031 [US3] Extend the `GET /api/books` route in `src/routes/books.js` to validate and apply an optional `category` query parameter via `bookRepository.listByCategory` — depends on T025, T007
- [ ] T032 [US3] Add a `category` filter parameter to the `listBooks()` function in `public/js/api.js` — depends on T027
- [ ] T033 [US3] Implement the category filter control (all / want to read / reading / finished) wired to the list view in `public/js/app.js` and `public/index.html` — depends on T028, T032

**Checkpoint**: At this point, User Stories 1-3 should all work independently

---

## Phase 6: User Story 4 - View reading statistics (Priority: P4)

**Goal**: A user can see counts per category, total finished, and average "reading" progress.

**Independent Test**: With books across categories and progress values, confirm the displayed counts, total finished, and average reading progress match the underlying data, including the zero-"reading"-books case.

### Tests for User Story 4

- [ ] T034 [P] [US4] Contract test for `GET /api/stats` in `tests/contract/stats.contract.test.js` — correct `countsByCategory`, `totalFinished`, and `averageReadingProgress` (including 0 when no "reading" books exist) (contracts/api.md)
- [ ] T035 [P] [US4] Integration test for User Story 4's acceptance scenarios in `tests/integration/us4-statistics.test.js` (spec.md US4)

### Implementation for User Story 4

- [ ] T036 [US4] Implement `bookRepository.aggregateStats` (counts per category, total finished, rounded average "reading" progress, 0 when none) in `src/services/bookRepository.js` — depends on T009
- [ ] T037 [US4] Implement the `GET /api/stats` route in `src/routes/stats.js` — depends on T036
- [ ] T038 [US4] Mount the stats router in `src/server.js` — depends on T010, T037
- [ ] T039 [US4] Add a `getStats()` function to `public/js/api.js` — depends on T020
- [ ] T040 [US4] Implement the statistics panel UI in `public/js/app.js` and `public/index.html` — depends on T028, T039

**Checkpoint**: At this point, User Stories 1-4 should all work independently

---

## Phase 7: User Story 5 - Remove a book from the list (Priority: P5)

**Goal**: A user can remove a book after confirming, and the removed book can later be re-added.

**Independent Test**: Remove a book, confirm it disappears from the list and statistics; cancel a removal and confirm the book is unchanged.

### Tests for User Story 5

- [ ] T041 [P] [US5] Contract test for `DELETE /api/books/:id` in `tests/contract/books-delete.contract.test.js` — successful delete returns 204 and the book is absent from a subsequent `GET /api/books`, unknown `id` returns 404 (contracts/api.md)
- [ ] T042 [P] [US5] Integration test for User Story 5's acceptance scenarios in `tests/integration/us5-remove.test.js`, including that a removed book's `openLibraryWorkId` can be added again (spec.md US5, Clarifications session)

### Implementation for User Story 5

- [ ] T043 [US5] Implement the `DELETE /api/books/:id` route in `src/routes/books.js` using `bookRepository.deleteById` — depends on T009
- [ ] T044 [US5] Add a `removeBook(id)` function to `public/js/api.js` — depends on T020
- [ ] T045 [US5] Implement the remove button and confirmation dialog (confirm/cancel) wired to the list view in `public/js/app.js` and `public/index.html` — depends on T028, T044

**Checkpoint**: All 5 user stories should now be independently functional

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Coverage and validation that spans multiple user stories

- [ ] T046 [P] Unit tests for `src/validation/validators.js` (category enum, page-range, `totalPages > 0`, empty/whitespace query) in `tests/unit/validators.test.js`
- [ ] T047 [P] Unit tests for the progress-percent rounding logic in `tests/unit/progress.test.js`
- [ ] T048 [P] Unit tests for `bookRepository.aggregateStats`'s rounding and zero-"reading"-books behavior in `tests/unit/stats.test.js`
- [ ] T049 [P] Unit tests for `openLibraryClient.js`'s rate limiting and query caching, using a mocked fetch, in `tests/unit/openLibraryClient.test.js`
- [ ] T050 Run the quickstart.md persistence and offline-resilience scenarios manually (restart the server and confirm no data loss; simulate Open Library being unreachable and confirm a clear error with the list/stats views unaffected) and record the results
- [ ] T051 Review every route's error responses for a consistent `{ "error": "..." }` shape and confirm no unhandled exception can reach the client (Constitution Principle I)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3-7)**: All depend on Foundational phase completion
  - Each story's route/repository work also depends on the shared `src/routes/books.js` and `public/js/app.js` edits made by earlier-priority stories (P1 → P2 → P3 → P4 → P5), since those files accumulate one section per story
  - Each story remains independently testable via its own contract/integration tests once its tasks are done
- **Polish (Phase 8)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - no dependency on other stories
- **User Story 2 (P2)**: Can start after Foundational - extends `src/routes/books.js`/`public/js/app.js` alongside US1's additions but is independently testable
- **User Story 3 (P3)**: Can start after Foundational - extends the `GET /api/books` route added in US2 (T025) with filtering
- **User Story 4 (P4)**: Can start after Foundational - adds its own route/service files, only touches shared `src/server.js`/`public/js/api.js`
- **User Story 5 (P5)**: Can start after Foundational - adds its own route handler, only touches shared `src/routes/books.js`/`public/js/app.js`

### Within Each User Story

- Tests MUST be written and FAIL before implementation
- Validators/repository functions before routes
- Routes before router mounting in `src/server.js`
- Backend (`src/`) before the corresponding frontend (`public/`) wiring for that story
- Story complete before moving to the next priority

### Parallel Opportunities

- All Setup tasks marked [P] (T003, T004) can run in parallel once T001-T002 are done
- All Foundational tasks marked [P] (T007, T008, T011, T012, T013) can run in parallel once T005-T006/T009-T010 dependencies are satisfied
- All tests for a user story marked [P] can run in parallel with each other
- All Polish unit-test tasks marked [P] (T046-T049) can run in parallel
- Different user stories can be worked on by different developers once Foundational is complete, understanding that stories sharing a file (`src/routes/books.js`, `public/js/app.js`) should coordinate edits to avoid conflicts

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together:
Task: "Contract test for GET /api/search in tests/contract/search.contract.test.js"
Task: "Contract test for POST /api/books in tests/contract/books-post.contract.test.js"
Task: "Integration test for User Story 1 in tests/integration/us1-search-and-add.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Run US1's tests and the quickstart.md US1 scenario independently
5. Deploy/demo if ready — a user can already search and build a list

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Add User Story 3 → Test independently → Deploy/Demo
5. Add User Story 4 → Test independently → Deploy/Demo
6. Add User Story 5 → Test independently → Deploy/Demo
7. Complete Phase 8: Polish
8. Each story adds value without breaking previous stories

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
