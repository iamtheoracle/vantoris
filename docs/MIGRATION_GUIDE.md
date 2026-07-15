# VANTORIS Migration Guide — Base44 Import

Status: normative. This document defines the official, incremental migration process for importing the Base44 codebase into the VANTORIS GitHub repository. It is the authoritative procedural reference for every participant in the migration. All architectural decisions recorded in the documents listed under [Source of Truth](#source-of-truth) apply without exception.

---

## Table of Contents

1. [Purpose](#purpose)
2. [Source of Truth](#source-of-truth)
3. [General Rules](#general-rules)
4. [Architecture Alignment Summary](#architecture-alignment-summary)
5. [Migration Phases](#migration-phases)
   - [Phase 1 — Export & Backup](#phase-1--export--backup)
   - [Phase 2 — Import into GitHub](#phase-2--import-into-github)
   - [Phase 3 — Inventory & Gap Analysis](#phase-3--inventory--gap-analysis)
   - [Phase 4 — Incremental Refactoring](#phase-4--incremental-refactoring)
   - [Phase 5 — Testing & Production Readiness](#phase-5--testing--production-readiness)
6. [Verification Checklist](#verification-checklist)
7. [Data Migration](#data-migration)
8. [Feature Parity Classification](#feature-parity-classification)
9. [Implementation Report Template](#implementation-report-template)
10. [Rollback Procedures](#rollback-procedures)
11. [Base44 Preservation Requirements](#base44-preservation-requirements)
12. [Cross-References](#cross-references)

---

## Purpose

This document defines the official migration process from Base44 into the VANTORIS GitHub repository.

**Objective**: Preserve all business logic, member experience, and operational workflows while restructuring the codebase to match the architecture documented across this repository. Improve architecture, maintainability, performance, and accessibility without changing intended behavior unless explicitly approved.

VANTORIS must provide a unified operating experience. Members and operators perform their work entirely within the platform. External integrations are abstracted behind the platform so no user or operator must switch to a third-party system. The AI Assistant and Operations Center automate routine workflows, coordinate tasks, and surface decisions. Manual intervention is reserved for high-risk or regulatory-mandated cases. This principle governs every migration decision.

---

## Source of Truth

The following documents are the authoritative source of truth for every migration decision. All imported code and all refactoring work must be aligned to these documents before being marked complete.

| Document | Location | Authority |
|---|---|---|
| README | README.md | Platform overview |
| Architecture Guide | docs/ARCHITECTURE.md | System-level architecture |
| Component Architecture | docs/COMPONENT_ARCHITECTURE.md | UI component hierarchy |
| Repository Structure | docs/REPOSITORY_STRUCTURE.md | Canonical folder layout |
| Repository Standards | docs/REPOSITORY_STANDARDS.md | Engineering and repository rules |
| Coding Standards | docs/CODING_STANDARDS.md | Mandatory engineering standards |
| CI/CD Specification | docs/CI_CD.md | Pipeline design and evidence requirements |
| API Architecture | docs/API_ARCHITECTURE.md | Contract-first API and OpenAPI layout |
| Database Architecture | docs/DATABASE_ARCHITECTURE.md | Domain models and data ownership |
| Security Standards | docs/SECURITY_STANDARDS.md | Zero Trust, encryption, audit, compliance |
| Authentication | docs/AUTHENTICATION.md | Auth methods, session management, profile |
| RBAC | docs/RBAC.md | Authorization model and permission rules |

When a conflict exists between Base44 behavior and these documents, the conflict must be documented in the Implementation Report and escalated before proceeding.

---

## General Rules

These rules apply to every phase, every commit, and every participant.

- **Never rewrite working business logic without justification.** Business logic may be moved, reorganized, or decomposed into modules, but it must not be replaced unless a test suite proves parity and the change is explicitly approved.
- **Refactor only after successful import.** Phase 2 must be complete and the build must be green before any refactoring begins.
- **Preserve IDs and relationships wherever possible.** Member IDs, account IDs, transaction IDs, and ledger references must not be changed without a documented migration plan that preserves referential integrity.
- **Keep migrations incremental and reversible.** Every migration step must be a small, atomic change that can be rolled back independently.
- **Every migration step must be verifiable.** No step is complete without Evidence (see [Implementation Report Template](#implementation-report-template)).
- **Implementation-First.** Do not rebuild from scratch. Refactor the imported code. Do not create replacement or demo applications.
- **Verification-First.** A feature is not complete until it is verified in a running environment with Evidence. Features without evidence are labeled "Created but not integrated."
- **Never expose hidden authorities or internal codes.** Authentication establishes identity; RBAC determines permissions.
- **Never lose audit history.** Audit logs are immutable and append-only. No migration step may delete or modify audit records.
- **VANTORIS is the unified interface.** No migration decision may introduce a workflow that requires users or operators to interact with an external system directly.

---

## Architecture Alignment Summary

All imported code must ultimately conform to the following architectural boundaries. This summary is distilled from the Source of Truth documents above and serves as a quick reference for migration decisions.

### Repository Layout

```
/
  apps/
    member-web/       # Member-facing React SPA
    member-mobile/    # React Native (if applicable)
    operations/       # Operations Center dashboard
    services/         # Deployable backend services
  libs/
    design-system/    # Shared design system and component library
    api-client/       # Generated or hand-crafted API clients
    ai/               # AI modules (ui, services, workflows, permissions, prompts, actions, memory, integrations)
    authz/            # Shared authorization library (RBAC engine)
    models/           # Shared domain models and types (profile, member, account, etc.)
    utils/            # Shared utilities
    configs/          # ESLint, Prettier, tsconfig configs
    messages/         # Unified chat message schema
  infra/              # IaC (Terraform, k8s, Helm)
  scripts/            # Migration and bootstrap helpers
  docs/               # Architecture and operational documentation
  .github/            # CI workflows, issue/PR templates
```

### Technology Standards

- **Package manager**: pnpm workspaces
- **Runtime**: Node.js LTS
- **Language**: TypeScript (strict mode; no `any` without documented justification)
- **Frontend**: React 18+, Vite, Tailwind CSS, TanStack Query
- **Backend**: Nest.js (or Fastify/Express) with TypeScript
- **Database**: PostgreSQL 16+ with node-pg-migrate
- **Cache**: Redis
- **Events**: Kafka (or equivalent)
- **CI/CD**: GitHub Actions
- **Auth**: OAuth2 / OIDC / JWT with refresh token rotation; WebAuthn for passkeys

### Authentication Model

Authentication methods (from docs/AUTHENTICATION.md):
- Email
- Phone Number
- Username (optional)
- Passkeys (WebAuthn)
- Biometrics (Face ID, Touch ID)
- MFA (TOTP, SMS, email OTP)
- Recovery Codes

Session rules:
- Sessions terminate after 5–10 minutes of inactivity
- High-risk actions always require fresh authentication
- Maximum of two trusted devices per member
- Adding a third trusted device requires removing one existing device

Member profile model (required fields):
- Legal First Name (required)
- Legal Middle Name (optional)
- Legal Last Name (required)
- Preferred Name (optional)

Display priority: Preferred Name → Legal First Name → Legal First Name + Legal Last Name. Never use email usernames for greetings or display names.

### RBAC Model

Authorization roles (from docs/RBAC.md):
- Public Visitor
- Member (Personal, Joint, Business)
- Operations
- Support & Member Services
- VANTORIS iCommand

Rules:
- Hide rather than disable unavailable features
- Never expose hidden authorities or internal permission codes
- AI assistants inherit the signed-in user's permissions
- Authentication only establishes identity; authorization determines permissions

### Core Platform Surfaces

Every imported module must map to one or more of the following canonical surfaces:

| Surface | Workspace Path | Role Access |
|---|---|---|
| Member Portal | apps/member-web, apps/member-mobile | Member |
| Operations Center | apps/operations | Operations, Support |
| VANTORIS iCommand | apps/operations (restricted routes) | iCommand |
| AI Command Center | libs/ai + ACC routes in each workspace | Inherits user role |
| Member Advisor | apps/member-web (support hub) | Member, Support |
| Verification Center | apps/member-web (verification routes) | Member, Operations |
| Chat | libs/messages + per-app chat surfaces | Member, Operations, Support |

---

## Migration Phases

### Phase 1 — Export & Backup

**Goal**: Produce a complete, verified snapshot of the Base44 source before any changes are made to the VANTORIS repository.

**Steps**:

1. **Export Base44 source**
   - Export the complete Base44 project including all services, configuration, environment variable templates (without secrets), database schema definitions, and scripts.
   - If Base44 uses a Git repository, prefer a `git bundle` or remote fetch to preserve commit history (see REPOSITORY_STANDARDS.md — Base44 migration section).
   - If commit history cannot be preserved, document the decision and export as a single archive with a manifest.

2. **Verify completeness**
   - Confirm all services listed in the architecture are present: member frontend, operations dashboard, backend services, database migrations, AI/chat service, notification service, verification service.
   - Confirm all environment variable keys are captured (values are excluded; secrets must never be committed).
   - Confirm database schema and seed data are included.
   - Confirm configuration files (package.json, tsconfig, ESLint, Docker, CI stubs) are included.

3. **Backup source**
   - Store the verified export in a secure location external to the VANTORIS repository (private object storage, encrypted archive, or a separate private repository).
   - Record the export date, content hash, and responsible party in the Phase 1 Implementation Report.
   - This backup is the rollback point for the entire migration. It must remain intact until Phase 5 is complete and production deployment is verified.

**Phase 1 Completion Criteria**:
- [ ] Export archive or git bundle created and stored securely
- [ ] Content manifest produced listing all services and files
- [ ] Environment variable keys documented (no values)
- [ ] Database schema and migration scripts confirmed present
- [ ] Phase 1 Implementation Report committed to docs/reports/phase-1.md
- [ ] Rollback: restore from backup archive is confirmed viable

---

### Phase 2 — Import into GitHub

**Goal**: Import the Base44 source into the VANTORIS monorepo structure without modifying any business logic.

**Pre-import checklist** (from REPOSITORY_STANDARDS.md):
- [ ] Legal ownership and licensing for Base44 code cleared and documented
- [ ] Decision recorded: preserve commit history via `git remote + fetch + merge` or import as squashed commit
- [ ] Mapping of Base44 services/packages to `/apps/` and `/libs/` documented (see mapping table below)
- [ ] OWNERS files prepared for each imported service
- [ ] pnpm-workspace.yaml and root package.json prepared
- [ ] CI jobs prepared for the import branch

**Service Mapping Table** (to be completed with actual Base44 service names):

| Base44 Service/Package | VANTORIS Target Path | Type |
|---|---|---|
| Member frontend | apps/member-web | app |
| Operations frontend | apps/operations | app |
| Auth service | apps/services/auth | service |
| Account service | apps/services/account | service |
| Transaction service | apps/services/transaction | service |
| Payment service | apps/services/payment | service |
| Card service | apps/services/card | service |
| Investment service | apps/services/investment | service |
| Crypto service | apps/services/crypto | service |
| Notification service | apps/services/notification | service |
| Chat service | apps/services/chat | service |
| AI/Advisor service | apps/services/ai | service |
| Verification service | apps/services/verification | service |
| Document service | apps/services/document | service |
| Report service | apps/services/report | service |
| Shared UI components | libs/design-system | lib |
| Shared business logic | libs/utils, libs/models | lib |
| Shared API clients | libs/api-client | lib |
| Database migrations | scripts/migrations | scripts |
| Infrastructure | infra/ | infra |

**Import steps**:

1. Create a long-lived import branch: `import/base44-source`
2. Import files into mapped paths while preserving internal folder structure
3. Add OWNERS files for each service and infra component
4. Add workspace package.json entries and verify pnpm-workspace.yaml is complete
5. Commit as a single import commit (or a merge commit if preserving history)
6. Do not modify business logic during import — import only

**Verify dependencies**:
- Run `pnpm install` and confirm all dependencies resolve
- Check for dependency conflicts, security advisories, and license issues
- Document unresolved dependencies in the Phase 2 Implementation Report

**Build verification**:
- Run `pnpm build` across all workspaces
- Fix only build-blocking errors (missing type declarations, missing modules) during Phase 2
- Do not refactor during build fixing — apply minimal corrections only
- CI must pass before Phase 2 is considered complete

**Phase 2 Completion Criteria**:
- [ ] All Base44 source imported into mapped paths
- [ ] OWNERS files present for each service and infra component
- [ ] pnpm-workspace.yaml and root package.json committed
- [ ] `pnpm install` succeeds with no unresolved dependencies
- [ ] `pnpm build` succeeds for all workspaces
- [ ] CI pipeline passes on import branch
- [ ] No business logic was modified during import
- [ ] Phase 2 Implementation Report committed to docs/reports/phase-2.md
- [ ] Import branch merged to main (or dedicated import tag created)
- [ ] Rollback: the Phase 1 backup can restore the full Base44 source if this phase is reverted

---

### Phase 3 — Inventory & Gap Analysis

**Goal**: Compare the imported code against all Source of Truth documents, identify gaps, duplications, and issues, and produce a complete implementation report before any refactoring begins.

**Steps**:

1. **Map imported modules against documented architecture**
   - For each surface in the [Verification Checklist](#verification-checklist), confirm the relevant code is present in the import.
   - Record any surface that is missing, partially present, or appears duplicated.

2. **Identify missing modules**
   - Cross-reference the imported code against the following required platform surfaces and capabilities:
     - Authentication (all methods: email, phone, passkeys, biometrics, MFA, recovery codes)
     - RBAC enforcement (all five role types)
     - Member Portal (accounts, cards, investments, credit, documents, statements, notifications, verification, support)
     - Operations Center (member review, verification review, transaction review, case management, support, AI assistant)
     - VANTORIS iCommand (governance, platform configuration, security policy, AI governance, compliance, reporting)
     - AI Command Center (full-screen workspace, draggable launcher, permission-aware, context-aware, action catalog, guided workflows, universal availability)
     - Member Advisor (AI assistant, live chat, WhatsApp Business, voice, video, tickets, help center, guides — all aggregated)
     - Verification Center (all states: Unverified, IdentitySubmitted, UnderReview, Verified, Failed; all types: identity, address, email, phone, income, business, trusted device)
     - Universal Chat (all message types: text, camera, photos, videos, documents, voice notes, location, contacts, replies, reactions, read receipts, typing indicators, search, pinning, AI summaries)
     - Cards (issuance, activation, controls, limits, freeze/unfreeze)
     - Payments (ACH, domestic wire, international wire, Zelle, bill pay, RTP)
     - Investments (portfolio management, orders, positions)
     - Credit (credit products and account management)
     - Notifications (event-driven multi-channel alerts)
     - Reports (scheduled, on-demand, BI-level)
     - Double-entry ledger (immutable, append-only)
     - Audit logging (immutable, with correlation/trace IDs, before/after state)
     - Trusted devices (max 2, device approval flow)

3. **Identify duplicated functionality**
   - Flag any surface, endpoint, or component that appears to be implemented in multiple locations.
   - All chat surfaces must share a single architecture (docs/REPOSITORY_STANDARDS.md — Universal Chat).
   - Member Advisor is the single support platform; no duplicate support UIs or independent chat endpoints should exist.
   - Shared UI components must live in libs/design-system; no per-app forks without a documented exception.

4. **Classify features** (see [Feature Parity Classification](#feature-parity-classification))

5. **Produce Phase 3 Implementation Report**

**Phase 3 Completion Criteria**:
- [ ] Every documented platform surface mapped to imported code (or marked missing)
- [ ] All duplications documented
- [ ] All features classified as Working / Needs Refactoring / Missing / Deprecated
- [ ] Phase 3 Implementation Report committed to docs/reports/phase-3.md
- [ ] No code has been modified during this phase
- [ ] Rollback: no code changes to roll back

---

### Phase 4 — Incremental Refactoring

**Goal**: Gradually improve the imported code to match the documented architecture without changing intended behavior.

**Ground rules for Phase 4**:
- Refactor only after Phase 2 build is green and Phase 3 report is complete.
- Every refactor must be delivered in a small, focused PR with Evidence (see CODING_STANDARDS.md — Reporting & Evidence).
- Every refactor PR must include a behavior-preserving test suite (unit + integration + contract tests).
- If a refactor changes an API contract, follow the two-release migration plan (docs/API_ARCHITECTURE.md): deprecate → warn → remove.
- Do not replace entire services wholesale. Break large refactors into small, verifiable steps.
- Architecture-level changes require a design PR and sign-off from platform owners.

**Refactoring sequence** (recommended order — adjust based on Phase 3 findings):

**4.1 — Folder and workspace alignment**
- Move imported files to their canonical paths per the mapping table in Phase 2.
- Add or update package.json, tsconfig.json, and README.md for each workspace.
- Add workspace entries to pnpm-workspace.yaml.
- Add shared config packages (libs/configs/eslint, libs/configs/prettier, libs/configs/tsconfig).
- Target: every workspace builds independently and can be tested in isolation.

**4.2 — TypeScript and linting alignment**
- Enable TypeScript strict mode (tsconfig: "strict": true) per workspace.
- Apply ESLint and Prettier configs from libs/configs.
- Resolve type errors and remove `any` usages with documented justification for exceptions.
- Enable husky lint-staged hooks.
- Target: `pnpm lint` and `pnpm typecheck` pass across all workspaces.

**4.3 — Authentication and session alignment**
- Confirm all authentication methods are wired: email, phone, username, passkeys (WebAuthn), biometrics, MFA, recovery codes.
- Confirm account creation flows: personal, joint, business (onboarding unchanged; returning users go directly to sign-in).
- Confirm member profile model includes: Legal First Name, Legal Middle Name, Legal Last Name, Preferred Name.
- Confirm display logic uses Preferred Name → Legal First Name → Legal First + Last; never email usernames.
- Confirm session inactivity timeout is 5–10 minutes.
- Confirm trusted device model enforces maximum of two active devices; adding a third requires removing one.
- Confirm high-risk actions require fresh authentication.
- Target: Authentication test suite passes including negative tests and session timeout tests.

**4.4 — RBAC and permission alignment**
- Confirm all five role types are implemented: Public Visitor, Member (personal/joint/business), Operations, Support & Member Services, VANTORIS iCommand.
- Confirm members can only access their own data (accounts, cards, investments, credit, documents, statements, notifications, verification, support conversations).
- Confirm members never see other member records, internal notes, internal cases, internal chats, audit logs, operations data, or platform configuration.
- Confirm Operations cannot change platform configuration, view hidden authorities, or access executive governance.
- Confirm iCommand actions are fully audited.
- Confirm AI assistants inherit the signed-in user's permissions and never surface information outside the user's scope.
- Confirm features are hidden (not merely disabled) for unauthorized roles.
- Confirm no hidden authority levels or internal permission codes are ever exposed in any UI.
- Move permission descriptors to libs/ai/permissions/*.yaml (machine-readable, used by both UI and backend).
- Target: RBAC negative and positive test suites pass.

**4.5 — Design system and UI alignment**
- Move all shared UI components to libs/design-system.
- Remove per-app forks of shared components (or document and approve exceptions).
- Confirm design tokens (colors, spacing, typography) are centralized; no hardcoded values.
- Apply WCAG 2.1 AA accessibility baseline across all public-facing interfaces and operations/admin surfaces.
- Confirm personalization display utilities are in libs/models/profile.ts and use the correct display priority.
- Target: Design system components are reusable across apps; visual regression tests pass.

**4.6 — AI Command Center alignment**
- Confirm ACC is a dedicated full-screen route (not a popup) in every workspace (member, operations, iCommand).
- Confirm draggable enterprise AI launcher exists; last position persisted per user; keyboard-accessible.
- Move AI modules to libs/ai/ (ui, services, workflows, permissions, prompts, actions, memory, integrations).
- Move prompt templates to libs/ai/prompts (no hardcoded prompts in UI components).
- Move workflow definitions to libs/ai/workflows (YAML/JSON, declarative, versioned).
- Move permission descriptors to libs/ai/permissions (machine-readable, used by UI and backend).
- Confirm AI actions are gated by permission descriptors; only authorized actions are displayed to the current user.
- Confirm context-awareness: ACC receives context from the current screen (route, selected record, filters).
- Confirm AI Action Center has a clickable action catalog with deep links (canonical format documented in docs/api/deeplinks.yaml).
- Confirm guided workflows are defined declaratively and tested as first-class artifacts.
- Target: ACC smoke tests pass in staging for all workspaces; permission-aware behavior verified with negative tests.

**4.7 — Universal Chat alignment**
- Confirm all chat surfaces share one architecture, one message schema (libs/messages), and one design system.
- Confirm all message types are supported: text, camera, photos, videos, documents (PDF, DOCX, XLSX), voice notes, location, contacts, replies, reactions, read receipts, typing indicators, search, pinning, AI summaries.
- Confirm message schema and OpenAPI contract are committed to docs/api/chat.yaml.
- Confirm media uploads use signed URLs; backend validates file type and size.
- Confirm PII-containing documents are redacted per retention rules.
- Target: Chat contract tests pass; all message type tests pass in CI.

**4.8 — Verification Center alignment**
- Confirm Verification Center is the single verification surface; no KYC placeholder pages remain.
- Confirm all verification states are implemented as explicit enums: Unverified, IdentitySubmitted, UnderReview, Verified, Failed.
- Confirm all verification types are supported: identity, address, email, phone, income, business, trusted device.
- Confirm UI surfaces the exact state and next steps; no "Coming Soon" placeholders for verification-critical features.
- KYC must not appear in the More menu; no duplicate verification pages.
- Target: Verification states transition correctly; E2E tests cover all states.

**4.9 — API contract alignment**
- Create or update OpenAPI contract files in docs/api/ for all required APIs (see docs/API_ARCHITECTURE.md — Banking APIs).
- Confirm all APIs follow contract-first design, path-based versioning (/v1/), and the standard error envelope.
- Confirm idempotency keys are implemented for all write operations.
- Confirm audit events are emitted for all sensitive endpoints.
- Add or update consumer-driven contract tests in tests/contract/.
- Target: OpenAPI validation (spectral) passes; contract tests pass in CI.

**4.10 — Database and data alignment**
- Confirm all domain schemas exist as documented in DATABASE_ARCHITECTURE.md.
- Confirm all node-pg-migrate migration scripts are committed and run in CI against ephemeral DBs.
- Confirm double-entry ledger is immutable (append-only; no updates or deletes to ledger_entries).
- Confirm audit_events table is immutable and append-only.
- Confirm trusted_devices table enforces maximum of two active devices per member.
- Confirm member_profile includes first_name, last_name, preferred_name fields.
- Confirm PANs are never stored in plaintext; tokenization is used.
- Confirm encrypted-at-rest policies are applied for sensitive fields.
- Target: All migration scripts run without error; data integrity tests pass.

**4.11 — CI/CD and evidence alignment**
- Enable and configure all CI pipeline stages (see CI_CD.md): lint, typecheck, unit tests, integration tests, contract tests, SAST (CodeQL), secret scanning, SBOM, evidence checklist validation.
- Confirm workspace-scoped CI runs only for changed workspaces.
- Confirm promotion gating: staging must pass smoke tests before production promotion.
- Add AI-specific verifications: ACC route loads (200), permission-aware behavior (negative tests), deep-links resolve, media uploads accepted, unified chat smoke tests, Member Advisor aggregation test.
- Target: Full CI pipeline passes on main; all feature flags have Evidence artifacts.

**Phase 4 Completion Criteria**:
- [ ] All workspaces build and all tests pass in CI
- [ ] TypeScript strict mode enabled across all workspaces
- [ ] Authentication and session rules verified
- [ ] RBAC verified with negative and positive tests for all five roles
- [ ] Design system is unified; no per-app forks without documented exceptions
- [ ] AI Command Center is a full-screen workspace in all required surfaces
- [ ] Universal chat schema and all message types verified
- [ ] Verification Center is the single verification surface with all states implemented
- [ ] All API contracts committed to docs/api/
- [ ] Database schemas and migrations complete and tested
- [ ] CI pipeline fully enabled with evidence enforcement
- [ ] Phase 4 Implementation Report committed to docs/reports/phase-4.md
- [ ] Rollback: every refactor PR is independently revertible

---

### Phase 5 — Testing & Production Readiness

**Goal**: Achieve full test coverage, staging verification, and production readiness.

**Steps**:

1. **Unit and integration testing**
   - Achieve 80%+ coverage (statements/branches/functions/lines) per workspace.
   - Integration tests for all services interacting with DB, Kafka, and object storage (using Testcontainers or equivalent ephemeral containers).
   - Negative tests for all RBAC rules (unauthorized users cannot access privileged resources or actions).
   - Contract tests for all public APIs (consumer-driven, Pact or equivalent), committed to tests/contract/.

2. **End-to-end testing**
   - E2E test (Playwright) for every user-facing flow: onboarding, sign-in, MFA, trusted device management, account management, transfers, card management, investments, credit, verification, chat, notifications, reports.
   - E2E tests for Operations Center flows: member review, verification review, transaction review, case management.
   - E2E tests for AI Command Center: workspace loading, action catalog, guided workflow execution, permission-aware display.
   - E2E tests for Member Advisor: channel aggregation, ticket creation, escalation.

3. **Performance verification**
   - API response time P99 < 200ms for member-facing operations.
   - Dashboard load < 2s for operations interfaces.
   - Database query P99 < 100ms.
   - Cache hit rate > 95% for frequently accessed data.

4. **Accessibility verification**
   - WCAG 2.1 AA compliance audit for all public-facing surfaces and operations/admin surfaces.
   - All interactive components keyboard-accessible with correct ARIA roles.
   - Color contrast ratios verified.
   - Screen reader tested.

5. **Security verification**
   - Penetration test or security review of authentication flows, RBAC enforcement, and API endpoints.
   - Confirm no sensitive data is committed (secret scanning clean).
   - Confirm PAN tokenization and field-level encryption are working.
   - Confirm audit logs are immutable and include required fields (correlation_id, trace_id, actor_id, device_id, session_id, IP, before/after state).
   - Confirm trusted device model enforces maximum of two active devices.
   - Confirm session inactivity timeout is working (5–10 minutes).
   - Confirm step-up authentication is triggered for high-risk actions.
   - Confirm AI actions are gated by permission descriptors; no information surfaced outside user's scope.

6. **Compliance verification**
   - PCI DSS requirements for card data confirmed (tokenization, no plaintext PAN in DB or logs).
   - AML/KYC requirements met (Verification Center, transaction monitoring).
   - GDPR/CCPA data privacy requirements met (PII minimization, retention, redaction).
   - SOC 2 controls documented and evidence produced.
   - Audit logs retained per compliance policy.

7. **Staging smoke test and production readiness review**
   - Run full post-deploy smoke test suite against staging.
   - Confirm all Evidence artifacts are linked in release notes.
   - Classify every feature in the release as: Verified, Created but not integrated, or Not implemented.
   - Conduct production readiness review (PRR) with platform owners.

8. **Production deployment**
   - Deploy via blue/green or canary strategy (canary: 5% → 25% → 100% with monitoring windows).
   - Database migrations run using backward-compatible, two-phase migration strategy.
   - Automated rollback triggers on SLO violations.
   - Post-deploy: run synthetic monitoring checks, integration tests, and business-level smoke tests.

**Phase 5 Completion Criteria**:
- [ ] 80%+ test coverage achieved for all workspaces
- [ ] All E2E flows verified in staging
- [ ] Performance targets met
- [ ] WCAG 2.1 AA compliance verified
- [ ] Security review complete; no critical or high vulnerabilities
- [ ] Compliance requirements confirmed
- [ ] Staging smoke tests pass
- [ ] All features classified in release notes
- [ ] Production deployment successful with canary rollout
- [ ] Post-deploy smoke tests pass
- [ ] Phase 5 Implementation Report committed to docs/reports/phase-5.md

---

## Verification Checklist

Every surface and module listed below must be individually verified at the end of each applicable phase. Verification means the feature is running in a live environment with Evidence.

| Surface / Module | Phase 3 (Identified) | Phase 4 (Refactored) | Phase 5 (Verified) |
|---|---|---|---|
| Authentication — Email | | | |
| Authentication — Phone Number | | | |
| Authentication — Username | | | |
| Authentication — Passkeys (WebAuthn) | | | |
| Authentication — Biometrics | | | |
| Authentication — MFA | | | |
| Authentication — Recovery Codes | | | |
| Session Management (inactivity timeout) | | | |
| Trusted Devices (max 2, approval flow) | | | |
| RBAC — Public Visitor | | | |
| RBAC — Member (Personal, Joint, Business) | | | |
| RBAC — Operations | | | |
| RBAC — Support & Member Services | | | |
| RBAC — VANTORIS iCommand | | | |
| Member Portal — Accounts | | | |
| Member Portal — Cards | | | |
| Member Portal — Payments (ACH, Wire, Zelle) | | | |
| Member Portal — Investments | | | |
| Member Portal — Credit | | | |
| Member Portal — Documents | | | |
| Member Portal — Statements | | | |
| Member Portal — Notifications | | | |
| Member Portal — Verification | | | |
| Member Portal — Support | | | |
| Operations Center — Member Review | | | |
| Operations Center — Verification Review | | | |
| Operations Center — Transaction Review | | | |
| Operations Center — Case Management | | | |
| Operations Center — AI Operations Assistant | | | |
| VANTORIS iCommand — Governance | | | |
| VANTORIS iCommand — Platform Configuration | | | |
| VANTORIS iCommand — Security Policy | | | |
| VANTORIS iCommand — AI Governance | | | |
| VANTORIS iCommand — Compliance Oversight | | | |
| VANTORIS iCommand — Reporting | | | |
| AI Command Center — Full-Screen Workspace | | | |
| AI Command Center — Draggable Launcher | | | |
| AI Command Center — Permission-Aware Actions | | | |
| AI Command Center — Context Awareness | | | |
| AI Command Center — Action Catalog & Deep Links | | | |
| AI Command Center — Guided Workflows | | | |
| AI Command Center — Universal Availability | | | |
| Member Advisor — AI Assistant | | | |
| Member Advisor — Live Chat | | | |
| Member Advisor — WhatsApp Business | | | |
| Member Advisor — Voice Support | | | |
| Member Advisor — Video Support | | | |
| Member Advisor — Tickets | | | |
| Member Advisor — Help Center | | | |
| Member Advisor — Guides | | | |
| Verification Center — All States | | | |
| Verification Center — All Types | | | |
| Universal Chat — All Message Types | | | |
| Universal Chat — Media Handling | | | |
| Universal Chat — Search | | | |
| Universal Chat — AI Summaries | | | |
| Cards — Issuance & Activation | | | |
| Cards — Controls & Limits | | | |
| Payments — ACH | | | |
| Payments — Domestic Wire | | | |
| Payments — International Wire | | | |
| Payments — Zelle | | | |
| Payments — Bill Pay | | | |
| Payments — RTP | | | |
| Investments — Portfolio Management | | | |
| Investments — Orders & Positions | | | |
| Credit | | | |
| Notifications | | | |
| Reports | | | |
| Double-Entry Ledger | | | |
| Audit Logging — Immutable Events | | | |

---

## Data Migration

### Entities to Preserve

The following data entities must be preserved through the migration with full referential integrity. No data may be lost or restructured in a breaking way without a documented, reversible migration plan.

| Entity | Schema | Preservation Rule |
|---|---|---|
| Members | members.member_profile | Preserve member_id (UUID); preserve name fields; never derive display name from email |
| Organizations | organizations.organization | Preserve org_id; preserve org membership relationships |
| Accounts | accounts.account | Preserve account IDs and account numbers where regulatory references exist |
| Transactions | transactions.transaction | Preserve transaction IDs and external IDs; never modify posted transactions |
| Double-Entry Ledger | ledger.ledger_entries | Append-only; never update or delete; corrections via compensating entries only |
| ACH / Wire / Zelle | payments.* | Preserve external reference IDs and settlement records |
| Verification | verification.verification_requests | Preserve verification history; never lose identity submission records |
| Trusted Devices | devices.trusted_devices | Preserve device history; soft-delete only; never hard-delete |
| Audit Logs | audit.audit_events | Immutable; append-only; never modify or delete; replicate to WORM or secure storage |
| AI Conversations | ai.ai_conversations, ai.ai_messages | Preserve per-member conversation history and memory |
| Chat | chat.conversations, chat.messages | Preserve all message history; media references must remain valid after storage migration |
| Documents | documents.documents | Preserve document metadata and storage references; apply retention rules without data loss |

### Rules

- **Never lose audit history.** Audit logs are the permanent record of all system activity. Even during schema migrations, audit records must be migrated first and verified before any other data migration proceeds.
- **Preserve IDs wherever possible.** If an ID scheme must change, produce a mapping table that remains accessible for at least 2 years.
- **Test restores before proceeding.** For every data migration step, verify that a point-in-time restore can recover data to any point before the migration.
- **Two-phase schema changes.** For non-backward-compatible schema changes, deploy code that tolerates both the old and new schema, run the migration, then remove the compatibility shim in a follow-up deployment.
- **Migrate audit logs first.** Before migrating any domain data, migrate and verify audit logs. Data migration without audit history context is not acceptable.

### Backup Schedule During Migration

- Full database backup before Phase 1 export
- Full database backup before Phase 2 import merge
- Full database backup before each Phase 4 refactoring sprint
- Full database backup before Phase 5 production deployment
- Retain all migration-period backups for 90 days after production deployment is verified

---

## Feature Parity Classification

Every imported feature must be classified at the end of Phase 3 and updated at the end of each subsequent phase. Use the following taxonomy:

| Classification | Definition |
|---|---|
| **Working** | Feature is present in the imported code, tests pass, and staging verification evidence exists |
| **Needs Refactoring** | Feature is present and working but does not conform to documented architecture; refactoring is planned in Phase 4 |
| **Missing** | Feature is documented but not present in the imported code; must be implemented or escalated |
| **Deprecated** | Feature is present in Base44 but is no longer needed or has been superseded; must not be removed until a replacement is Verified |

Rules:
- Do not remove any feature classified as Deprecated until its replacement is classified as Working.
- Features classified as Missing must be tracked in the Phase 3 Implementation Report with a remediation plan.
- Features classified as Needs Refactoring must be addressed before Phase 5 can begin.
- The Classification Table must be committed as part of each Phase Implementation Report (see docs/reports/).

---

## Implementation Report Template

Every migration phase must produce an Implementation Report committed to docs/reports/phase-N.md. The report must include all of the following sections.

```markdown
# Phase N Implementation Report

## Date
[Date of completion]

## Responsible Party
[Name or team]

## Files Imported / Modified
[List of files created, imported, or modified in this phase]

## Modules Verified
[List of platform surfaces and modules verified in this phase, with Evidence]

## Evidence
- Files modified: [list]
- Components modified: [list]
- Routes modified: [list]
- APIs affected: [list]
- Database changes: [migration names and schema diffs]
- Build status: [CI job link]
- Runtime verification: [staging URL or healthcheck ID]
- Integration verification: [E2E run ID, trace, or screencast]

## Feature Classification (Phase 3 and later)
[Classification table for all features: Working / Needs Refactoring / Missing / Deprecated]

## Problems Found
[List of issues discovered during this phase, with severity and owner]

## Refactors Completed (Phase 4 and later)
[List of refactors completed with PR links]

## Remaining Work
[List of outstanding tasks for subsequent phases]

## Risks
[Identified risks and mitigations]

## Recommendations
[Recommendations before proceeding to the next phase]
```

---

## Rollback Procedures

Every migration phase must support rollback. The following conditions require an immediate stop and rollback.

### Rollback Triggers

- **Build fails**: The import or any refactoring causes a build failure that cannot be resolved within the current PR scope. Revert the PR and investigate before re-attempting.
- **Authentication breaks**: Any change to authentication flows that causes login failures, session issues, or MFA failures. Roll back immediately; do not proceed.
- **Permissions change unexpectedly**: Any RBAC test failure indicating that a role can access resources it should not, or cannot access resources it should. Roll back and investigate.
- **Data integrity is lost**: Any migration that causes referential integrity violations, lost records, or corrupted ledger entries. Restore from the most recent verified backup.
- **Audit logs are lost or corrupted**: Any migration that affects the audit log table in a destructive way. This is a critical incident; do not proceed.
- **CI fails with no clear path to resolution**: If the CI pipeline fails and the issue cannot be resolved within a reasonable timeframe, revert the offending commit and create a tracking issue.

### Rollback by Phase

| Phase | Rollback Approach |
|---|---|
| Phase 1 | No code changes; no rollback needed |
| Phase 2 | Revert the import branch merge; restore working directory from Phase 1 backup archive |
| Phase 3 | No code changes; update the Implementation Report to reflect the correct state |
| Phase 4 | Every refactor PR is independently revertible via `git revert`; for DB changes, run the down migration |
| Phase 5 | Canary rollback via automated deployment system; database restores from PITR |

### Rollback Verification

After any rollback, the following must be re-verified before resuming:
- [ ] Build passes
- [ ] Authentication works (sign-in, MFA, session)
- [ ] RBAC tests pass (negative and positive)
- [ ] Audit logs are intact and append-only
- [ ] Data integrity checks pass (no missing foreign keys, no orphaned records)

---

## Base44 Preservation Requirements

The following aspects of Base44 must be preserved through the entire migration. No phase may degrade these without explicit, documented, and approved justification.

| Requirement | Rule |
|---|---|
| Business logic | All business rules, calculations, validations, and workflows must be preserved. Refactoring must not change outcomes. |
| Member experience | Member-facing flows (onboarding, sign-in, account management, payments, investments, support) must remain intact. Improvements are allowed; regressions are not. |
| Operations workflows | Operations Center workflows (member review, case management, transaction review) must be preserved. |
| AI workflows | AI conversation history, memory, guided workflows, and action catalog must be preserved. |
| Rules Engine | Any rules engine logic in Base44 must be preserved and integrated with the RBAC model. Rules must continue to drive automatic task assignment and workflow routing. |
| Existing functionality | No working feature may be removed unless classified as Deprecated and its replacement is classified as Working. |
| Intended behavior | Architecture may be improved, but intended behavior must not change unless explicitly reviewed and approved by platform owners. |

---

## Cross-References

| Document | Relevance to Migration |
|---|---|
| docs/ARCHITECTURE.md | System-level architecture that imported code must ultimately conform to |
| docs/COMPONENT_ARCHITECTURE.md | UI component hierarchy and design system requirements |
| docs/REPOSITORY_STRUCTURE.md | Canonical folder layout for Phase 2 import mapping |
| docs/REPOSITORY_STANDARDS.md | Engineering rules, pre-import checklist, Implementation-First and Verification-First policies |
| docs/CODING_STANDARDS.md | TypeScript, linting, testing, design system, AI, chat, and reporting requirements |
| docs/CI_CD.md | CI pipeline design, evidence requirements, AI-specific verifications |
| docs/API_ARCHITECTURE.md | Contract-first API design, OpenAPI contract locations, banking API list |
| docs/DATABASE_ARCHITECTURE.md | Domain models, data ownership, lifecycle rules, migration tooling |
| docs/SECURITY_STANDARDS.md | Encryption, audit, session, payment security, compliance requirements |
| docs/AUTHENTICATION.md | Authentication methods, session management, trusted devices, profile model |
| docs/RBAC.md | Authorization model, role definitions, permission rules, AI permission inheritance |
| docs/reports/ | Phase Implementation Reports (to be created as migration proceeds) |
