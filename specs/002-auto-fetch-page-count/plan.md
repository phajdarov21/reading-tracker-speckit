# Implementation Plan: Automatic Page Count on Add

**Branch**: `002-auto-fetch-page-count` | **Date**: 2026-08-16 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/002-auto-fetch-page-count/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

Change request 02 on top of the existing, already-implemented Reading Tracker (`001-reading-tracker`):
when a user adds a book from search results, the total page count is now retrieved automatically
from Open Library instead of being typed by the user; a manual page-entry prompt (same validation
as before) is shown only as a fallback when Open Library has no usable page count for that book.
Per explicit user direction, this is a functionality-only change: the fixed technology stack from
`001-reading-tracker` is unchanged, no new dependencies are introduced, and no database schema
change is required (the `books.total_pages` column and its validation rule already exist and are
reused unmodified). The change is confined to (a) the Open Library search integration now also
capturing each result's page count (Open Library's search API already returns this alongside title/
author/cover in the same response — no extra external call is added), (b) the search API response
shape gaining a `pageCount` field, and (c) the add-book frontend flow auto-filling total pages when
available and falling back to the existing manual pages input, with the existing validation error
messages, when it is not.

## Technical Context

**Language/Version**: JavaScript (Node.js 20 LTS), ES2022 features, no transpilation — unchanged from `001-reading-tracker`

**Primary Dependencies**: Express, `better-sqlite3`, Jest + Supertest — unchanged; no new dependency is introduced by this change

**Storage**: SQLite, single local database file, accessed exclusively through parameterized queries — unchanged; no schema migration needed (`total_pages` already exists as `NOT NULL`, validated `> 0`)

**Testing**: Jest (unit, integration, and contract tests), run via `npm test` — unchanged

**Target Platform**: Node.js server process, accessed by the user through a desktop web browser on the same machine/network — unchanged

**Project Type**: Web application — single deployable (Express backend serving JSON API + static frontend), unchanged

**Performance Goals**: Unchanged from `001-reading-tracker`; this change adds no new network calls (page count travels in the existing search response) so search latency is unaffected

**Constraints**: Same constitution constraints as `001-reading-tracker` (server-side validation, parameterized queries, self-contained persistence, respectful external service integration, no frontend framework/build step). This change additionally must not increase the number of Open Library requests per search (Constitution IV, FR-017) — satisfied by reading the page count off the existing search response rather than issuing a per-book lookup.

**Scale/Scope**: Same single-user scope as `001-reading-tracker`; this change touches one existing capability (add-a-book) and does not add new user-facing sections

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Plan compliance |
|---|---|---|
| I. Input Validation | All user input validated server-side; invalid input → clear error, never a crash | `POST /api/books` keeps its existing server-side `totalPages` validation (`validateTotalPages`: whole number > 0) unchanged; it now runs whether the value was auto-filled or manually entered by the user (FR-004a), so the server never trusts an unvalidated page count from either path |
| II. Database Access | Parameterized queries only | Unchanged — no new queries, no schema change; `bookRepository.insert` continues to use the existing parameterized statement |
| III. Persistence | User data survives restarts; viewing stored data never depends on external services | Unchanged — the stored `total_pages` value (auto-fetched or manual) is persisted exactly as before; no new dependency on Open Library is introduced for viewing the list |
| IV. External Services | Follow provider usage guidelines; graceful failure handling; avoid redundant calls | The page count is read from the same `search.json` response already fetched for FR-001 (`number_of_pages_median`, see research.md) — this change adds **zero** new Open Library requests per search and reuses the existing User-Agent/rate-limit/cache machinery in `openLibraryClient.js` unmodified |
| V. Testing | Functional requirements covered by automated Jest tests | New/updated Jest coverage planned for: `openLibraryClient` mapping `number_of_pages_median` → `pageCount` (unit), `GET /api/search` response including `pageCount` (contract), and that `POST /api/books` validates `totalPages` identically regardless of source (contract, already covered, unchanged). One narrow, explicitly documented exception exists — see Complexity Tracking below — for the client-side-only auto-fill/manual-fallback branching in `public/js/app.js`, the same category of gap as `001-reading-tracker`'s FR-011 cancel-confirmation exception |
| VI. Simplicity | No frontend frameworks, no build step; minimal technology surface | The fallback UI reuses the existing plain-JS pages `<input>` already in `public/js/app.js`, now conditionally shown instead of always shown; no new library or build tooling added |
| VII. Usability | UI understandable without separate instructions | When Open Library supplies a page count, the add-book form simply omits the pages field (one less thing to fill in); when it doesn't, the existing labeled "Total pages" input appears exactly as it does today, so no new instructions are needed either way |

