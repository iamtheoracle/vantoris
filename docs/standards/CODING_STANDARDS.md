# Coding Standards — VANTORIS

Status: normative. This document is the mandatory engineering standard for every contributor and for every AI agent working on VANTORIS. It is documentation-only until the Base44 export is imported. After the import, these rules become the enforced project standard and must be followed for all production code changes.

Purpose
- Provide unambiguous, enforceable coding rules that protect correctness, security, accessibility, and maintainability.
- Ensure the design system, AI Command Center, Member Advisor, Verification Center, Trusted Devices, and unified chat requirements are implemented consistently and tested.
- Prepare the codebase for the Base44 migration and guarantee refactors preserve business logic.

Table of contents
- General Engineering
- TypeScript & Tooling
- Linting & Formatting
- Testing Requirements
- Design System
- AI Command Center (modularity rules)
- Permission Gating
- Personalization
- Chat
- Verification Center
- Trusted Devices
- Reporting & Evidence
- Base44 Migration Compatibility
- Enforcement and CI Integration

General Engineering
- TypeScript Strict Mode required for every package and workspace (tsconfig.json: "strict": true).
- No use of `any` except with a documented justification in the PR body and a TODO referencing a tracking issue for removal.
- No duplicated business logic: shared logic must live in libs/ (e.g., libs/utils, libs/domain). If duplication is identified, create a refactor task to centralize it.
- Shared components in libs/design-system must be reused — do not create local forks of shared UI components inside apps without a documented and approved exception.
- Every component, module, and service must include a short README.md documenting its purpose, public surface (functions/APIs/props), and expected usage.
- Every feature must include unit, integration, and E2E tests (see Testing Requirements below).
- Accessibility baseline: WCAG 2.2 AA for all public-facing UI; operations/admin surfaces must meet the same baseline.

TypeScript & Tooling
- Node.js LTS runtime; compile targets will be set per-package to the least common denominator that supports deployed Node version.
- tsconfig.json requirements for each package:
  - "strict": true
  - "noImplicitAny": true
  - "strictNullChecks": true
  - "noImplicitReturns": true
  - "noFallthroughCasesInSwitch": true
  - declaration: true for libs
- Do not disable type checks with // @ts-ignore except in rare cases; each use must be justified in the PR.
- Use typed interfaces for API requests/responses and domain models. Avoid inline types in many places; prefer exported types to make future migrations easier.

Linting & Formatting
- ESLint (recommended): extend from a shared config stored at libs/configs/eslint (created during import). Required rules:
  - TypeScript rules enforcing no `any` and strict null checks
  - No-console rules for production code (allow console.debug under a feature flag)
  - Accessibility plugin (jsx-a11y) rules for frontend packages
- Prettier for formatting; use a shared config at libs/configs/prettier.
- Commit hooks (husky) should run lint-staged to format and lint changed files before commit. These hooks are enabled after Base44 import and enforced by CI when applicable.

Testing Requirements
- Every package must include unit tests with coverage thresholds set by the package owner (default 80% statements/branches/functions/lines).
- Integration tests: services interacting with external systems (DB, message bus, object storage) must include integration tests that run against test doubles or ephemeral containers (Testcontainers) in CI.
- E2E tests: user-flows for every user-facing feature must have at least one Playwright (or equivalent) E2E test that runs in CI against a staging environment.
- Contract tests: public APIs must have consumer-driven contract tests (Pact or equivalent) stored alongside the consumer tests and verified in CI.
- Flaky tests must be tracked and quarantined (tagged flaky) and a ticket created to stabilize them within 2 weeks.

Design System
- All UI must use the shared design system at libs/design-system. No custom tokens (colors, spacing, typography, shadows, icons) may be introduced outside the design-system token set.
- Any design-system change (new token, new component) requires a Design PR that includes: visual spec, accessibility impact assessment, tokens file, and migration plan for existing uses.
- Maintain consistent spacing, premium layouts, whitespace, and hierarchy. Use the design-system layout primitives (Grid, Stack, Box) rather than ad-hoc CSS.
- Components must expose typed props and documentation (prop tables) and include Storybook stories (if Storybook is used) or component catalog entries in docs/

AI COMMAND CENTER (Modularity & Rules)
- The AI Command Center (ACC) is modular. Separate concerns into distinct modules in libs/ai/:
  - ui/ (ACC UI components)
  - services/ (AI request orchestration, rate-limiting, retries)
  - workflows/ (YAML/JSON workflow definitions)
  - permissions/ (action permission descriptors)
  - prompts/ (prompt templates, with versioning)
  - actions/ (action definitions and mappings to back-end operations)
  - memory/ (short-term & long-term memory handling and schemas)
  - integrations/ (connectors for OpenAI/Anthropic/vector DBs)
- Never hardcode prompts or permissions in UI components. UI components may import prompt keys or permission keys but the content and checks must live in libs/ai/prompt-templates and libs/ai/permissions respectively.
- Workflows are data-driven: multi-step guided workflows must be defined declaratively in libs/ai/workflows and executed by a workflow engine in libs/ai/services.
- Permission descriptors should be machine-readable (YAML/JSON), include required roles/scopes, and be used by both UI for visibility and backend for enforcement.

