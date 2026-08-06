# Analysis Report 1 (initial /speckit-analyze run)

**Date**: 2026-08-06

## Specification Analysis Report

**Scope**: `spec.md`, `plan.md`, `tasks.md` (+ `research.md`, `data-model.md`, `contracts/api.md` for cross-reference), validated against `.specify/memory/constitution.md` v1.0.0.

No `.specify/extensions.yml` — no pre-execution hooks to dispatch.

| ID | Category | Severity | Location(s) | Summary | Recommendation |
|----|----------|----------|-------------|---------|----------------|
| C1 | Constitution Alignment | CRITICAL | spec.md:131 (FR-014), spec.md:148 (SC-003), tasks.md:178 (T050), plan.md:50 (V. Testing row) | FR-014/SC-003 require the personal list to survive an application restart, but the only task that verifies this is T050, explicitly a **manual** step ("Run ... manually ... record results"). Constitution Principle V is non-negotiable and requires *every* functional requirement to be covered by *automated* Jest tests. Plan.md's Constitution Check (line 50) claims "Functional requirements covered by automated Jest tests" without qualification, which this gap contradicts. | Add an automated integration test that closes and reopens the SQLite connection (or restarts the app under test) and asserts previously-inserted rows are still readable, satisfying FR-014/SC-003 with Jest rather than a manual step. Keep T050 as an additional manual sanity check if desired, but it cannot be the sole coverage. |
| C2 | Constitution Alignment | CRITICAL | spec.md:90 (US5 Acceptance Scenario 3), contracts/api.md (DELETE /api/books/:id note: "confirmation step ... is a client-side prompt"), tasks.md:158,164 (T042, T045) | FR-011's "cancel confirmation → book remains unchanged" behavior is purely client-side (the server deletes unconditionally once called, per contracts/api.md). No task adds a Jest test for this DOM-level behavior, and research.md explicitly rules browser/DOM testing tooling out of scope ("no such tool is part of the fixed stack"). This leaves one full acceptance scenario of FR-011 with no automated-test path at all under the current stack, conflicting with Constitution Principle V. | Either (a) add a lightweight DOM-testing dependency (e.g., jsdom, already bundled with Jest's default `testEnvironment`) and a Jest test asserting the confirm dialog's cancel path leaves `app.js` state/DOM unchanged, or (b) explicitly scope this specific sub-behavior as a documented, constitution-sanctioned exception with rationale, since Principle V otherwise blocks it. |
| I1 | Inconsistency | HIGH | spec.md:134 (FR-017, unquantified: "staying within request-rate limits"), research.md §3 ("~3 requests/second"), tasks.md:47 (T008: "self-throttles to ~3 requests/second") | spec.md's FR-017 deliberately leaves the Open Library rate limit unquantified, but research.md and tasks.md hard-code a specific figure (3 requests/second) that has no corresponding statement anywhere in spec.md. An implementer or reviewer tracing tasks.md → spec.md would find a concrete parameter with no spec-level justification. | Either add the concrete rate-limit figure to spec.md FR-017 (making it a real, traceable requirement) or mark it explicitly as a plan-level assumption/decision in research.md rather than presenting it as if derived from spec. |
| G1 | Coverage Gap | MEDIUM | spec.md:134 (FR-017, header requirement), tasks.md:47 (T008, implements header), tasks.md:177 (T049, unit tests) | FR-017 requires the app to identify itself via request headers. T008 implements the User-Agent header; T049's unit tests are scoped only to "rate limiting and query caching," with no explicit mention of asserting header content/presence. | Broaden T049 (or add a task) to explicitly assert the outgoing request carries the expected `User-Agent` header. |
| A1 | Ambiguity | LOW | spec.md:118 (FR-001: "capped at approximately 20 results"), contracts/api.md (GET /api/search: "at most 20 results"), tasks.md:47 (T008: `limit=20`) | spec.md retains the hedge word "approximately," while every downstream artifact commits to an exact cap of 20. Not a functional conflict (20 is a valid interpretation of "approximately 20"), but the imprecision is now vestigial since implementation has settled on an exact number. | Tighten spec.md FR-001 to "capped at 20 results" to match downstream artifacts and remove the now-unnecessary hedge word. |
| E1 | Edge Case Coverage | LOW | spec.md:98,105 (Edge Cases: missing cover image, no search results), tasks.md (no task explicitly names these) | The "no cover image available" and "search returns no results" edge cases are documented in spec.md but no contract/integration test task explicitly names an assertion for either (likely covered incidentally by nullable-field handling, but not called out). | Add explicit assertions for a null-cover result and a zero-result search to T014/T016 to close the traceability gap. |

