<!--
Sync Impact Report
Version change: [TEMPLATE] → 1.0.0
Rationale: Initial ratification. All placeholder tokens replaced with concrete content
derived exclusively from the seven constraints supplied by the user.
Modified principles: n/a (initial adoption)
Added sections:
  - Core Principles I–VII (Input Validation, Parameterized Database Access,
    Durable Self-Contained Persistence, Respectful External Service Integration,
    Automated Test Coverage (Jest), Minimal Technology Surface, Self-Explanatory Usability)
  - Governance
Removed sections:
  - [SECTION_2_NAME] / [SECTION_2_CONTENT] and [SECTION_3_NAME] / [SECTION_3_CONTENT]
    template slots were omitted. Every constraint supplied by the user maps directly
    onto one of the seven Core Principles; no additional constraints, technology
    choices, or workflow rules were supplied, and none were invented to fill these
    optional sections.
Follow-up TODOs: none — no placeholder tokens remain.
-->

# Reading Tracker Constitution

## Core Principles

### I. Input Validation
All user input MUST be validated on the server side before it is processed, stored, or
acted upon. Client-side validation MAY improve user experience but MUST NOT be relied
upon as the sole safeguard. When input fails validation, the application MUST return a
clear, human-readable error message describing what was wrong; it MUST NOT crash, hang,
or return an unhandled exception.

**Rationale**: Server-side validation is the only validation an attacker or a buggy
client cannot bypass, and clear error messages keep the single user in control of their
own data without needing to interpret a stack trace.

### II. Parameterized Database Access
All database queries MUST use parameterized queries (prepared statements) for any
value that originates from user input. Building SQL statements by concatenating or
interpolating user input into a query string is prohibited, without exception.

**Rationale**: Parameterization is the direct, non-negotiable defense against SQL
injection; string concatenation of user input into SQL is the specific failure mode
this principle exists to prevent.

### III. Durable, Self-Contained Persistence
User data MUST survive application restarts. Viewing previously stored data MUST NOT
depend on the availability of any external service — the user's own reading records
remain accessible even if third-party services are unreachable.

**Rationale**: A reading tracker's core value is the durability of the user's records;
persistence that can be lost on restart, or reading access that is hostage to a
third-party outage, defeats the application's purpose.

### IV. Respectful External Service Integration
Requests to third-party APIs MUST follow the provider's usage guidelines, including
sending identifying request headers, respecting documented rate limits, and caching
responses where appropriate to avoid redundant calls. When an external service fails,
times out, or is unavailable, the application MUST handle the failure gracefully and
present the user with a clear message rather than crashing or leaving the interface in
an unclear state.

**Rationale**: Following a provider's usage guidelines keeps continued access to the
service intact, and graceful degradation ensures an outage in a third-party dependency
never becomes an outage in the reading tracker itself (see Principle III).

### V. Automated Test Coverage (Jest)
Every functional requirement MUST be covered by automated tests written with Jest.
A functional requirement is not considered complete until its corresponding test(s)
exist and pass.

**Rationale**: Jest-based automated tests are the agreed mechanism for verifying that
functional requirements are met and remain met as the application evolves.

### VI. Minimal Technology Surface
The application MUST NOT use frontend frameworks and MUST NOT require a build step.
The overall technology surface MUST be kept minimal, favoring the smallest set of
moving parts capable of meeting the other principles in this constitution.

**Rationale**: For a single-user application, a minimal, buildless technology surface
reduces the amount of tooling the user must install, configure, and maintain.

### VII. Self-Explanatory Usability
The user interface MUST be understandable without separate instructions or
documentation. A user must be able to determine how to use any given screen or
feature from what is presented on it.

**Rationale**: Since no separate instructions are provided to the user, the interface
itself is the only guidance available and must be sufficient on its own.

## Governance

This constitution supersedes all other project practices, templates, and informal
conventions. Where any plan, spec, task list, or piece of code conflicts with a
principle in this document, the principle governs.

**Amendment procedure**: Amendments are made by editing this file. Each amendment MUST
update the Sync Impact Report at the top of the file, describing the version change,
the principles added, removed, or modified, and any sections affected. The
`Last Amended` date below MUST be updated to the date of the amendment.

**Versioning policy**: This constitution is versioned independently using semantic
versioning:
- **MAJOR** — backward-incompatible removal or redefinition of a principle.
- **MINOR** — a new principle or section is added, or existing guidance is materially
  expanded.
- **PATCH** — clarifications, wording fixes, or other non-semantic refinements.

**Compliance review**: Every plan, spec, and task list produced for this project MUST
be checked against the principles in this constitution before implementation begins,
and any deviation MUST be justified explicitly or the plan revised to comply.

**Version**: 1.0.0 | **Ratified**: 2026-08-06 | **Last Amended**: 2026-08-06