Permission Gating
- Every action (UI button, route, API call) must have a permission check instance:
  - Frontend: visibility/hide of actions must be driven by permission descriptors but must not be the only enforcement.
  - Backend: every privileged endpoint must validate permissions and return 403 when unauthorized.
- Permission checks are implemented using a shared authorization library (libs/authz) that loads permission descriptors from libs/ai/permissions and an RBAC engine (see docs/RBAC.md).
- Tests must include negative tests (user cannot perform privileged action) and positive tests (authorized user can).

Personalization
- Profile model must include FirstName, LastName, PreferredName and be strongly typed (exported types in libs/models/profile.ts).
- Greeting utilities must prefer PreferredName then FirstName; they must never default to email username.
- Localization & i18n: string templates must use name placeholders and support right-to-left languages. Placeholders should be typed and validated at build time where possible.

Chat (Unified Messaging Architecture)
- All chat implementations use a single message schema and APIs under docs/api/chat.yaml and runtime contracts in libs/messages.
- Supported message types:
  - Camera
  - Photos
  - Videos
  - Voice Notes
  - Documents: PDF, DOCX, XLSX
  - Contacts
  - Location
  - Replies (threads)
  - Reactions
  - Search (server-side indexed)
  - Read receipts
  - Typing indicators
  - Pinning
  - AI Summaries
- Storage & handling:
  - Media uploads must use signed URLs for direct-to-object-store uploads (e.g., S3 presigned PUT). Backend validates file type and size and stores metadata in DB.
  - PII-containing documents must be redacted per docs/SECURITY_STANDARDS.md retention rules.
- UI components must use libs/design-system chat primitives and not implement bespoke chat widgets per app.
- Message schema evolutions must be backward compatible. Use additive schema changes; deprecations require a two-release migration plan.

Verification Center
- Verification Center is the single verification surface. No new KYC pages anywhere else.
- Verification states must be explicit enums: Unverified, IdentitySubmitted, UnderReview, Verified, Failed.
- UI must surface the exact state and next steps for the user. No "Coming Soon" placeholders for verification-critical features.
- Verification workflows and integrations with third-party KYC providers must be documented under docs/VERIFICATION_CENTER.md and include test doubles for CI.

Trusted Devices
- Platform enforces single trusted active device by default.
- Device trust changes must require explicit approval: either replace the current trusted device or follow an explicit approval flow (email/MFA confirmation).
- Device model must record device id, device type, last seen, trusted flag, and user action history. API must provide audit logs for trust changes.

Reporting & Evidence
- Developers and AI agents must not declare implementation success without the Evidence fields in the PR and release notes. Evidence must include:
  - Files changed
  - Components changed
  - Routes changed
  - APIs changed
  - Database changes (migrations, diffs)
  - Build status (CI link)
  - Runtime verification (staging URL, healthcheck)
  - Integration verification (e2e trace id or screencast)
- If code exists but is unused or not integrated, author must mark the change as: "Created but not integrated." This must appear in both PR description and release notes.

Base44 Migration Compatibility
- Coding standards must remain compatible with Base44 code during import and refactor phases.
- After import, refactoring must preserve business logic. Accompany refactor PRs with:
  - Behavior-preserving test suite (unit + integration + contract tests)
  - A migration plan for any API/schema changes
  - Evidence artifacts proving parity (smoke tests, sample runs)
- Do not replace entire services wholesale. Break large refactors into small, verifiable steps that preserve production behavior.

Enforcement and CI Integration
- CI will enforce many of these rules (see docs/CI_CD.md):
  - TypeScript strictness and type checks
  - ESLint and Prettier
  - Unit and integration tests
  - Contract tests and e2e smoke tests for user-facing changes
  - Evidence metadata presence for user-facing PRs
- Lint and format checks run on PRs; failing checks block merges to main.
- Security and SCA scans run on PRs and main. Critical vulnerabilities block merges.

Examples and recommended configs (document-only pointers)
- tsconfig.json snippet (per-package):
  {
    "compilerOptions": {
      "target": "ES2022",
      "module": "commonjs",
      "strict": true,
      "noImplicitAny": true,
      "strictNullChecks": true,
      "noImplicitReturns": true,
      "noFallthroughCasesInSwitch": true
    }
  }

- ESLint: extend from a shared config (libs/configs/eslint) with plugin:@typescript-eslint/recommended and plugin:jsx-a11y/recommended.
- Prettier: single shared config at libs/configs/prettier.

Next steps
- Commit this file to docs/CODING_STANDARDS.md (done as the only change in this step).
- After you review, I will proceed to docs/API_ARCHITECTURE.md.

Cross-references
- docs/REPOSITORY_STANDARDS.md
- docs/REPOSITORY_STRUCTURE.md
- docs/CI_CD.md
- docs/ARCHITECTURE.md
- docs/COMPONENT_ARCHITECTURE.md
- docs/VERIFICATION_CENTER.md (to be created)
- docs/SECURITY_STANDARDS.md (to be created)

