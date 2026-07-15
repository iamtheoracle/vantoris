# Testing Strategy — VANTORIS

Status: normative. This document is the official testing strategy for the entire VANTORIS platform. It is documentation-only until the Base44 export is imported. After the import, these standards are enforced for every feature, service, and release. Every test requirement documented here derives authority from and is consistent with the decisions recorded in the other platform documents listed in the Cross-references section.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [Governing Principles](#2-governing-principles)
3. [Test Types and Standards](#3-test-types-and-standards)
4. [Functional Testing Matrix](#4-functional-testing-matrix)
5. [AI Testing](#5-ai-testing)
6. [Chat Testing](#6-chat-testing)
7. [Security Testing](#7-security-testing)
8. [Rules Engine Testing](#8-rules-engine-testing)
9. [Performance Testing](#9-performance-testing)
10. [Accessibility Testing](#10-accessibility-testing)
11. [Regression Testing](#11-regression-testing)
12. [Disaster Recovery Testing](#12-disaster-recovery-testing)
13. [Base44 Migration Testing](#13-base44-migration-testing)
14. [Test Environment Strategy](#14-test-environment-strategy)
15. [Evidence Requirements](#15-evidence-requirements)
16. [Release Criteria](#16-release-criteria)
17. [Cross-References](#17-cross-references)

---

## 1. Purpose

VANTORIS is a production-grade enterprise financial operations platform. Testing must verify that every feature is functionally correct, secure, accessible, performant, and reliable before reaching production.

The testing strategy covers:

- **Functionality** — every platform feature operates as documented
- **Security** — authentication, authorization, encryption, and audit controls are effective
- **Accessibility** — all interfaces meet WCAG 2.2 AA as required by docs/CODING_STANDARDS.md
- **Performance** — response times meet documented targets under normal, load, and stress conditions
- **Reliability** — the platform recovers from failures within defined RTO/RPO objectives
- **AI Behavior** — permission-aware AI operates within authorization boundaries, never leaks unauthorized information, and executes workflows correctly
- **Automation** — CI gates enforce test passage before any merge to main or promotion to production
- **Permissions** — RBAC boundaries are verified for every role and resource
- **Production Readiness** — all release criteria are met before a production promotion is approved

Testing must never be treated as an afterthought. Every feature must include unit, integration, and E2E tests (per docs/CODING_STANDARDS.md Testing Requirements). Every user-facing change must carry Evidence artifacts (per docs/REPOSITORY_STANDARDS.md Verification-First requirements).

---

## 2. Governing Principles

### 2.1 Verification First

No feature is declared complete without verified tests passing in a running environment. Test code is subject to the same review standards as production code.

### 2.2 Unified Operating Experience

VANTORIS provides a unified operating experience. Members and operators perform all work within VANTORIS. AI and the Operations Center automate routine workflows. External integrations are abstracted behind the platform. Tests must verify this unified experience end-to-end; they must not treat isolated subsystems in isolation when user journeys cross boundaries.

### 2.3 Implementation First

Tests must target the imported Base44 implementation. Do not write tests against placeholder or demo code. After import, refactoring is accompanied by behavior-preserving test suites that confirm parity.

### 2.4 Automation First

All tests run in CI. No manual-only test is sufficient for user-facing features. Manual testing is reserved for exploratory, usability, and exceptional regulatory review.

### 2.5 Evidence Driven

Every PR that changes a user-facing feature must include an Evidence artifact: a CI link, staging URL, E2E trace ID, or screencast. Tests must produce machine-readable results that CI can archive.

### 2.6 Zero Tolerance for Critical Failures

Critical test failures, critical security findings, or permission boundary violations block release. No exceptions.

---

## 3. Test Types and Standards

### 3.1 Unit Tests

**Scope**: Individual functions, hooks, components, and services in isolation.

**Standard**:
- Coverage threshold: 80% statements, branches, functions, and lines per package (package owner may raise the threshold; may not lower it without documented justification).
- Tests must be deterministic, fast (< 1 second per test), and isolated (no network, no real database, no file system).
- Mocks and stubs must live under `tests/mocks/` per workspace.
- Test files must be co-located with implementation files (`*.test.ts` or `*.spec.ts`).
- Flaky unit tests must be tagged `@flaky` and tracked on a ticket. Stabilization required within two weeks.

**Tool**: Vitest (frontend and Node.js services).

**CI gate**: Unit tests run on every PR. Failures block merge.

---

### 3.2 Integration Tests

**Scope**: Services interacting with external systems (PostgreSQL, Redis, Kafka, S3, third-party providers) via test doubles or ephemeral containers.

**Standard**:
- Use Testcontainers (or a CI-provisioned ephemeral container) for PostgreSQL and Redis integration tests.
- Every domain service (accounts, transactions, ledger, verification, cards, payments, notifications, chat, AI, audit) must have integration tests that cover the primary CRUD path and at least one failure/rollback scenario.
- Integration tests must verify ledger balance integrity for all financial operations (debit/credit balance as per docs/DATABASE_ARCHITECTURE.md Double-Entry Ledger requirements).
- Database migration scripts must run against an ephemeral Postgres 16+ instance in CI before being applied to staging.
- Media upload integration tests must verify signed URL generation, upload confirmation, and metadata persistence.

**Tool**: Vitest with Testcontainers; or Jest for backend Node.js services.

**CI gate**: Integration tests run on merge to main and on release branches. Failures block promotion.

---

### 3.3 End-to-End (E2E) Tests

**Scope**: Full user journeys across the UI and API stack in a staging environment.

**Standard**:
- Every user-facing feature must have at least one Playwright E2E test covering the primary happy path and one error/edge scenario.
- E2E tests are organized by surface: `tests/e2e/member/`, `tests/e2e/operations/`, `tests/e2e/icommand/`, `tests/e2e/ai/`, `tests/e2e/chat/`.
- E2E tests must use semantic queries (role, label, placeholder) consistent with docs/COMPONENT_ARCHITECTURE.md Accessibility-First and Testable Architecture principles. Never query by CSS class or implementation detail.
- Each E2E test run must produce a Playwright trace archive for evidence submission.
- Smoke tests for core user journeys (sign in, dashboard load, single transfer) must run post-deploy to staging and production.

**Tool**: Playwright.

**CI gate**: E2E smoke tests run on every staging deploy. Full E2E suite runs on release branches. Failures block promotion.

---

### 3.4 Contract Tests

**Scope**: Consumer-driven contracts between API producers and consumers using OpenAPI v3 contracts from `docs/api/*.yaml`.

**Standard**:
- Every public API defined in docs/API_ARCHITECTURE.md must have a consumer-driven contract test.
- Contract tests live under `tests/contract/` per consuming workspace.
- OpenAPI specification files must be validated by a linter (Spectral or equivalent) on every PR touching `docs/api/*.yaml`.
- Client code generated from OpenAPI contracts must not drift from the spec. A spec-vs-implementation drift check runs in CI.
- Breaking API changes must follow the two-release migration plan (deprecate → warn → remove) as defined in docs/API_ARCHITECTURE.md.

**Tool**: Pact or OpenAPI contract validation tooling.

**CI gate**: Contract tests run on every PR that modifies API contracts or consumer code. Failures block merge.

---

### 3.5 Performance Tests

**Scope**: Measure response times and throughput under realistic load for all primary user operations.

**Standard**: See [Section 9 Performance Testing](#9-performance-testing) for targets and scenarios.

**Tool**: k6, Gatling, or equivalent load testing tool.

**CI gate**: Baseline performance regression test runs on release branches. Failures (exceeding defined thresholds) block production promotion.

---

### 3.6 Load Tests

**Scope**: Sustained concurrency at expected production peak load over a minimum 30-minute run.

**Standard**:
- Simulate peak concurrent users (member sessions, operations sessions, AI requests, chat messages).
- Validate that SLOs hold: P99 < 200ms for member-facing APIs (per docs/ARCHITECTURE.md Non-Functional Requirements), dashboard load < 2s, no error rate exceeding 0.1% under peak load.
- Database connection pool saturation must not occur.
- Cache hit rate must stay > 95% for frequently accessed data.

**CI gate**: Load tests run on staging before production promotion. Results recorded as evidence artifacts.

---

### 3.7 Stress Tests

**Scope**: Behavior beyond peak load to identify breaking points and verify graceful degradation.

**Standard**:
- Gradually increase load until the system fails or degrades. Record the breaking point.
- Verify that core banking operations continue during secondary system outages (graceful degradation per docs/ARCHITECTURE.md Availability).
- Verify automatic recovery (circuit breakers, retry with backoff) after stress is removed.
- Run stress tests in an isolated staging environment; never against production.

**CI gate**: Stress test results reviewed before major releases. Not required for every PR.

---

### 3.8 Security Tests

**Scope**: Authentication, authorization, encryption, session management, permission boundaries, and audit controls. See [Section 7 Security Testing](#7-security-testing) for the full checklist.

**Standard**: Per docs/SECURITY_STANDARDS.md and docs/AUTHENTICATION.md.

**Tool**: OWASP ZAP (DAST), CodeQL (SAST, run in CI per docs/CI_CD.md), custom permission boundary tests.

**CI gate**: SAST (CodeQL) runs on every PR and main. DAST runs on staging before production promotion. Critical findings block release.

---

### 3.9 Accessibility Tests

**Scope**: All public-facing and internal UI surfaces.

**Standard**: See [Section 10 Accessibility Testing](#10-accessibility-testing).

**Tool**: Axe-core (automated), Playwright accessibility assertions, manual screen reader review.

**CI gate**: Automated accessibility tests run on every PR that modifies UI. Violations at the "critical" or "serious" level block merge.

---

### 3.10 Regression Tests

**Scope**: Verified feature set after each refactor, migration, or dependency update.

**Standard**: See [Section 11 Regression Testing](#11-regression-testing).

**CI gate**: Full regression suite runs on release branches and after Base44 refactor PRs.

---

### 3.11 Disaster Recovery Tests

**Scope**: Database failover, backup restoration, cross-region failover, and incident response procedures.

**Standard**: See [Section 12 Disaster Recovery Testing](#12-disaster-recovery-testing).

**CI gate**: DR drills run on a scheduled basis (at minimum quarterly). Results recorded and linked to compliance artifacts.

---

### 3.12 AI Workflow Tests

**Scope**: Permission-aware AI behavior, workflow execution, memory and conversation isolation, action suggestions, and audit logging.

**Standard**: See [Section 5 AI Testing](#5-ai-testing).

**CI gate**: AI integration and permission tests run on every PR modifying AI features. Failures block merge.

---

## 4. Functional Testing Matrix

Every feature listed below must be tested before release. For each feature, the minimum required tests are: unit tests, integration tests, and at least one E2E test. Security and permission boundary tests are required where indicated. The test file paths follow the workspace structure defined in docs/REPOSITORY_STRUCTURE.md.

---

### 4.1 Authentication

**Reference**: docs/AUTHENTICATION.md

| Test Scenario | Test Type | Required |
|---|---|---|
| Sign in with email and password | Unit, E2E | Yes |
| Sign in with phone number | Unit, E2E | Yes |
| Sign in with username (optional) | Unit, E2E | Yes |
| Passkey (WebAuthn) registration and authentication | Unit, Integration, E2E | Yes |
| Biometric authentication (Face ID / Touch ID) | Unit, E2E | Yes |
| MFA enrollment and verification (TOTP) | Unit, Integration, E2E | Yes |
| MFA via SMS OTP | Unit, Integration, E2E | Yes |
| Recovery codes — generation and use | Unit, Integration, E2E | Yes |
| Returning user goes directly to Sign In (not onboarding) | E2E | Yes |
| Session inactivity termination (5–10 minutes) | Integration | Yes |
| Fresh authentication required for high-risk actions | Integration, E2E | Yes |
| Refresh token rotation | Unit, Integration | Yes |
| Token expiry and re-authentication prompt | Unit, E2E | Yes |
| OAuth2 PKCE flow | Unit, Integration | Yes |
| Trusted device registration | Integration, E2E | Yes |
| Maximum two trusted devices enforced | Integration | Yes |
| Adding third device requires removing an existing device | Integration, E2E | Yes |
| Profile display: Preferred Name → First Name → First + Last | Unit, E2E | Yes |
| Never display email username as greeting | Unit | Yes |
| RBAC context established correctly on sign-in | Integration | Yes |

---

### 4.2 Authorization (RBAC)

**Reference**: docs/RBAC.md

| Test Scenario | Test Type | Required |
|---|---|---|
| Public Visitor sees only public routes | Unit, E2E | Yes |
| Member sees only their own accounts, cards, investments, documents | Integration, E2E | Yes |
| Member cannot access other members' records | Integration | Yes |
| Member cannot see internal notes, cases, or audit logs | Integration | Yes |
| Operations staff can review members and verification | Integration, E2E | Yes |
| Operations cannot change platform configuration | Integration | Yes |
| Support & Member Services can create tickets and chat | Integration, E2E | Yes |
| Support cannot approve financial or security actions | Integration | Yes |
| VANTORIS iCommand can access governance and configuration | Integration, E2E | Yes |
| Every role sees only permitted navigation items | E2E | Yes |
| Unavailable features are hidden (not disabled) | E2E | Yes |
| Hidden authority levels are never exposed | Integration | Yes |
| Authority identifiers are never returned in API responses | Integration | Yes |
| AI inherits permissions of signed-in user | Integration | Yes |
| 403 returned for every unauthorized API call | Integration | Yes |
| Permission descriptors loaded from libs/ai/permissions | Unit | Yes |

---

### 4.3 Member Portal

| Test Scenario | Test Type | Required |
|---|---|---|
| Dashboard loads with correct accounts and balances | Integration, E2E | Yes |
| Account summary shows correct balance and recent transactions | Integration, E2E | Yes |
| Transaction history with pagination and filter | Integration, E2E | Yes |
| Transfer initiation (ACH, Wire, Zelle) | Integration, E2E | Yes |
| Transfer confirmation with step-up authentication | Integration, E2E | Yes |
| Bill payment | Integration, E2E | Yes |
| Statements and documents download | Integration, E2E | Yes |
| Profile management (all name fields) | Unit, E2E | Yes |
| Notification preferences | Integration, E2E | Yes |
| Settings and security preferences | E2E | Yes |

---

### 4.4 Operations Center

| Test Scenario | Test Type | Required |
|---|---|---|
| Operations dashboard loads with real-time data | Integration, E2E | Yes |
| Transaction monitoring and filtering | Integration, E2E | Yes |
| Member search and review | Integration, E2E | Yes |
| Case creation and management | Integration, E2E | Yes |
| Verification review and approval | Integration, E2E | Yes |
| Report generation and export | Integration, E2E | Yes |
| Operations cannot access executive governance functions | Integration | Yes |
| Assigned work queue loads correctly | Integration, E2E | Yes |
| Communication with members via chat | Integration, E2E | Yes |
| AI Operations Assistant suggests relevant actions | Integration, E2E | Yes |
| AI suggestions are permission-bound to Operations role | Integration | Yes |

---

### 4.5 VANTORIS iCommand

| Test Scenario | Test Type | Required |
|---|---|---|
| iCommand dashboard loads with governance and configuration | Integration, E2E | Yes |
| Platform configuration changes | Integration, E2E | Yes |
| Security policy management | Integration, E2E | Yes |
| AI governance configuration | Integration | Yes |
| Compliance oversight and reporting | Integration, E2E | Yes |
| All iCommand actions produce immutable audit events | Integration | Yes |
| iCommand cannot impersonate members | Integration | Yes |

---

### 4.6 AI Command Center

**Reference**: docs/REPOSITORY_STANDARDS.md AI Command Center; docs/API_ARCHITECTURE.md AI APIs

| Test Scenario | Test Type | Required |
|---|---|---|
| ACC loads as full-screen workspace at canonical route | E2E | Yes |
| ACC accessible from Member, Operations, iCommand workspaces | E2E | Yes |
| Draggable launcher persists last position per user | Unit, E2E | Yes |
| Launcher is keyboard-accessible | Accessibility, E2E | Yes |
| Action catalog loads with permission-filtered actions | Integration, E2E | Yes |
| Deep links from action catalog resolve to correct routes | Contract, E2E | Yes |
| Context from current screen is surfaced in ACC | Integration, E2E | Yes |
| Guided multi-step AI workflows execute correctly | Integration, E2E | Yes |
| Workflow definitions loaded from libs/ai/workflows | Unit | Yes |
| AI memory read/write within authorized scope | Integration | Yes |
| AI Suggestions endpoint returns results asynchronously | Integration | Yes |
| Permission-filtered: limited role sees only permitted actions | Integration, E2E | Yes |
| Conversation history is versioned and isolated | Integration | Yes |
| AI audit events emitted for all actions | Integration | Yes |

---

### 4.7 Verification Center

**Reference**: docs/REPOSITORY_STANDARDS.md Verification Center; docs/API_ARCHITECTURE.md Verification Center APIs

| Test Scenario | Test Type | Required |
|---|---|---|
| Email verification (send token, confirm token) | Integration, E2E | Yes |
| Phone verification (SMS OTP, voice call) | Integration, E2E | Yes |
| Identity verification document submission | Integration, E2E | Yes |
| Liveness check integration | Integration | Yes |
| Address verification | Integration, E2E | Yes |
| Income verification document upload | Integration, E2E | Yes |
| Business verification (UBO, business docs) | Integration, E2E | Yes |
| Trusted device verification and binding | Integration, E2E | Yes |
| Status transitions: Unverified → IdentitySubmitted → UnderReview → Verified | Integration | Yes |
| Status transitions: UnderReview → Failed with reason | Integration | Yes |
| Verification states surfaced correctly in UI (no "Coming Soon") | E2E | Yes |
| Verification Center is the single verification surface | E2E | Yes |
| KYC does not appear in the More menu | E2E | Yes |
| Third-party provider webhook callbacks processed correctly | Integration | Yes |
| Rules Engine routes verification cases automatically | Integration | Yes |

---

### 4.8 Accounts

| Test Scenario | Test Type | Required |
|---|---|---|
| Personal account creation | Integration, E2E | Yes |
| Joint account creation with co-owner | Integration, E2E | Yes |
| Business account creation with org context | Integration, E2E | Yes |
| Account status transitions (provisioned → active → suspended → closed) | Integration | Yes |
| Account balance calculation accuracy | Integration | Yes |
| Ledger entries created for every transaction | Integration | Yes |
| Ledger is balanced (debit = credit) after every operation | Integration | Yes |
| Account retrieval scoped to member (no cross-member access) | Integration | Yes |

---

### 4.9 Payments

| Test Scenario | Test Type | Required |
|---|---|---|
| ACH transfer initiation and settlement | Integration, E2E | Yes |
| Domestic Wire transfer initiation and settlement | Integration, E2E | Yes |
| International Wire transfer | Integration, E2E | Yes |
| Zelle transfer | Integration, E2E | Yes |
| Bill payment | Integration, E2E | Yes |
| Transfer limit enforcement | Integration | Yes |
| Step-up authentication for high-value transfers | Integration, E2E | Yes |
| Idempotency key prevents duplicate submissions | Integration | Yes |
| Payment status transitions (created → pending → settled / failed) | Integration | Yes |
| OFAC/sanctions check integration | Integration | Yes |
| AML flag recording | Integration | Yes |
| Payment failure and retry handling | Integration | Yes |
| Reversal and compensation ledger entries | Integration | Yes |

---

### 4.10 Cards

| Test Scenario | Test Type | Required |
|---|---|---|
| Card issuance | Integration, E2E | Yes |
| Card activation | Integration, E2E | Yes |
| Card suspension and resume | Integration, E2E | Yes |
| Card revocation | Integration, E2E | Yes |
| Card controls (limits, merchant categories, geography) | Integration, E2E | Yes |
| PAN never stored in plaintext (tokenization verified) | Integration | Yes |
| Card transaction posting to ledger | Integration | Yes |
| Card transaction history scoped to card owner | Integration | Yes |

---

### 4.11 Investments

| Test Scenario | Test Type | Required |
|---|---|---|
| Portfolio creation and view | Integration, E2E | Yes |
| Order placement (buy/sell) | Integration, E2E | Yes |
| Order execution and settlement | Integration | Yes |
| Position update after execution | Integration | Yes |
| Investment history and statements | Integration, E2E | Yes |
| Investment data scoped to member | Integration | Yes |

---

### 4.12 Credit

| Test Scenario | Test Type | Required |
|---|---|---|
| Credit product view and application | Integration, E2E | Yes |
| Credit limit display | Integration, E2E | Yes |
| Credit utilization calculation | Integration | Yes |
| Credit data scoped to member | Integration | Yes |

---

### 4.13 Loans

| Test Scenario | Test Type | Required |
|---|---|---|
| Loan product view and application | Integration, E2E | Yes |
| Loan account creation | Integration | Yes |
| Loan payment processing | Integration, E2E | Yes |
| Amortization schedule display | Integration, E2E | Yes |
| Loan data scoped to member | Integration | Yes |

---

### 4.14 Notifications

**Reference**: docs/DATABASE_ARCHITECTURE.md Notifications schema

| Test Scenario | Test Type | Required |
|---|---|---|
| Notification delivered to correct member | Integration, E2E | Yes |
| Notification channels (in-app, email, SMS, push) | Integration | Yes |
| Notification history and read status | Integration, E2E | Yes |
| Notification preferences respected | Integration | Yes |
| Notification retry on delivery failure | Integration | Yes |
| Rules Engine-triggered notifications fire correctly | Integration | Yes |
| Notification does not expose data to wrong member | Integration | Yes |

---

### 4.15 Reports

| Test Scenario | Test Type | Required |
|---|---|---|
| Report generation (financial, compliance, audit) | Integration, E2E | Yes |
| Report scheduling and delivery | Integration | Yes |
| Report results stored with metadata | Integration | Yes |
| Report access scoped by role (Operations, iCommand) | Integration | Yes |
| Member does not access operations reports | Integration | Yes |
| Export formats (PDF, CSV, XLSX) | Integration, E2E | Yes |

---

### 4.16 HeroBox

| Test Scenario | Test Type | Required |
|---|---|---|
| HeroBox feature surfaces in Member Portal | E2E | Yes |
| HeroBox content rendered for authorized member | Integration, E2E | Yes |
| HeroBox permissions enforced (member sees only their HeroBox) | Integration | Yes |

---

### 4.17 NGO Portal

| Test Scenario | Test Type | Required |
|---|---|---|
| NGO Portal accessible to authorized organizations | Integration, E2E | Yes |
| NGO-specific workflows execute correctly | Integration, E2E | Yes |
| NGO Portal data scoped to organization | Integration | Yes |
| RBAC enforced: NGO operators see only permitted functions | Integration | Yes |

---

### 4.18 Chat

**Reference**: docs/REPOSITORY_STANDARDS.md Universal Chat; docs/API_ARCHITECTURE.md Universal Chat API; docs/CODING_STANDARDS.md Chat

See [Section 6 Chat Testing](#6-chat-testing) for the comprehensive chat test specification.

---

### 4.19 Documents

**Reference**: docs/DATABASE_ARCHITECTURE.md Documents schema

| Test Scenario | Test Type | Required |
|---|---|---|
| Document upload via signed URL | Integration, E2E | Yes |
| Document metadata stored correctly | Integration | Yes |
| Document retrieval scoped to owner | Integration | Yes |
| OCR processing queued and completed | Integration | Yes |
| PII classification flags applied | Integration | Yes |
| Document retention and archival rules enforced | Integration | Yes |
| Encrypted at rest | Integration | Yes |

---

### 4.20 Trusted Devices

**Reference**: docs/REPOSITORY_STANDARDS.md Trusted Devices; docs/DATABASE_ARCHITECTURE.md Trusted Devices schema; docs/AUTHENTICATION.md

| Test Scenario | Test Type | Required |
|---|---|---|
| Trusted device registration | Integration, E2E | Yes |
| Maximum two active trusted devices enforced | Integration | Yes |
| Adding third device prompts removal of existing | Integration, E2E | Yes |
| Device removal (soft-delete, history preserved) | Integration | Yes |
| Session lifecycle associated with trusted device | Integration | Yes |
| Untrusted device session is rejected | Integration | Yes |
| Trusted device audit events recorded | Integration | Yes |
| Device record includes: id, type, OS, browser, IP, location, trust_date, last_active | Integration | Yes |

---

### 4.21 Rules Engine

See [Section 8 Rules Engine Testing](#8-rules-engine-testing) for the full specification.

---

## 5. AI Testing

All AI tests enforce the following invariant: **the AI must never expose information or allow actions outside the permissions of the signed-in user.** This invariant is absolute and its violation is a Critical test failure.

### 5.1 Permission-Aware AI

| Test Scenario | Test Type | Required |
|---|---|---|
| AI action list filtered by user's role | Integration | Yes |
| Member-role user does not see Operations actions | Integration, E2E | Yes |
| AI does not suggest actions the user cannot perform | Integration, E2E | Yes |
| AI does not return data outside user's authorization scope | Integration | Yes |
| Permission descriptors loaded from libs/ai/permissions | Unit | Yes |
| Backend enforces permissions on every AI action endpoint | Integration | Yes |
| 403 returned when AI attempts unauthorized action | Integration | Yes |

### 5.2 Correct Action Suggestions

| Test Scenario | Test Type | Required |
|---|---|---|
| AI suggests contextually relevant actions for current screen | Integration, E2E | Yes |
| Suggested actions contain correct deep-link templates | Contract | Yes |
| Suggested actions resolve to existing routes | E2E | Yes |
| AI does not suggest deprecated or removed actions | Unit | Yes |

### 5.3 Workflow Execution

| Test Scenario | Test Type | Required |
|---|---|---|
| Multi-step guided workflow progresses correctly | Integration, E2E | Yes |
| Workflow can be resumed after interruption | Integration | Yes |
| Workflow state is not shared between users | Integration | Yes |
| Workflow definitions loaded from libs/ai/workflows | Unit | Yes |
| Long-running workflow job polling returns correct status | Integration | Yes |
| Workflow completion webhook or SSE fires correctly | Integration | Yes |
| Failed workflow records error state and reason | Integration | Yes |

### 5.4 Memory Isolation

| Test Scenario | Test Type | Required |
|---|---|---|
| AI memory read/write scoped to owner_id | Integration | Yes |
| User A cannot read User B's AI memory | Integration | Yes |
| Memory namespace isolation enforced | Integration | Yes |
| Memory cleared on account deletion per retention policy | Integration | Yes |

### 5.5 Conversation Isolation

| Test Scenario | Test Type | Required |
|---|---|---|
| AI conversations scoped to conversation owner | Integration | Yes |
| User A cannot access User B's AI conversations | Integration | Yes |
| Conversation history endpoint returns only authorized conversations | Integration | Yes |
| Conversation transcripts versioned and immutable | Integration | Yes |

### 5.6 Upload Handling

**Reference**: docs/CODING_STANDARDS.md Storage & handling; docs/CI_CD.md Media uploads

| Test Scenario | Test Type | Required |
|---|---|---|
| File upload via signed URL | Integration | Yes |
| File type validation enforced (allowed MIME types) | Integration | Yes |
| File size limit enforced | Integration | Yes |
| Virus/malware scan queued asynchronously | Integration | Yes |
| Message quarantined with status: pending → safe / flagged | Integration | Yes |
| PII detection pipeline runs on uploaded documents | Integration | Yes |
| Photos, videos, voice notes, PDFs, DOCX, XLSX accepted | Integration | Yes |
| Camera and scanner uploads accepted | Integration | Yes |

### 5.7 AI Recommendations

| Test Scenario | Test Type | Required |
|---|---|---|
| Transaction classification produces correct categories | Unit, Integration | Yes |
| Spending insight recommendations are accurate | Integration | Yes |
| Fraud detection anomaly flags correctly | Integration | Yes |
| Predictive analytics results are permission-scoped | Integration | Yes |
| AI recommendations do not leak cross-member data | Integration | Yes |

### 5.8 AI Audit Logging

| Test Scenario | Test Type | Required |
|---|---|---|
| Every AI action execution emits an audit event | Integration | Yes |
| Audit event includes: actor_id, session_id, device_id, action, resource_id, correlation_id, trace_id, timestamp | Integration | Yes |
| AI audit events are immutable (append-only) | Integration | Yes |
| AI conversation history is preserved in audit for compliance | Integration | Yes |
| Failed or rejected AI actions produce audit events | Integration | Yes |

---

## 6. Chat Testing

Chat is a first-class platform feature with a single unified architecture (docs/REPOSITORY_STANDARDS.md Universal Chat). All chat surfaces share one message schema, one API contract (docs/api/chat.yaml), and one design system (libs/design-system).

### 6.1 Message Types

Every message type listed below must have unit, integration, and E2E tests.

| Message Type | Unit | Integration | E2E | Notes |
|---|---|---|---|---|
| Text messages | Yes | Yes | Yes | |
| Photos | Yes | Yes | Yes | Validate signed URL upload, metadata storage |
| Videos | Yes | Yes | Yes | Validate duration metadata |
| Voice Notes | Yes | Yes | Yes | Validate waveform metadata (optional) and duration |
| Documents (PDF, DOCX, XLSX) | Yes | Yes | Yes | Validate content-type, size, hash |
| Contacts | Yes | Yes | Yes | Validate contact card schema |
| Locations | Yes | Yes | Yes | Validate coordinates and address |
| Reactions | Yes | Yes | Yes | Add and remove reactions |
| Replies (threading) | Yes | Yes | Yes | reply_to reference, thread listing |
| Read Receipts | Yes | Yes | Yes | Delivered and read states |
| Typing Indicators | Yes | Yes | Yes | typing_start and typing_stop events |
| AI Summaries | Yes | Yes | Yes | Summary stored as message_type=summary |
| Pinned Messages | Yes | Yes | Yes | Pin and unpin |
| Message Search | Yes | Yes | Yes | Server-side indexed, paginated |

### 6.2 Chat Functional Tests

| Test Scenario | Test Type | Required |
|---|---|---|
| Create conversation (direct, group) | Integration, E2E | Yes |
| List conversations | Integration, E2E | Yes |
| Send and receive message | Integration, E2E | Yes |
| Message delivery via WebSocket/SSE | Integration, E2E | Yes |
| Read receipt marks message as read | Integration, E2E | Yes |
| Typing indicator fires and expires | Integration, E2E | Yes |
| Reply to message creates thread | Integration, E2E | Yes |
| Thread listing returns correct messages | Integration | Yes |
| Reaction summary in message payload | Integration | Yes |
| Message pagination (cursor-based) | Integration | Yes |
| Message search returns relevant results | Integration, E2E | Yes |
| AI summary generated for conversation | Integration, E2E | Yes |
| Message edited and original preserved | Integration | Yes |
| Message deleted (soft-delete, history preserved) | Integration | Yes |
| Event webhooks fire: message_received, message_updated, message_deleted, reaction_added, typing, read_receipt | Integration | Yes |

### 6.3 Chat Security Tests

| Test Scenario | Test Type | Required |
|---|---|---|
| User cannot read conversations they are not a member of | Integration | Yes |
| User cannot send messages to conversations they are not in | Integration | Yes |
| Media malware scan runs before message is marked safe | Integration | Yes |
| Signed URLs expire and cannot be replayed | Integration | Yes |
| PII-containing documents flagged for redaction | Integration | Yes |
| Chat messages encrypted in transit (TLS 1.3) | Integration | Yes |
| Chat messages encrypted at rest | Integration | Yes |
| Message content not logged in plaintext application logs | Integration | Yes |

### 6.4 Member Advisor Integration

**Reference**: docs/REPOSITORY_STANDARDS.md Member Advisor

| Test Scenario | Test Type | Required |
|---|---|---|
| Member Advisor aggregates AI Assistant, Live Chat, Tickets | Integration, E2E | Yes |
| WhatsApp Business channel status surfaced in Member Advisor | Integration | Yes |
| Voice Support and Video Support channel presence verified | Integration | Yes |
| External channel mocks live under tests/mocks/ | Unit | Yes |
| Help Center and Guides accessible from Member Advisor | E2E | Yes |

---

## 7. Security Testing

Security testing verifies that authentication, authorization, encryption, session management, and audit controls are effective. Every test in this section is required before production release.

**Reference**: docs/SECURITY_STANDARDS.md; docs/AUTHENTICATION.md; docs/RBAC.md

### 7.1 MFA

| Test Scenario | Test Type | Required |
|---|---|---|
| TOTP enrollment generates valid secret | Integration | Yes |
| TOTP verification succeeds with valid code | Integration, E2E | Yes |
| TOTP verification fails with expired code | Integration | Yes |
| SMS OTP sent and verified | Integration, E2E | Yes |
| SMS OTP expires after defined window | Integration | Yes |
| Recovery codes valid for single use only | Integration | Yes |
| MFA required for high-risk actions | Integration, E2E | Yes |
| Brute-force MFA attempts blocked after threshold | Integration | Yes |

### 7.2 Passkeys (WebAuthn)

| Test Scenario | Test Type | Required |
|---|---|---|
| Passkey registration ceremony succeeds | Integration, E2E | Yes |
| Passkey authentication assertion verified | Integration, E2E | Yes |
| Invalid passkey assertion rejected | Integration | Yes |
| Passkey removed and re-registration required | Integration | Yes |
| Passkey origin validated (relying party ID) | Integration | Yes |

### 7.3 Session Management

| Test Scenario | Test Type | Required |
|---|---|---|
| Session terminated after 5–10 minutes of inactivity | Integration | Yes |
| High-risk action requires fresh authentication | Integration, E2E | Yes |
| Session invalidated on sign-out | Integration | Yes |
| Refresh token rotated on use | Integration | Yes |
| Previous refresh token invalidated after rotation | Integration | Yes |
| Session associated with device_id and session_id in Redis | Integration | Yes |
| Concurrent session from different device rejected (if policy requires) | Integration | Yes |
| Session data never exposed in client-accessible storage in plaintext | Integration | Yes |

### 7.4 Trusted Devices

| Test Scenario | Test Type | Required |
|---|---|---|
| Maximum two active trusted devices enforced | Integration | Yes |
| Adding third device requires removing one existing | Integration, E2E | Yes |
| Untrusted device cannot establish an authenticated session | Integration | Yes |
| Device trust requires explicit approval (email/MFA confirmation) | Integration, E2E | Yes |
| Trusted device audit events recorded with full metadata | Integration | Yes |

### 7.5 Password Recovery

| Test Scenario | Test Type | Required |
|---|---|---|
| Recovery email sent to registered address only | Integration | Yes |
| Recovery token single-use and expires | Integration | Yes |
| Password reset requires MFA confirmation | Integration, E2E | Yes |
| New password meets complexity requirements | Unit, Integration | Yes |
| Old sessions invalidated after password reset | Integration | Yes |

### 7.6 Rate Limiting

| Test Scenario | Test Type | Required |
|---|---|---|
| Authentication endpoint rate limited | Integration | Yes |
| MFA endpoint rate limited | Integration | Yes |
| Password recovery rate limited | Integration | Yes |
| AI prompt endpoint rate limited per token quota | Integration | Yes |
| Rate limit headers returned (X-RateLimit-Limit, -Remaining, -Reset) | Integration | Yes |
| 429 returned when limit exceeded | Integration | Yes |

### 7.7 Permission Boundaries

| Test Scenario | Test Type | Required |
|---|---|---|
| Every privileged API endpoint returns 403 for unauthorized caller | Integration | Yes |
| RBAC permissions enforced on backend, not only in UI | Integration | Yes |
| Hidden authority levels never returned in any API response | Integration | Yes |
| Internal permission identifiers never exposed in UI or API | Integration | Yes |
| Row-level security prevents cross-member data access | Integration | Yes |
| AI permission boundaries verified per role | Integration | Yes |

### 7.8 Encryption

| Test Scenario | Test Type | Required |
|---|---|---|
| All API traffic uses TLS 1.3 | Integration | Yes |
| Card PAN stored as token only (no plaintext PAN in DB) | Integration | Yes |
| Sensitive fields encrypted at column level (KMS) | Integration | Yes |
| Document files encrypted at rest in object storage | Integration | Yes |
| AI memory encrypted at rest | Integration | Yes |
| Key rotation does not break decryption of existing data | Integration | Yes |
| S3 objects use server-side encryption | Integration | Yes |

### 7.9 Audit Logging

| Test Scenario | Test Type | Required |
|---|---|---|
| Every sensitive action produces an audit event | Integration | Yes |
| Audit events include: actor_id, session_id, device_id, IP, correlation_id, trace_id, action, resource_id, before_state, after_state, timestamp | Integration | Yes |
| Audit log is append-only (no updates or deletes) | Integration | Yes |
| Audit events forwarded to immutable/WORM storage | Integration | Yes |
| Audit log search and retrieval by actor_id and resource_id | Integration | Yes |
| Correlation ID propagated through async Kafka events | Integration | Yes |

### 7.10 SAST and DAST

| Test | Cadence | Gate |
|---|---|---|
| CodeQL SAST | Every PR and main push | Critical findings block merge |
| Secret scanning | Every push | High-risk secrets block push |
| SCA (dependency audit) | Every PR | Critical vulnerabilities block merge |
| Container image scan (Trivy) | Every build | Critical findings block build |
| DAST (OWASP ZAP) against staging | Pre-production promotion | Critical/High findings block promotion |
| Penetration test | Annual | Findings tracked and remediated |

---

## 8. Rules Engine Testing

The Rules Engine drives automatic verification routing, case assignment, notifications, AI suggestions, workflow progression, and escalations. All rules must be tested as first-class artifacts.

| Test Scenario | Test Type | Required |
|---|---|---|
| Verification request automatically routed to correct queue | Integration | Yes |
| Case automatically assigned to correct operations user by workload | Integration | Yes |
| Notification triggered automatically on verification status change | Integration | Yes |
| Notification triggered on payment status change | Integration | Yes |
| AI suggestion triggered for operations user when case requires review | Integration | Yes |
| Workflow progresses to next stage on rule condition | Integration | Yes |
| Escalation triggers when SLA threshold breached | Integration | Yes |
| Escalation notification sent to correct supervisor | Integration | Yes |
| Rule condition evaluated correctly (positive and negative cases) | Unit | Yes |
| Rule change does not break existing workflows (regression) | Integration | Yes |
| RBAC integrated with Rules Engine (tasks assigned per role) | Integration | Yes |
| Rules Engine produces audit event for every rule trigger | Integration | Yes |
| Rules Engine does not expose unauthorized data via notifications | Integration | Yes |

---

## 9. Performance Testing

All response time targets derive from docs/ARCHITECTURE.md Non-Functional Requirements and docs/DATABASE_ARCHITECTURE.md Session security model.

### 9.1 Baseline Response Time Targets

| Operation | Target (P99) | Measurement |
|---|---|---|
| Login (credential validation to authenticated session) | < 500ms | API response time |
| Dashboard initial load (data + render) | < 2s | Time to interactive |
| Transaction list (first page) | < 200ms | API response time |
| Transaction search | < 500ms | API response time |
| Report generation (standard report) | < 5s | API response time |
| AI response (first token) | < 1s | Time to first token |
| AI response (complete) | < 10s | Total response time |
| Chat message send/receive round-trip | < 200ms | WebSocket/SSE latency |
| File upload (initiate signed URL request) | < 200ms | API response time |
| Member-facing API (general) | < 200ms | P99 API response time |
| Database query | < 100ms | P99 query time |
| Cache hit rate | > 95% | Cache metric |

### 9.2 Performance Test Scenarios

| Scenario | Description | Pass Criterion |
|---|---|---|
| Login under load | 1,000 concurrent login attempts | All complete within 500ms P99 |
| Dashboard concurrent users | 5,000 concurrent member dashboard sessions | Load < 2s P99 |
| Transaction history | 10,000 concurrent transaction list requests | P99 < 200ms, no errors |
| Report generation | 500 concurrent report requests | P99 < 5s |
| AI concurrent requests | 500 concurrent AI prompt submissions | First token < 1s P99 |
| Chat message throughput | 10,000 messages/second | Round-trip < 200ms P99 |
| File upload throughput | 1,000 concurrent uploads | Signed URL < 200ms P99 |
| Full peak load simulation | Simulate peak production traffic | SLO: P99 < 200ms, error rate < 0.1% |

### 9.3 Frontend Performance

| Metric | Target |
|---|---|
| First Contentful Paint (FCP) | < 1.5s |
| Time to Interactive (TTI) | < 3s |
| Largest Contentful Paint (LCP) | < 2.5s |
| Cumulative Layout Shift (CLS) | < 0.1 |
| JavaScript bundle size (member web) | < 300KB gzipped (initial) |
| Code splitting enforced at route and module boundaries | Required |

---

## 10. Accessibility Testing

**Reference**: docs/COMPONENT_ARCHITECTURE.md Accessibility First; docs/CODING_STANDARDS.md Accessibility baseline

### 10.1 Standards

- **Baseline**: WCAG 2.2 AA for all public-facing UI and internal operations/admin surfaces.
- ARIA roles required for all interactive components.
- All interactive elements keyboard-accessible.
- Minimum touch target size: 48×48px (per docs/COMPONENT_ARCHITECTURE.md).
- Color contrast ratios must meet WCAG AA minimums.

### 10.2 Accessibility Test Checklist

| Test | Type | Gate |
|---|---|---|
| Axe-core automated accessibility scan | Automated (Playwright + axe) | Critical/serious violations block merge |
| Keyboard navigation through all primary flows | E2E | Required |
| Screen reader compatibility (NVDA, VoiceOver) | Manual | Required before major release |
| Focus management on modals and dialogs | Unit, E2E | Required |
| ARIA labels on all form inputs | Unit | Required |
| Color contrast ratio verification | Automated | Required |
| Skip navigation link present | E2E | Required |
| Semantic HTML validated | Unit | Required |
| Motion preference respected (prefers-reduced-motion) | Unit | Required |
| Touch targets ≥ 48×48px | Unit, E2E | Required |

---

## 11. Regression Testing

### 11.1 When Regression Tests Run

- After every Base44 refactor PR.
- After every dependency upgrade.
- After every schema migration.
- On every release branch before promotion.

### 11.2 Regression Scope

- Full E2E suite for all features in [Section 4 Functional Testing Matrix](#4-functional-testing-matrix).
- All security tests in [Section 7](#7-security-testing).
- All AI tests in [Section 5](#5-ai-testing).
- All chat tests in [Section 6](#6-chat-testing).
- All Rules Engine tests in [Section 8](#8-rules-engine-testing).

### 11.3 Regression Test Policy

- Regression failures must be resolved before merge to release branch.
- Known failures must be documented with an open tracking ticket and classified as critical, major, or minor.
- Critical regressions block release.
- After Base44 refactor PRs, behavior parity is verified by running the regression suite against both the before and after states and comparing results.

---

## 12. Disaster Recovery Testing

**Reference**: docs/ARCHITECTURE.md Availability; docs/DATABASE_ARCHITECTURE.md Backup & Disaster Recovery

### 12.1 RTO and RPO Targets

| Objective | Target |
|---|---|
| Recovery Time Objective (RTO) | < 30 minutes |
| Recovery Point Objective (RPO) | < 5 minutes |
| Production uptime SLO | 99.95% |

### 12.2 DR Test Scenarios

| Scenario | Frequency | Pass Criterion |
|---|---|---|
| Database primary failover to read replica | Quarterly | Failover completes within RTO; no data loss beyond RPO |
| Point-in-time restore from WAL backup | Quarterly | Restore completes; data integrity verified |
| Cross-region failover (if multi-region) | Annually | Services operational in DR region within RTO |
| Redis session store failure | Quarterly | Sessions gracefully terminated; re-authentication required; no data loss |
| Kafka consumer lag recovery | Quarterly | Consumer catches up; no duplicate events processed |
| Full platform restore from backup | Annually | Full restore verified in isolated environment within RTO |
| Database migration rollback | Before every migration | Rollback script reverts schema without data loss |

### 12.3 DR Test Evidence

All DR test results must be recorded as artifacts and linked to compliance evidence. Test reports must include:
- Date and environment
- Scenario executed
- RTO and RPO achieved
- Data integrity verification result
- Issues discovered and remediation

---

## 13. Base44 Migration Testing

**Reference**: docs/MIGRATION_GUIDE.md

Testing must verify that every imported Base44 feature matches the documented VANTORIS architecture. Migration testing runs at each phase of the migration process.

### 13.1 Feature Classification

Every migrated feature must be classified after testing:

| Status | Definition |
|---|---|
| **Verified** | Feature is functional, tested, and matches documented architecture. Evidence exists. |
| **Needs Refactoring** | Feature is functional but does not fully match architecture. Tracked on a ticket with plan. |
| **Failed** | Feature is imported but tests fail. Release blocked until resolved. |
| **Missing** | Feature is documented but not present in import. Tracked on a ticket with priority. |

### 13.2 Phase-by-Phase Test Requirements

**Phase 2: Import Verification**

| Test | Required |
|---|---|
| Build succeeds in CI without errors | Yes |
| All existing tests pass post-import | Yes |
| Folder structure matches docs/REPOSITORY_STRUCTURE.md | Yes |
| Workspace dependencies resolve | Yes |
| No secrets committed in import | Yes (secret scanning) |
| Authentication flow operational | Yes |
| Core banking API endpoints return 200 in staging smoke test | Yes |

**Phase 3: Architecture Comparison**

| Test | Required |
|---|---|
| Imported modules mapped against documented architecture | Yes |
| Missing modules identified and tracked | Yes |
| Duplicated functionality identified and flagged | Yes |
| Implementation report produced per docs/MIGRATION_GUIDE.md format | Yes |
| Feature classification applied (Verified / Needs Refactoring / Failed / Missing) | Yes |

**Phase 4: Refactor Verification**

| Test | Required |
|---|---|
| Behavior-preserving test suite (unit + integration + contract) before refactor | Yes |
| Same test suite passes after refactor | Yes |
| API schema changes follow migration plan | Yes |
| Evidence artifacts attached to refactor PR | Yes |
| No removal of features until replacements are verified | Yes |

**Phase 5: Production Readiness**

| Test | Required |
|---|---|
| All critical tests passing | Yes |
| All security tests passing | Yes |
| All accessibility tests passing | Yes |
| Performance targets met | Yes |
| All critical features classified as Verified | Yes |
| No features classified as Failed | Yes |
| DR tests completed | Yes |
| Release criteria in [Section 16](#16-release-criteria) met | Yes |

### 13.3 Data Migration Verification

| Test | Required |
|---|---|
| Members data migrated without loss | Integration | Yes |
| Organizations data migrated without loss | Integration | Yes |
| Accounts data migrated with correct balances | Integration | Yes |
| Transactions and ledger entries migrated intact | Integration | Yes |
| Audit log history preserved (never lose audit history) | Integration | Yes |
| Verification records migrated with correct status | Integration | Yes |
| Trusted device records migrated with history | Integration | Yes |
| Chat history migrated with correct participants | Integration | Yes |
| AI conversation data migrated with correct owner scoping | Integration | Yes |
| Documents migrated with correct owner and encryption | Integration | Yes |
| ID references preserved or remapped with reconciliation | Integration | Yes |
| No orphaned records after migration | Integration | Yes |

### 13.4 Rollback Testing

Per docs/MIGRATION_GUIDE.md Rollback requirements, rollback must be verified before each migration phase is applied:

| Rollback Scenario | Required |
|---|---|
| Build failure → rollback to previous image | Yes |
| Authentication break → rollback and verify | Yes |
| Unexpected permission change → detect and rollback | Yes |
| Data integrity loss → halt migration and restore from backup | Yes |
| Database migration → rollback script verified against ephemeral DB in CI | Yes |

---

## 14. Test Environment Strategy

**Reference**: docs/CI_CD.md Environments; docs/ARCHITECTURE.md Environment Strategy

### 14.1 Environments

| Environment | Purpose | Branch / Trigger |
|---|---|---|
| Development (ephemeral) | Feature branch preview | PR open (if provisioned) |
| Staging | Integration, E2E, security, performance | Merge to main |
| Production | Live system | Tagged release after staging validation |
| Isolated (DR) | Disaster recovery drills | Scheduled |

### 14.2 Test Data Strategy

- Tests must use dedicated test accounts and test organizations. Never use production data in tests.
- Test data setup and teardown must be idempotent.
- PII in test data must be synthetic. No real member PII in test fixtures.
- External service calls (KYC providers, payment networks, WhatsApp, SMS) must use mocks or sandboxes in all non-production environments. Mocks live under `tests/mocks/`.
- Ledger integration tests must restore initial balance state after each test run.

### 14.3 Test Doubles

| External System | Test Double Type |
|---|---|
| KYC / Identity provider | Mock server under tests/mocks/ |
| Payment networks (ACH, Wire, Zelle) | Sandbox / mock server |
| Card networks (Visa, Mastercard) | Sandbox |
| SMS provider (Twilio) | Mock |
| Email provider (SendGrid) | Mock |
| WhatsApp Business API | Mock under tests/mocks/ |
| AI LLM (OpenAI, Anthropic) | Mock / deterministic stub for unit/integration; live for E2E smoke |
| Vector database | In-memory mock for unit/integration |
| S3 / object storage | LocalStack or MinIO |
| PostgreSQL | Testcontainers (ephemeral) |
| Redis | Testcontainers or in-memory |
| Kafka | Testcontainers |

---

## 15. Evidence Requirements

**Reference**: docs/REPOSITORY_STANDARDS.md Verification-First; docs/CI_CD.md Evidence

Every user-facing feature change must include an Evidence artifact in the PR. CI enforces the presence of Evidence metadata for feature-flagged changes.

### 15.1 Required Evidence Fields

- Files modified
- Components modified
- Routes modified
- APIs affected
- Database changes (migrations, schema diffs)
- Build status (CI job link)
- Runtime verification (staging URL or healthcheck ID)
- Integration verification (E2E run ID, Playwright trace, or screencast)

### 15.2 Evidence Artifact Types

Choose one or more:
- Live staging URL with annotated steps
- E2E test run ID with Playwright trace attached
- Short screencast (MP4) demonstrating the feature
- Automated API contract test report

### 15.3 Feature Status Labels

Every feature entry in release notes must carry exactly one of:
- **Verified** — Evidence exists and staging tests passed.
- **Created but not integrated** — Code exists but integration evidence is absent or integration tests fail.
- **Not implemented** — Listed in docs but no code present.

---

## 16. Release Criteria

A production release requires all of the following criteria to be satisfied. No exceptions. A release is blocked if any criterion is not met.

### 16.1 Functional Criteria

- [ ] All critical tests in [Section 4 Functional Testing Matrix](#4-functional-testing-matrix) are passing.
- [ ] All E2E smoke tests on staging are passing.
- [ ] No features classified as **Failed** in Base44 Migration Testing.
- [ ] All migrated features classified as **Verified** or **Needs Refactoring** (Needs Refactoring is permitted only if a tracked remediation ticket exists and the feature is non-critical).

### 16.2 Security Criteria

- [ ] No critical or high security findings from CodeQL SAST.
- [ ] No critical or high findings from DAST (OWASP ZAP) on staging.
- [ ] No unmitigated critical or high SCA vulnerabilities.
- [ ] No secrets committed (secret scanning passed).
- [ ] Container image scan (Trivy) has no critical unmitigated findings.
- [ ] Permission verification complete: all RBAC boundary tests passing.
- [ ] Trusted device enforcement verified.
- [ ] Session management controls verified.
- [ ] Encryption at rest and in transit verified.

### 16.3 AI Criteria

- [ ] AI verification complete: all AI permission tests passing.
- [ ] AI memory and conversation isolation verified.
- [ ] AI never exposes unauthorized information (invariant passing).
- [ ] AI audit logging verified.
- [ ] AI workflow execution verified.

### 16.4 Audit and Compliance Criteria

- [ ] Audit verification complete: all audit logging tests passing.
- [ ] Immutable audit log integrity verified.
- [ ] Correlation ID propagation through async systems verified.
- [ ] Ledger double-entry balance integrity verified.
- [ ] AML/KYC compliance checks in payment flow verified.

### 16.5 Performance Criteria

- [ ] Performance targets achieved (all metrics in [Section 9.1](#91-baseline-response-time-targets) met under load).
- [ ] Peak load simulation passed (error rate < 0.1%, SLOs met).
- [ ] Frontend performance targets met (FCP < 1.5s, LCP < 2.5s, TTI < 3s).

### 16.6 Accessibility Criteria

- [ ] No critical or serious accessibility violations in automated scan.
- [ ] Manual screen reader review completed for major flows.
- [ ] Keyboard navigation verified for all primary user journeys.

### 16.7 Evidence Criteria

- [ ] Evidence artifacts present for all user-facing features.
- [ ] Release notes classify all features with correct status labels.
- [ ] OWNERS sign-off on all modified services.
- [ ] No PRs merged to release branch without required approvals.

---

## 17. Cross-References

| Document | Relationship |
|---|---|
| docs/ARCHITECTURE.md | System-level NFRs (performance, availability, security) and technology stack decisions referenced throughout |
| docs/COMPONENT_ARCHITECTURE.md | Accessibility-First and Testable Architecture principles; semantic query requirements for E2E tests |
| docs/REPOSITORY_STRUCTURE.md | Canonical paths for test files (tests/e2e/, tests/contract/, tests/mocks/) and workspace structure |
| docs/REPOSITORY_STANDARDS.md | Verification-First policy, Evidence requirements, AI/ACC platform requirements, Universal Chat, Trusted Device, Verification Center rules |
| docs/CODING_STANDARDS.md | Testing Requirements (coverage thresholds, test tools, flaky test policy), AI modularity, Chat, Permission Gating, Personalization |
| docs/CI_CD.md | CI pipeline gates, evidence enforcement, environment strategy, AI feature CI requirements, security scans |
| docs/API_ARCHITECTURE.md | Contract test requirements, API versioning policy, Error model, AI APIs, Chat APIs, Verification APIs |
| docs/DATABASE_ARCHITECTURE.md | Ledger integrity requirements, schema domains, session security model, DR requirements, test DB requirements |
| docs/SECURITY_STANDARDS.md | (planned) Full security controls, PII retention, encryption policies, compliance requirements |
| docs/AUTHENTICATION.md | (planned) Authentication flows, session management, trusted device rules |
| docs/RBAC.md | (planned) RBAC model, user types, permission rules |
| docs/MIGRATION_GUIDE.md | (planned) Migration phases, rollback requirements, feature classification |

---

## Dependencies and Gaps

The following dependencies and gaps were identified during the authoring of this document:

1. **docs/SECURITY_STANDARDS.md** — referenced throughout Security Testing but not yet present. Must be created before the security test suite can be finalized. PII retention policies, encryption key management details, and data redaction rules are needed.

2. **docs/AUTHENTICATION.md** — referenced for authentication and session management tests but not yet present. Session inactivity intervals, fresh auth requirements, and WebAuthn ceremony details must be confirmed.

3. **docs/RBAC.md** — referenced for permission boundary tests but not yet present. Exact role-to-permission mappings and hidden authority rules must be formalized.

4. **docs/MIGRATION_GUIDE.md** — referenced for Base44 migration testing phases but not yet present. Phase boundaries and rollback criteria must be confirmed.

5. **docs/api/chat.yaml** — the Universal Chat OpenAPI contract must be committed before contract tests can be written. Referenced in docs/REPOSITORY_STANDARDS.md.

6. **libs/ai/permissions/** — permission descriptor files must be created before AI permission tests can be implemented.

7. **libs/ai/workflows/** — workflow definitions must be created before AI workflow tests can be implemented.

8. **Vector DB selection** — undecided per docs/DATABASE_ARCHITECTURE.md. AI memory tests use an in-memory stub until the production vector DB is selected.

9. **Message search engine** — undecided (Postgres full-text vs Elasticsearch). Chat search tests currently assume server-side indexed queries; the specific engine does not affect test contracts.

10. **Tenancy strategy** — shared schema + RLS is recommended per docs/DATABASE_ARCHITECTURE.md but not yet confirmed. Row-level isolation tests assume RLS policies. If schema-per-tenant is chosen, test isolation strategy must be updated.

11. **HeroBox and NGO Portal** — functional scope is referenced but not fully documented. Tests must be updated when these feature specifications are complete.

---

## Remaining Documentation

The following documents must be created before the testing strategy can be fully implemented:

1. **docs/SECURITY_STANDARDS.md** — encryption, PII, retention, incident response
2. **docs/AUTHENTICATION.md** — authentication flows, session rules, WebAuthn
3. **docs/RBAC.md** — complete role-permission model
4. **docs/MIGRATION_GUIDE.md** — Base44 migration phases and rollback procedures
5. **docs/VERIFICATION_CENTER.md** — verification flows and third-party integration details
6. **docs/DESIGN_SYSTEM.md** — design tokens, component catalog, accessibility documentation
7. **docs/DOCUMENTATION_STANDARDS.md** — standards for documentation authoring

---

## Recommendations

Before the next document is authored:

1. **Create docs/SECURITY_STANDARDS.md next.** Security tests are the highest-priority gate for production release. PCI DSS, AML/KYC, session security, and encryption rules must be codified before the security test suite can be finalized.

2. **Create docs/AUTHENTICATION.md and docs/RBAC.md.** Permission boundary tests and authentication tests reference these documents. Without them, critical test scenarios cannot be written.

3. **Create docs/MIGRATION_GUIDE.md.** Phase-by-phase test requirements in Section 13 reference the migration guide. The guide must define phase gates, rollback checkpoints, and feature classification rules.

4. **Commit the chat OpenAPI contract (docs/api/chat.yaml).** Contract tests for chat are blocked until this file exists.

5. **Define test data management policy.** A test data management document or section in a future runbook should formalize how test accounts are created, seeded, and cleaned up in staging.

6. **Select the Vector DB.** AI memory tests use an in-memory stub. The production vector DB selection should be made during Phase 2 of the Base44 migration so integration tests can target the real system.

7. **Provision a Playwright test account for each role.** Staging must have test accounts for Public Visitor, Member, Operations, Support, and iCommand roles to enable RBAC boundary E2E tests.

8. **Define the Rules Engine specification document.** Rules Engine tests in Section 8 reference rule conditions and escalation policies that must be formally documented before implementation tests can be written.

---

Files created by this commit

- Created: docs/TESTING.md

This is a documentation-only commit. No application code was generated.
