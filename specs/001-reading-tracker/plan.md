# Implementation Plan: Reading Tracker

**Branch**: `001-reading-tracker` | **Date**: 2026-08-06 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-reading-tracker/spec.md`

**Note**: This template is filled in by the `/speckit-plan` command; its definition describes the execution workflow.

## Summary

A single-user web app for tracking personal reading. Users search Open Library for books, add
them to a personal list under one of three categories (want to read / reading / finished), track
page progress, filter the list, and view basic statistics. Technical approach: an Express server
exposes a small JSON API backed by a SQLite database (personal list persisted locally, parameterized
queries only); a plain HTML/CSS/JS static frontend (no framework, no build step) calls that API and
renders the search, list, progress, filter, and statistics views. Open Library calls are proxied
through the server so identifying headers, rate limiting, and in-memory session caching can be
enforced in one place, and so the browser never needs direct network access to a third party.

## Technical Context

**Language/Version**: JavaScript (Node.js 20 LTS), ES2022 features, no transpilation

**Primary Dependencies**: Express (HTTP server & routing), a SQLite driver for Node (choice finalized in research.md), Jest (test runner) + Supertest (HTTP endpoint testing)

**Storage**: SQLite, single local database file, accessed exclusively through parameterized queries

**Testing**: Jest (unit, integration, and contract tests), run via `npm test`

**Target Platform**: Node.js server process, accessed by the user through a desktop web browser on the same machine/network (no mobile-specific or offline-app packaging)

**Project Type**: Web application — single deployable: Express backend serving a JSON API plus static frontend assets, no separate frontend build/deploy

**Performance Goals**: Single concurrent user; list, filter, progress-update, and statistics views must feel instant (well under 1s) since they only read/write the local SQLite file; search latency is bounded mainly by the external Open Library response time, not by the app itself

**Constraints**: No frontend framework and no build step (Constitution VI); all user input validated server-side (Constitution I); all SQL uses parameterized queries, never string concatenation (Constitution II); the personal list and its book data are persisted locally so viewing the list/statistics never depends on Open Library being reachable (Constitution III); Open Library requests carry an identifying User-Agent header (app name + contact email) and stay within its documented rate limit, with graceful, non-crashing handling of failures (Constitution IV); identical search queries are cached in memory for the life of the running process (spec FR-016)

**Scale/Scope**: Single user, one personal list expected to hold on the order of tens to a few hundred books; 5 user-facing capabilities (search & add, track progress, filter, statistics, remove) per spec.md

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Requirement | Plan compliance |
|---|---|---|
| I. Input Validation | All user input validated server-side; invalid input → clear error, never a crash | Every API endpoint validates its inputs (query non-empty, category ∈ {want_to_read, reading, finished}, totalPages > 0, 0 ≤ currentPage ≤ totalPages) before touching the database, per data-model.md validation rules, and returns a structured error message on failure |
| II. Database Access | Parameterized queries only; no string concatenation of user input into SQL | All SQLite access goes through a single repository module using the driver's parameterized-statement API exclusively (see research.md) |
| III. Persistence | User data survives restarts; viewing stored data never depends on external services | Personal list is stored in a SQLite file on disk; list/filter/progress/statistics endpoints read only from that file, never from Open Library, satisfying FR-014 |
| IV. External Services | Follow provider usage guidelines (headers, rate limits, caching); graceful failure handling | A single Open Library client module sets the User-Agent header, throttles requests, and caches identical queries in memory (FR-016/FR-017); its failures are caught and surfaced as a clear user-facing message (FR-015), never an unhandled exception |
| V. Testing | Functional requirements covered by automated Jest tests | Contract tests per endpoint, integration tests per user story (US1–US5), and unit tests for validation/progress/statistics logic, all in Jest |
| VI. Simplicity | No frontend frameworks, no build step; minimal technology surface | Frontend is static HTML/CSS/vanilla JS served as-is by Express; stack is limited to Express + SQLite driver + Jest/Supertest, nothing else |
| VII. Usability | UI understandable without separate instructions | Single-page UI with labeled search box, category selectors, visible progress bars/percentages, a labeled filter control, a labeled statistics panel, and an explicit remove-confirmation prompt — no separate docs needed |

Initial gate result: **PASS** — no violations, Complexity Tracking left empty.

**Post-Phase 1 re-check**: data-model.md, contracts/api.md, and quickstart.md were reviewed
against the same seven principles after design. No new dependencies, storage mechanisms, or
external integrations were introduced beyond what Phase 0/1 already accounted for (the `books`
table remains the only persisted entity; `PATCH`/`POST` validation in contracts/api.md maps
directly to the data-model.md rules; the API contract still routes all Open Library access through
the single backend client from research.md). Gate result: **PASS**, unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/001-reading-tracker/
├── plan.md              # This file (/speckit-plan command output)
├── research.md          # Phase 0 output (/speckit-plan command)
├── data-model.md        # Phase 1 output (/speckit-plan command)
├── quickstart.md        # Phase 1 output (/speckit-plan command)
├── contracts/           # Phase 1 output (/speckit-plan command)
└── tasks.md             # Phase 2 output (/speckit-tasks command - NOT created by /speckit-plan)
```

### Source Code (repository root)

```text
src/
├── server.js               # Express app bootstrap (wires routes, static middleware, DB init)
├── db/
│   ├── database.js          # SQLite connection + schema creation on startup
│   └── schema.sql           # "books" table definition
├── routes/
│   ├── search.js             # GET /api/search
│   ├── books.js               # GET/POST/PATCH/DELETE /api/books
│   └── stats.js                # GET /api/stats
├── services/
│   ├── openLibraryClient.js   # search + covers calls, User-Agent header, rate limiting, query cache
│   └── bookRepository.js      # all SQLite reads/writes, parameterized queries only
└── validation/
    └── validators.js          # server-side validation for search query, category, pages

public/                      # static frontend, served as-is, no build step
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── api.js                 # fetch() wrappers for the backend JSON API
    └── app.js                 # search, list, filter, progress, stats, remove-confirm UI logic

tests/
├── contract/                # one file per API endpoint, verifying request/response shape
├── integration/             # one file per user story (US1–US5) exercising the API end-to-end
└── unit/                     # validators, progress calculation, statistics calculation
```

**Structure Decision**: Single deployable web application (Express + SQLite backend serving a
static, build-free frontend from `public/`) — the "Web application" shape from the template,
flattened into one `src/` + `public/` tree since the frontend has no separate build/deploy step
and is served directly by the same Express process that hosts the API.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations — this section is intentionally empty.