Initial gate result (2026-08-16, before Phase 0 research): **PASS** — no violations, Complexity
Tracking left empty at that time. See the Post-`/speckit-analyze` re-check below for the one
exception since added.

**Post-Phase 1 re-check**: data-model.md and contracts/api.md were reviewed against the same seven
principles after design. The only schema-adjacent change is the addition of a `pageCount` field to
the *transient* Search Result shape (not persisted, not a database migration); `POST /api/books`'s
persisted shape and validation are unchanged. No new external calls, dependencies, or storage
mechanisms were introduced. Gate result: **PASS**, unchanged.

**Post-`/speckit-analyze` re-check** (2026-08-16): Cross-artifact analysis surfaced one Principle V
gap, now explicitly justified: the client-side-only auto-fill/manual-fallback branching in
`public/js/app.js` (spec.md FR-004/FR-004a) cannot be exercised through Jest without adding
`jest-environment-jsdom`, a dependency outside the fixed technology stack — documented as a single
justified exception in Complexity Tracking below, per the constitution's Governance clause
requiring explicit justification for any deviation, and consistent with `001-reading-tracker`'s
identical FR-011 exception. Gate result: **PASS with one documented exception**.

## Project Structure

### Documentation (this feature)

```text
specs/002-auto-fetch-page-count/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md         # Phase 1 output (/speckit-plan command)
├── quickstart.md          # Phase 1 output (/speckit-plan command)
├── contracts/               # Phase 1 output (/speckit-plan command)
└── tasks.md                   # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

No new directories or files are introduced; this change modifies existing files from
`001-reading-tracker` in place:

```text
src/
├── services/
│   └── openLibraryClient.js   # MODIFIED: mapDoc() also captures pageCount from
│                                 the existing search.json response (number_of_pages_median)
├── routes/
│   └── search.js               # MODIFIED (if it shapes the response itself): pass pageCount through
└── routes/
    └── books.js                # UNCHANGED: POST /api/books already requires/validates totalPages > 0,
                                    regardless of whether the caller obtained it automatically or manually

public/
└── js/
    └── app.js                  # MODIFIED: add-book form shows the "Total pages" input only when the
                                    selected search result has no usable pageCount; otherwise the value
                                    is taken from the result and sent to POST /api/books without prompting

tests/
├── unit/
│   └── openLibraryClient.test.js  # MODIFIED: cases for pageCount present/absent/zero
├── contract/
│   └── search.contract.test.js    # MODIFIED: response shape includes pageCount
└── integration/
    └── us1-search-and-add.test.js # MODIFIED: add scenarios for auto-filled and manual-fallback paths
```

**Structure Decision**: Same single deployable structure as `001-reading-tracker` (Express + SQLite
backend serving a build-free static frontend from `public/`). This change is purely a modification
of the existing `openLibraryClient`/search response and the existing add-book frontend flow — no new
top-level source directories, services, or routes are created.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|---------------------------------------|
| The auto-fill-vs-manual-fallback branching in `public/js/app.js` (spec.md US1 Acceptance Scenario 1, US2 Acceptance Scenarios 1-2, and the category-preservation Edge Case) has no automated Jest test | This logic (whether to show the "Total pages" input, and carrying the chosen category through to the eventual `POST /api/books` call) lives entirely client-side in `createResultCard()`; there is no HTTP request whose presence/absence or shape reveals which branch the user took, so it cannot be exercised through contract/integration tests against the Express app the way the `pageCount`-in-response behavior (T00x) can | Rendering the form and asserting which input is shown would require `jest-environment-jsdom`, which since Jest 27 is a separate npm package not bundled with `jest` — installing it would add a dependency outside the fixed technology stack, the same reasoning `001-reading-tracker`'s plan.md already applied to FR-011's cancel-confirmation gap. Per Constitution Principle VI and the Governance section's requirement to justify any deviation, this dependency is rejected in favor of documenting the gap here; coverage instead relies on the quickstart.md US1/US2 manual walkthroughs |
