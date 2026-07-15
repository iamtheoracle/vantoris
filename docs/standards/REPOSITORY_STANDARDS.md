# Repository Standards — VANTORIS

Status: documentation-only. This document codifies repository rules and engineering standards for VANTORIS and prepares the repository to receive the Base44 export. These rules are normative — they apply to every commit, PR, and document produced for the repository.

Purpose
- Provide unambiguous repository-level conventions so the Base44 export can be imported and production code can be matured safely.
- Enforce Implementation-First and Verification-First discipline: do not mark features as complete without live verification and evidence.
- Define AI, chat, personalization, verification, trusted device, and design principles as first-class platform requirements.

Platform Standards (normative)
- Package Manager: pnpm workspaces
- Runtime: Node.js LTS
- CI/CD: GitHub Actions
- Primary Branch: main
- Feature Branches: feature/*
- Fix Branches: fix/*
- Release Branches: release/*
- Hotfix Branches: hotfix/*

IMPLEMENTATION FIRST (normative)
- This repository will become the production source of truth after the Base44 export is imported.
- Do NOT generate replacement applications, demo apps, or placeholder banking code in this repo.
- After the Base44 code is imported, refactor the imported code rather than rebuilding it from scratch.
- All implementation work on production code must preserve the service identity and, where possible, Git history from the Base44 export.

VERIFICATION FIRST (normative)
- Never report a feature as complete unless it has been verified in a running environment (staging or production as appropriate).
- Every implementation report (PR and Release notes) must include the following evidence fields: 
  • Files modified
  • Components modified
  • Routes modified
  • APIs affected
  • Database changes (migrations, schema diffs)
  • Build status (CI job link)
  • Runtime verification (staging URL, healthcheck id)
  • Integration verification (e2e run id, trace, or screencast)
- If code exists but is not connected/integrated, the author must label the change in PR and release notes as: "Created but not integrated." This status must be explicit for every feature-level entry.
- CI will validate presence of Evidence metadata for user-facing changes (see docs/CI_CD.md).

AI COMMAND CENTER (platform requirement)
The AI Command Center (ACC) is a first-class product surface and must be treated as a core platform component.
Requirements:
- Full-screen AI workspace: ACC is a dedicated, full-screen route (not a small popup). Document the canonical route in the service's README and add a staging smoke test that visits the route and asserts a 200 response.
- Draggable enterprise AI launcher: the launcher is a small floating UI element that users can drag; its last position is persisted per-user and must be keyboard-accessible.
- Permission-aware AI: all AI actions must be gated by permission descriptors stored alongside action definitions (e.g., libs/ai/permissions/*.yaml). The UI must only display actions the current user is authorized to perform.
- Context-aware AI: ACC must receive and surface context from the current screen (route, selected record id, filters). Documentation must describe the context shape and available context variables.
- AI Action Center: clickable action catalog inside ACC with deep links into platform workflows. Deep-link format must be documented and contract-tested.
- Guided workflows: ACC must provide multi-step guided AI workflows; workflow definitions must be stored and tested as first-class artifacts (e.g., libs/ai/workflows/*.yaml).
- Universal availability: ACC must be reachable from Operations, Executive, Security, and Member Advisor workspaces. Each workspace must document the ACC entry point and required permissions.

MEMBER ADVISOR (single support platform)
- Member Advisor is the canonical support hub. No duplicate support UIs or independent chat endpoints should exist outside this scope.
- Support channels aggregated by Member Advisor include: AI Assistant, Live Chat, WhatsApp Business, Voice Support, Video Support, Tickets, Help Center, and Guides.
- Integration tests must assert that Member Advisor aggregates channel status and presence; mocks for external channels (WhatsApp Business, PSTN, video) must live under tests/mocks/.

UNIVERSAL CHAT (single architecture and design system)
- All chat surfaces in VANTORIS share one architecture, one message schema, and one design system (the design-system library under libs/design-system).
- Required message features (all message types must be supported by the common API and UI):
  • Camera
  • Photos
  • Videos
  • Documents (PDF, DOCX, XLSX)
  • Voice Notes
  • Location
  • Contacts
  • Replies (threading)
  • Reactions
  • Read receipts
  • Typing indicators
  • Search
  • Pinning
  • AI-generated summaries
- Message schema and OpenAPI contract(s) MUST be committed to docs/api/chat.yaml (or docs/api/*.yaml) before implementing chat endpoints. Contract tests must exist and run in CI.
- Media handling: storage, retention, and PII redaction policies must be documented in docs/SECURITY_STANDARDS.md and referenced in each chat service README.

PERSONALIZATION (profile model)
- Every member profile MUST include: FirstName, LastName, PreferredName.
- Display and greeting rules:
  • Use PreferredName when present.
  • If PreferredName is absent, fall back to FirstName.
  • Never derive a greeting from an email username.
- Update templates and UI components in libs/design-system to read and use the profile name fields by default.

VERIFICATION CENTER (KYC replacement)
- Verification Center replaces any generic "KYC" page or placeholder.
- KYC must NOT appear in the More menu. The More menu must not contain duplicates of features available elsewhere.
- Verification Center must surface real verification states (e.g., Unverified, IdentitySubmitted, UnderReview, Verified, Failed) — never show "Coming Soon" for verification-critical features.
- Routes and UI for verification must be documented in docs/VERIFICATION_CENTER.md and linked from the account/profile service README.

TRUSTED DEVICES
- The platform defaults to a single trusted active device per account.
- Adding a new trusted device requires explicit approval; the system must either replace the existing trusted device or require a second-factor confirmation.
- Trusted device model, API, and UI behavior must be documented and include tests that assert single-active-device behavior.

DESIGN PRINCIPLES (UX & UI)
- Interfaces must prioritize: whitespace, clear visual hierarchy, accessibility, premium banking aesthetics, progressive disclosure, minimal duplication, and consistent navigation.
- Accessibility: WCAG 2.1 AA as baseline. All interactive components must be keyboard-accessible and have ARIA roles where necessary.
- Screen layouts should reduce visual clutter and prioritize content density appropriate for the context (member vs operations).

BASE44 MIGRATION (procedural)
- Every document in this repo must help prepare for the Base44 migration.
- Pre-import checklist (must be completed before merging a Base44 import PR):
  1. Confirm legal/ownership/LICENSING for Base44 code is cleared.
  2. Decide whether to preserve commit history (git remote + fetch + merge) or import as a squashed commit.
  3. Map Base44 services/packages to /apps/ and /libs/ according to docs/REPOSITORY_STRUCTURE.md.
  4. Create OWNERS files for each imported service and infra component.
  5. Add workspace package.json entries if missing and ensure pnpm-workspace.yaml is present.
  6. Run workspace-focused CI jobs on the import branch and fix immediate build issues in staging.
  7. Provide Evidence artifacts for a post-import smoke run (staging URL, e2e traces).
- Post-import behavior: Immediately after import, stop creating new high-level documentation and transition to implementation mode: refactor and integrate the imported code rather than replacing it.

PR & Release requirements
- PR template must require: issue link, description, Evidence fields, list of Files/Components/Routes/APIs/DB changes, OWNERS approval, accessibility notes, and a testing plan.
- Release notes entries must annotate each user-facing feature as:
  • Verified — evidence exists and staging tests passed
  • Created but not integrated — code exists but lacks integration evidence
  • Not implemented — listed in docs but no code
- CI enforces the presence of Evidence for user-facing changes (see docs/CI_CD.md).

Repository layout and workspace rules (summary)
- Follow docs/REPOSITORY_STRUCTURE.md for where to place applications, libs, and infra.
- Each app/service must contain:
  • README.md with service purpose, entrypoint, ports, and canonical routes (including ACC route if applicable)
  • package.json and tsconfig.json
  • OWNERS file
  • docs/ subfolder for local docs (API, data model, runbook)
- Shared libraries (libs/) MUST contain: design-system, api-client, ai/workflows, ai/permissions, and utils.

Security & compliance notes
- Sensitive data and secrets must never be committed. Use SOPS/Age or Vault for secrets in infra/.
- All infra/ changes must include a deployment plan and a rollback plan in the PR description.
- Security-critical PRs require a security reviewer in OWNERS and a CodeQL scan in CI.

Enforcement & validation
- CI (docs/CI_CD.md) will run checks that validate Evidence metadata, presence of OWNERS, and workspace builds.
- Architecture-level changes must include a design PR and sign-off from platform owners.

Cross-references
- docs/REPOSITORY_STRUCTURE.md — canonical import mapping
- docs/CI_CD.md — CI/CD design and evidence requirements
- docs/ARCHITECTURE.md — system-level architecture
- docs/COMPONENT_ARCHITECTURE.md — UI component guidance and design system
- docs/MIGRATION_GUIDE.md — (to be created) detailed Base44 import steps
- docs/SECURITY_STANDARDS.md — (to be created) secrets, encryption, retention
- docs/API_ARCHITECTURE.md — (to be created) API patterns and OpenAPI contract locations

Next documents I will author (in order)
1. CODING_STANDARDS.md
2. API_ARCHITECTURE.md
3. DATABASE_ARCHITECTURE.md
4. AUTHENTICATION.md
5. RBAC.md
6. SECURITY_STANDARDS.md
7. MIGRATION_GUIDE.md
8. TESTING.md
9. DOCUMENTATION_STANDARDS.md
10. DESIGN_SYSTEM.md

Files created or updated by this commit
- Created: docs/REPOSITORY_STANDARDS.md
- Updated: docs/REPOSITORY_STRUCTURE.md (no changes to content in this commit) — referenced

Summary of changes
- Added a normative repository standards document that codifies Implementation-First and Verification-First policies, AI Command Center and Member Advisor as platform priorities, universal chat rules, personalization and verification standards, trusted-device rules, design principles, and a Base44 migration checklist.

Conflicts or dependencies discovered
- Docs reference many files that do not yet exist and will be created next (docs/MIGRATION_GUIDE.md, docs/SECURITY_STANDARDS.md, docs/API_ARCHITECTURE.md, etc.).
- The repository currently lacks package manager manifests (pnpm-workspace.yaml, package.json) and workspace code; these will be added only after Base44 import per the repository rules.
- CI assumptions (pnpm + GitHub Actions) were confirmed and are referenced in docs/CI_CD.md and this document.

Governance note
- Per repo rules: after the Base44 import, documentation will pivot to implementation mode and subsequent work will be primarily code refactoring and integration.

