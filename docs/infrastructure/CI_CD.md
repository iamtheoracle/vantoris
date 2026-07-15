# CI/CD & Deployment Specification for VANTORIS

Status: documentation-only. This file defines the CI/CD goals and an actionable pipeline design to use once the Base44 export is imported. It incorporates current product decisions (AI Command Center, unified chat, Member Advisor, Verification Center, trusted device model, etc.) and enforces evidence-based implementation reporting.

Purpose
- Provide a deterministic CI/CD pipeline that builds, tests, scans, and deploys workspace-scoped changes in a monorepo.
- Enforce security, quality, and compliance gates for every environment promotion.
- Provide verifiable, evidence-based checks that confirm features exist and are integrated before being marked "complete."

Environments
- development (dev) — feature branches deployed to ephemeral preview environments where practical
- staging — main branch deploys after PR merge and passes gating checks
- production — tagged releases; promoted from staging after validation

Secrets and required credentials (examples)
- CONTAINER_REGISTRY (read/write) — for image push
- KUBE_CONFIG_STAGING / KUBE_CONFIG_PROD — kubeconfig or deployment credentials
- TERRAFORM_BACKEND_CREDS — for state locking
- SOPS_AGE_KEY or VAULT_TOKEN — for secrets decryption during deployment
- SIGNING_KEY — for image/artifact signing
- MONITORING_API_KEYS (Datadog, Sentry)
- OIDC / SSO client secrets for automated smoke tests (test accounts)

Principles and policies
- Workspace-scoped CI: pipelines run only for changed workspaces (apps/libs/infra) to reduce noise and cost.
- Mandatory gates for merging to main: lint, typecheck, unit tests, security scans (SCA + SAST), contract tests for public APIs, and integration build.
- Promotion gating: staging must run smoke tests and UI contract checks (visual diff or API contract) before production promotion.
- Feature verification: every user-facing feature (per product checklist) must include an Evidence artifact linked in the PR (screenshot/gif, test run id, e2e trace, or deployment URL). The pipeline enforces presence of Evidence metadata in PR body for feature flags toggled on.

Pipeline stages (high-level)
1. PR validations (on pull_request)
   - Checkout and workspace detection
   - Lint (ESLint/Prettier), TypeScript typecheck
   - Dependency audit (Snyk/Dependabot or `npm audit`) and SCA
   - Unit tests (per workspace) — fail fast
   - Build (per workspace) — produce artifacts for integration tests
   - Contract tests (consumer-driven contracts) against mock providers
   - Security scans: SAST (CodeQL), secret scanning, SBOM generation
   - Evidence checklist validation: verify PR body contains Evidence entries for any changed product features (see Evidence section below)

2. Merge → main (on push to main)
   - Run full integration pipeline (all affected workspaces): build images, run integration tests (containerized), run database migrations in ephemeral staging DB, execute end-to-end smoke tests
   - Publish artifacts to artifact registry (images and tarballs) and sign artifacts
   - Deploy to staging (automatic), run acceptance & canary tests
   - Notify on failures via configured channels (Slack/Teams)

3. Promotion to production (manual promotion via GitHub Release or Merge to release branch)
   - Require approved release PR with release notes and Evidence links for each user-facing change
   - Deploy via blue/green or canary strategy with automated health checks and automatic rollback on specified SLO violations
   - Post-deploy run: synthetic monitoring checks, integration tests, and business-level smoke tests (e.g., create member, perform single transfer in sandbox mode)

Canary and rollout strategy
- Default: Canary deployment with progressive traffic (5%, 25%, 100%) and monitoring windows. If SLOs breach, automated rollback triggers.
- Database migrations must be backward-compatible; for non-backward patches use two-phase migrations (deploy code that tolerates both schemas, run migration, then remove compatibility code in a follow-up deploy).

