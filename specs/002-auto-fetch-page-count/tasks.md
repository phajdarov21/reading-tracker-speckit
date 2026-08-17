---

description: "Task list template for feature implementation"
---

# Tasks: Automatic Page Count on Add

**Input**: Design documents from `/specs/002-auto-fetch-page-count/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Included. Constitution Principle V requires every functional requirement to be covered by automated Jest tests. One narrow, explicitly documented exception exists — see plan.md's Complexity Tracking section — for the client-side-only auto-fill/manual-fallback branching in `public/js/app.js`, which cannot be exercised through Jest without adding `jest-environment-jsdom`, a dependency outside the fixed technology stack (the same category of gap `001-reading-tracker`'s FR-011 cancel-confirmation already documents).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

Same single deployable web app as `001-reading-tracker`: `src/` (Express backend), `public/`
(static frontend), `tests/contract/`, `tests/integration/`, `tests/unit/` at the repository root.
This change modifies existing files in place; no new directories are introduced (plan.md Project
Structure).

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

No setup tasks. This change reuses the existing `001-reading-tracker` scaffolding, dependencies,
and configuration unchanged (plan.md Technical Context: same stack, no new dependencies, no schema
migration).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core change that MUST be complete before either user story can be implemented — both
stories depend on the search results carrying a `pageCount` value (usable or `null`).

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T001 Modify `mapDoc()` in `src/services/openLibraryClient.js` to add a `pageCount` field to each mapped search result, derived from Open Library's `number_of_pages_median` field on the same `search.json` response already being fetched; resolve to `null` when the field is missing, `0`, or not an integer (research.md §1-2; data-model.md Search Result) — no new Open Library request is added

**Checkpoint**: Foundation ready - user story implementation can now begin

---

## Phase 3: User Story 1 - Add a book without typing its page count (Priority: P1) 🎯 MVP

**Goal**: When Open Library reports a usable page count for the selected result, the user adds the book by choosing only a category — no manual page-count entry is shown or required.

**Independent Test**: Search for a book known to have Open Library page data, add it while choosing only a category, and confirm it appears in the personal list with the total pages Open Library reported (not typed by the user).

### Tests for User Story 1

- [X] T002 [P] [US1] Update `tests/unit/openLibraryClient.test.js` with cases for the new `pageCount` mapping: a `number_of_pages_median` present and greater than 0 → `pageCount` set to that value; missing → `null`; `0` → `null`; non-integer → `null` (research.md §1-2) — depends on T001
- [X] T003 [P] [US1] Update `tests/contract/search.contract.test.js` asserting `GET /api/search` results include `pageCount`, covering both a result with a usable value and a result with `null` (contracts/api.md) — depends on T001
- [X] T004 [US1] Add a scenario to `tests/integration/us1-search-and-add.test.js`: add a search result whose `pageCount` is a usable positive integer via `POST /api/books` supplying `totalPages` equal to that value, and confirm the stored/returned book's `totalPages` matches; confirm the existing duplicate-add rejection (FR-005) is unaffected (spec.md US1 Acceptance Scenarios 1-3) — depends on T001

### Implementation for User Story 1

- [X] T005 [US1] Modify `createResultCard()` in `public/js/app.js`: when the selected result's `pageCount` is a usable positive integer, do not render/require the "Total pages" input and submit `totalPages: result.pageCount` directly to `addBook()` on the category-only submit; when `pageCount` is not usable, keep today's manual "Total pages" input exactly as-is (data-model.md Add-book fallback flow, steps 1-2) — depends on T001
- [X] T006 [US1] Manually run the quickstart.md US1 scenarios (auto-filled add with only a category chosen; repeat add still rejected as duplicate) — the auto-fill/hide-field branch itself is not Jest-testable per plan.md Complexity Tracking — depends on T005. Verified live against the real Open Library API (server on a temp port + curl): search for "harry potter philosopher" returned `pageCount: 302`; `POST /api/books` with that value succeeded and stored `totalPages: 302`. This run also caught and fixed a real bug — see research.md §1 Correction and T001's amended implementation (the `fields` query parameter). No browser extension was available in this session to click through the DOM itself; the show/hide logic was additionally verified by static code review of `createResultCard()`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently (MVP)

---

## Phase 4: User Story 2 - Manually enter pages when Open Library has no page count (Priority: P2)

**Goal**: When Open Library does not report a usable page count for the selected result, the user is prompted to enter the total number of pages manually, with the same validation as before, before the book can be added.

**Independent Test**: Add a book known to lack Open Library page data and confirm the system prompts for manual page entry, accepts a valid whole number greater than zero, and adds the book with that value as its total pages.

### Tests for User Story 2

- [X] T007 [US2] Add a scenario to `tests/integration/us1-search-and-add.test.js` confirming `POST /api/books` still rejects an add whose `totalPages` is missing, `0`, negative, or non-whole with the existing 400 message (contracts/api.md), exercising exactly the request shape the manual-fallback UI sends — no dependency on T001 (this path is unchanged backend behavior); included here so User Story 2 has its own explicit, independent test coverage of the path it relies on. Not marked `[P]`: it edits the same file as T004 ([US1]), so the two must not be run concurrently

### Implementation for User Story 2

- [X] T008 [US2] Extend the `else` branch of `createResultCard()` (T005) in `public/js/app.js` so that when `pageCount` is not usable: the existing "Total pages" input stays visible and required, the category chosen earlier in the same form is preserved and sent once the manual value is submitted, and the existing client/server validation error message is shown on an invalid entry; not adding the book if the prompt is abandoned (spec.md US2 Acceptance Scenarios 1-4, Edge Cases) — depends on T005
- [X] T009 [US2] Manually run the quickstart.md US2 scenarios (manual prompt shown for a no-page-count result; valid entry succeeds; `0`/negative/non-whole entry rejected; abandoning the prompt leaves the book unadded) — this branching logic is not Jest-testable per plan.md Complexity Tracking — depends on T008. Verified live: `POST /api/books` for a book with no `totalPages` was rejected 400 with the existing "Total pages must be a whole number greater than zero." message, matching what the manual-fallback form sends on an empty/invalid entry. DOM show/hide and category-preservation verified by static code review of `createResultCard()` (no browser extension available this session)

**Checkpoint**: User Stories 1 and 2 should both work independently

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Regression safety net for the rest of the already-implemented app

- [X] T010 Run the full `npm test` suite and confirm no regressions in the existing `001-reading-tracker` coverage (progress tracking, filtering, statistics, removal, persistence, offline resilience, search caching) — depends on T001, T005, T008. Result: 87/87 tests passing across 17 suites
- [X] T011 Re-read `specs/002-auto-fetch-page-count/contracts/api.md` and `data-model.md` against the final `openLibraryClient.js`/`app.js` changes and correct either the docs or the code if they've drifted — depends on T001, T005, T008. `contracts/api.md` and `data-model.md` describe the app-facing `pageCount` field/values, which are unaffected by the `fields`-parameter fix (an Open-Library-request-mechanics detail) and needed no changes; `research.md` §1 was the doc that had drifted from reality and was corrected in place (see T006)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: None — no tasks
- **Foundational (Phase 2)**: BLOCKS both user stories — T001 must land before any US1/US2 task
- **User Stories (Phase 3-4)**: Both depend on Foundational (T001)
  - User Story 2's implementation task (T008) extends the same `createResultCard()` function User Story 1's task (T005) creates the conditional in, so T008 depends on T005 landing first — this mirrors how `001-reading-tracker` handled stories sharing `public/js/app.js`
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (T001) - no dependency on User Story 2
- **User Story 2 (P2)**: Can start after Foundational (T001); its implementation (T008) builds on the conditional User Story 1 introduces (T005), but is independently testable via its own quickstart scenario and integration test (T007, T009)

### Within Each User Story

- Tests written before/alongside implementation where they can run against the real backend (T002-T004, T007)
- Foundational data change (T001) before any test or UI work that depends on it
- Backend (`src/`) before the corresponding frontend (`public/`) wiring
- Manual quickstart verification (T006, T009) last, once the relevant implementation task is done

### Parallel Opportunities

- T002 and T003 can run in parallel once T001 is done (different test files)
- T007 has no dependency on T001/T005/T008 and can be written at any point once Foundational is complete, but it edits the same file as T004 (`tests/integration/us1-search-and-add.test.js`) and so must not run concurrently with it — not marked `[P]`
- T005 and T008 touch the same function in the same file (`createResultCard()` in `public/js/app.js`) and must be done sequentially, not in parallel

---

## Parallel Example: User Story 1

```bash
# Launch the parallelizable tests for User Story 1 together (after T001):
Task: "Update tests/unit/openLibraryClient.test.js with pageCount mapping cases"
Task: "Update tests/contract/search.contract.test.js asserting pageCount in GET /api/search results"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001) — CRITICAL, blocks both stories
2. Complete Phase 3: User Story 1
3. **STOP and VALIDATE**: Run US1's tests and the quickstart.md US1 scenario independently
4. Deploy/demo if ready — most books (those with Open Library page data) now add with one fewer step

### Incremental Delivery

1. Complete Foundational (T001) → shared `pageCount` data available
2. Add User Story 1 → Test independently → Deploy/Demo (MVP!)
3. Add User Story 2 → Test independently → Deploy/Demo
4. Complete Phase 5: Polish (full regression run)
5. Each story adds value without breaking the other or the rest of `001-reading-tracker`

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Commit after each task or logical group
- Stop at either checkpoint to validate a story independently
- The auto-fill/manual-fallback branching in `public/js/app.js` is the one area with a documented Jest-coverage gap (plan.md Complexity Tracking) — rely on the quickstart.md manual scenarios (T006, T009) for that specific behavior