**Coverage Summary Table** (Functional Requirements):

| Requirement Key | Has Task? | Task IDs | Notes |
|---|---|---|---|
| FR-001 (search) | Yes | T008, T014, T016, T017 | — |
| FR-002 (result fields) | Yes | T008, T014, T016, T017 | — |
| FR-003 (empty query) | Yes | T007, T014, T017 | — |
| FR-004 (add book) | Yes | T009, T015, T016, T018 | — |
| FR-005 (duplicate prevention) | Yes | T009, T015, T018 | — |
| FR-006 (view list) | Yes | T009, T022, T025 | — |
| FR-007 (filter) | Yes | T009, T029, T030, T031 | — |
| FR-008 (change category) | Yes | T023, T024, T026 | — |
| FR-009 (auto-100% on finished) | Yes | T023, T024, T026 | — |
| FR-010 (page → progress, no auto-category) | Yes | T023, T024, T026 | — |
| FR-011 (remove + confirm) | Partial | T041, T042, T043, T045 | Cancel-path automated test missing — see C2 |
| FR-012 (statistics) | Yes | T034, T035, T036, T037 | — |
| FR-013 (server-side validation) | Yes | T007, T046 | — |
| FR-014 (persistence/offline) | Partial | T006, T009, T050 | Restart-survival only manually verified — see C1 |
| FR-015 (graceful external failure) | Yes | T008, T014 | — |
| FR-016 (session cache) | Yes | T008, T049 | — |
| FR-017 (headers/rate limit) | Partial | T008, T049 | Header assertion not explicit — see G1 |
| FR-018 (no auth) | N/A | — | Satisfied by omission; no task adds auth anywhere |

**Constitution Alignment Issues**: C1, C2 (both CRITICAL — Principle V).

**Unmapped Tasks** (expected — infra/setup with no single-FR mapping): T001–T004 (project init, config), T005–T006 (schema/DB bootstrap), T010–T013 (server bootstrap, static skeleton, api.js helper), T051 (cross-cutting error-shape review). Not defects.

**Metrics**:
- Total Functional Requirements: 18 (17 fully mapped, 1 satisfied by omission, 3 partially covered)
- Total Success Criteria (buildable subset): 7 (SC-003 shares C1's gap; SC-001/SC-006 are qualitative UX goals not requiring dedicated test infra)
- Total Tasks: 51
- Coverage % (FR with ≥1 task): 100% (18/18); FR with *full automated-test* coverage per Constitution V: 15/18 (83%)
- Ambiguity Count: 1 (A1)
- Duplication Count: 0
- Critical Issues Count: 2 (C1, C2)

## Next Actions

CRITICAL issues (C1, C2) exist — **resolve before `/speckit-implement`**, since Constitution Principle V is non-negotiable and both plan.md's own gate and tasks.md currently overstate actual Jest coverage.

Suggested concrete paths:
- Manually edit `tasks.md` to add an automated persistence-restart test (addresses C1) and either a jsdom-based confirm/cancel test or a documented, justified exception (addresses C2).
- Manually edit `spec.md` FR-017 to state the rate-limit figure explicitly (addresses I1), and tighten FR-001's "approximately 20" (addresses A1).
- Manually edit `tasks.md` T049 to name header-content assertions (addresses G1), and T014/T016 to name the null-cover/no-results cases explicitly (addresses E1).

Would you like me to suggest concrete remediation edits for the top issues (C1, C2, I1)?