Observability and verification
- Deployments publish structured deployment events to the monitoring system and CI artifacts; include build id and git sha.
- Post-deploy smoke tests must be run and their results recorded as evidence artifacts linked to the release.
- For feature verification, required evidence types (choose one):
  - Live staging URL with the feature exercised and annotated steps
  - E2E test run id (Playwright/Playwright Cloud) with trace attached
  - Short screencast (MP4) showing the feature
  - Automated API contract test report
- The pipeline will record and archive evidence attachments for audit.

Security & compliance checks in CI
- Secret scanning at push time (fail on high-risk secrets)
- SCA: block if critical vulnerabilities are newly introduced in dependencies
- SAST: CodeQL analysis on PRs and main
- Container image scanning (Trivy) during build
- SBOM generation and storage for each image
- Compliance checks: verify code changes adhere to coding/security standards via linters and custom rules

AI and product-specific verifications
- Because VANTORIS includes advanced AI features (AI Command Center, Member Advisor, unified chat, permission-aware AI, Guided AI workflows), CI must include regression and integration checks for: 
  - AI workspace availability: verify UI route loads the AI Command Center (full-screen) in staging and that UI returns a 200 for that route
  - Permission-aware behavior: run authorization unit/integration tests asserting that an account with limited roles does not see privileged AI actions
  - Deep-links from AI Action Center resolve to correct workflow URLs (smoke e2e)
  - Media uploads (photos, camera, video, files, pdf/docx/xlsx, voice notes, scanner) are accepted and stored in staging test buckets; validate upload endpoints and response structure
  - Unified chat: message delivery, read receipts, typing indicators, pinned messages, reactions, message search — each must have an e2e smoke test exercising the flow
  - Member Advisor integration: verify that the Member Advisor endpoint aggregates channels (chat, WhatsApp Business mock, voice/video mock) and returns expected presence/status
- For all AI features, CI must enforce that PRs updating AI behavior include Evidence artifacts proving integration (not just unit tests). If a feature is created but integration tests fail or no evidence is provided, mark it "Created but not integrated" in release notes.

Repository and workspace policies
- CI uses workspace detection to run only the affected jobs. However, security scans and CodeQL run for the entire repository on main.
- All infra changes under infra/ must include a deployment plan and rollback process in PR description.

Release notes and evidence-based reporting
- Release process requires structured changelog entries per PR with the following fields: component, type (fix/feat/docs), risk (low/medium/high), evidence (link), and verification steps.
- Release manager verifies that each user-facing feature has Evidence and marks features as:
  - Verified (evidence exists and staging smoke tests pass)
  - Created but not integrated (code exists but lacks evidence or staging integration)
  - Not implemented
- The CI system will annotate releases with these statuses automatically where possible.

PR checklist (enforced by CI & branch protection)
- [ ] Linked issue or ticket
- [ ] Updated docs if behavior changes (docs/...) 
- [ ] Lint & typecheck passing
- [ ] Unit & integration tests added/updated
- [ ] Evidence for user-facing changes included (link)
- [ ] Security review for critical/high-risk changes
- [ ] OWNERS listed for modified services

Cross-references
- docs/REPOSITORY_STRUCTURE.md — mapping of Base44 import to workspace layout
- docs/MIGRATION_GUIDE.md — will contain the import checklist and post-import CI enablement steps
- docs/SECURITY_STANDARDS.md — security gate definitions and secrets handling
- docs/API_ARCHITECTURE.md — contract test guidance referenced above
- docs/TESTING.md — testing matrix and where to put e2e tests (Playwright)

Dependencies & notes
- CI examples below assume GitHub Actions and a container registry (ECR/GCR/ACR). If your infra uses self-hosted runners, we will adapt the workflow to run expensive tests on dedicated runners.
- CI will require a staging environment with test credentials and a staging DB. The Migration Guide contains steps to provision ephemeral environments.

What I will commit next
- REPOSITORY_STANDARDS.md (expanded rules)

Files created or updated in this step
- Created: docs/CI_CD.md

If you want changes to the pipeline assumptions (runner choice, package manager, artifact registry), tell me now and I will update the document before proceeding to the next doc.
