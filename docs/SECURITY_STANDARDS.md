# SECURITY STANDARDS — VANTORIS

Status: normative documentation-only. This document defines mandatory security standards for VANTORIS and all contributors (human and AI). It is the security source of truth aligned with existing architecture, repository, API, database, coding, and CI/CD documents.

## 1) Purpose and scope

- Define mandatory security controls for product, platform, AI, and operations.
- Standardize identity, session, data protection, auditability, payment security, chat security, and verification controls.
- Ensure compatibility with Base44 migration (the planned import of the existing Base44 product codebase into this repository) while preserving existing business logic and improving security posture.

Applies to:
- Member-facing applications
- Operations, Executive, and Security dashboards
- Core banking services
- AI Command Center and Member Advisor
- Chat and media services
- All APIs, data stores, integrations, CI/CD, and operational workflows

## 2) Security architecture principles (mandatory)

VANTORIS MUST enforce the following principles across all services and environments:

1. **Zero Trust Architecture**
   - No implicit trust by network location, role, or UI visibility.
   - Every request MUST be authenticated, authorized, and policy-evaluated.
2. **Defense in Depth**
   - Security controls MUST exist at client, API gateway, service, data, and observability layers.
3. **Least Privilege**
   - Users, services, and tools receive the minimum permissions required.
4. **Separation of Duties**
   - Sensitive operations (payments, permissions, security settings, verification overrides) MUST be separable across roles and approval paths.
5. **Secure by Default**
   - Default behavior MUST deny access unless explicitly allowed.
   - New endpoints, workflows, and AI actions MUST launch with restrictive policies.

## 3) Identity and access management (IAM)

### 3.1 Authentication standards

- OAuth2 (Authorization Code + PKCE) MUST be used for member web/mobile authentication.
- OpenID Connect (OIDC) MUST be used for identity claims and federation.
- JWT access tokens MUST be short-lived and signed with managed keys.
- Refresh tokens MUST use rotation and revocation on suspected compromise.
- MFA MUST be required for privileged access and high-risk operations.
- WebAuthn/Passkeys MUST be supported for phishing-resistant authentication.

### 3.2 Authorization standards

- RBAC is mandatory across platform APIs and workflows.
- Future Attribute-Based Access Control (ABAC) support MUST be designed as an extension (contextual/attribute policies) without breaking RBAC semantics.
  - ABAC MUST act as an additional policy filter after RBAC allow/deny evaluation.
  - ABAC MUST NOT grant access that RBAC denies.
  - ABAC MAY deny access that RBAC allows when contextual risk/policy conditions fail.
- Frontend visibility is advisory only; backend authorization is mandatory for every privileged action.
- AI actions MUST be permission-aware and mapped to explicit permission descriptors.

### 3.3 Session management and trusted devices

- Session binding MUST include user, session, and device context.
- Trusted devices are limited to **two trusted devices per member identity account**.
- Adding a third trusted device MUST require removal of an existing trusted device before trust is granted.
- New trusted device enrollment MUST require all of:
  - Password re-verification
  - MFA challenge
  - Verification workflow completion
  - Audit logging
- In this document, a **stricter control** means a control that is more restrictive than this baseline (for example one trusted device instead of two, shorter inactivity timeout).
- Existing stricter deployments (single active trusted device) are allowed only as transitional controls.
  - Transitional window: until Base44 import completion plus two release cycles, then the two-device standard becomes mandatory unless a documented security exception is approved.
  - Hard limit: the transitional window ends at the earlier of (a) two release cycles or (b) 6 months from Base44 import completion.
  - Transitional window MUST NOT exceed 6 months from Base44 import completion.
  - Base44 import completion means: imported code is merged to `main`, staging smoke verification is complete, and migration evidence is recorded in release notes.
  - Release cycle here means one production release event from staging to production.

## 4) Session security controls (mandatory)

- Authenticated sessions MUST terminate after inactivity based on risk tier:
  - **5 minutes** for high-risk contexts (payments, security/settings, verification, administrative controls).
  - **10 minutes** for standard low-risk authenticated contexts.
  - Full login is required after termination in all cases.
- High-risk actions ALWAYS require fresh authentication (step-up), regardless of session state:
  - Transfers
  - ACH
  - Domestic wire
  - International wire
  - Zelle
  - Crypto transactions
  - Card management
  - Security settings
  - Verification changes
- Session and re-auth events MUST be audited with correlation and trace context.

## 5) Data protection standards

### 5.1 Encryption and key management

- Encryption in transit: TLS 1.3 is mandatory for all external and internal service traffic.
- Encryption at rest is mandatory for databases, logs, backups, and object storage.
- Field-level encryption MUST protect sensitive PII/PCI/payment fields.
- Tokenization MUST be used for Primary Account Number (PAN) and card-equivalent sensitive payment values.
- KMS integration is mandatory (e.g., AWS KMS or equivalent).
- Cryptographic keys MUST be rotated on defined baselines and emergency rotation MUST be supported:
  - JWT/signing keys: rotation at least every 30 days.
  - Data-encryption keys: rotation at least every 90 days.
  - High-risk compromised/suspected keys: immediate emergency rotation and revocation.

### 5.2 Secrets management

- Secrets MUST NOT be stored in source control.
- Secrets MUST be managed using Vault and/or AWS Secrets Manager.
- Secret access MUST be least-privilege, auditable, and environment-scoped.
- CI/CD pipelines MUST use short-lived credentials where possible.

### 5.3 Data minimization and retention

- Only required data may be collected, stored, or exposed.
- PII exposure in list/read APIs MUST be minimized by default.
- Retention and deletion policies MUST align with compliance and legal requirements.

## 6) Immutable audit standards

All security-sensitive actions MUST produce immutable audit records.

Mandatory audit fields:
- User (actor/user ID)
- Device ID
- Session ID
- Correlation ID
- Trace ID
- Before state
- After state
- IP address
- Location
- Timestamp

Audit requirements:
- Append-only audit storage
- Tamper-evident controls
- End-to-end propagation of correlation and trace context
- Coverage for auth, authorization, payments, verification, AI actions, admin changes, and security setting changes

## 7) Payment security standards

Applies to ACH, Domestic Wire, International Wire, Zelle, Crypto, and Cards.

- Every high-risk transaction MUST require step-up authentication.
- Every transaction endpoint MUST enforce idempotency controls and anti-replay protections.
- Risk-based checks MUST include velocity, anomaly, sanctions/Anti-Money Laundering (AML) screening, and device/session risk.
- Baseline payment risk controls MUST include at minimum:
  - Velocity thresholds by account, channel, and device over required rolling windows of 15 minutes, 24 hours, and 7 days; each window is evaluated independently and a violation in any window triggers enforcement.
  - Minimum baseline policy:
    - Trigger step-up or hold when external transfer attempts exceed 3 within 15 minutes.
      - External transfer attempts include initiated/submitted attempts, including failed and cancelled attempts; system-initiated reversals are excluded.
      - User-cancelled attempt: action initiated by the member and then cancelled by the member/operator before completion.
      - System-initiated reversal: compensating/reversal entry generated by platform controls after posting; not counted as a new attempt.
    - Trigger step-up or hold when cumulative high-risk transfer value exceeds USD 10,000 equivalent within 24 hours per member identity account.
      - USD equivalence uses the trusted FX reference rate at transaction initiation time for threshold calculations.
      - Trusted FX reference rate source: approved treasury/risk rate service configured by platform governance.
    - Trigger manual review for repeated failed high-risk attempts across a 7-day window.
    - These thresholds are mandatory defaults and MUST be reviewed/tuned by risk governance at least quarterly.
  - Escalation outcomes: allow, step-up challenge, manual review hold, or deny.
- Sensitive payment actions MUST emit immutable audit events.
- Payment data MUST use encryption + tokenization according to PCI DSS and platform standards.

## 8) AI security standards (AI Command Center and Member Advisor)

AI capabilities MUST be secure, permission-bound, and auditable.

Required controls:
- Permission-aware AI action exposure and execution
- AI action authorization at execution time (backend enforced)
- Prompt protection (template governance, injection resistance, safe rendering)
- Memory isolation between tenants/users
- Conversation isolation and strict access control
- Tool permissions enforced per action and caller role
- Workflow permissions enforced for every guided workflow step
- Audit logging for all AI actions and workflow executions

Additional requirements:
- No hardcoded privileged prompts or permissions in UI components.
- AI outputs used for sensitive actions MUST require explicit user confirmation and policy checks.

## 9) Chat and media security standards

Applies to messages, photos, videos, voice notes, documents, and AI summaries.

- Unified chat architecture MUST enforce consistent authentication and authorization.
- All chat/media content MUST be encrypted in transit and at rest.
- File/media ingestion MUST include malware scanning.
- Malware scanning controls MUST include:
  - Scan before release to recipients; unscanned content MUST remain quarantined.
  - Quarantine and block delivery for detected threats.
  - Defined max file-size/type policy and rejection behavior for unsupported types.
  - Fail-closed behavior on scan timeout/failure for high-risk channels (payment-support channels, externally shared channels, and admin/security workspaces).
  - Scan timeout baseline: total 60 seconds inclusive of retries (max 2 retries with exponential backoff); if still unresolved, content remains quarantined and blocked.
- Upload/download MUST use signed URLs with scoped TTL and access controls.
- Retention policies MUST be defined by data type and compliance obligations.
- Access control MUST enforce participant/resource authorization for all message/media reads and writes.
- AI summaries MUST inherit source conversation access controls and audit requirements.

## 10) Verification Center security standards

Verification Center is the only verification interface and API surface (replacing generic KYC pages/APIs).

Required protected flows:
- Identity verification
- Address verification
- Email verification
- Phone verification
- Income verification
- Business verification
- Trusted-device verification

Verification controls:
- Strong identity/session checks for submission and state changes
- Provider callback validation and replay protection
- Immutable audit records for all status transitions and overrides
- Access controls preventing unauthorized verification visibility or edits

## 11) Compliance and governance standards

VANTORIS implementations MUST support:
- PCI DSS
- SOC 2
- GDPR
- AML
- KYC (implemented via Verification Center capabilities)
- Data retention and legal hold requirements
- Incident response lifecycle (detect, triage, contain, remediate, recover, postmortem)

Governance requirements:
- Security-critical changes require security review.
- Security evidence MUST be included in PR/release reporting.
- Security controls MUST be continuously validated in CI/CD and staging/production checks.

## 12) Base44 migration compatibility

These standards MUST remain compatible with future Base44 code import.

Migration requirements:
- Preserve existing business logic while improving architecture, maintainability, performance, accessibility, and security.
- Apply security controls as additive/refactor-safe changes where possible.
- Do not weaken existing stricter controls during migration.
- Document any temporary exceptions and sunset plans.
  - Temporary exceptions MUST include owner, risk rationale, compensating controls, approval record, and expiry date.

## 13) Enforcement and verification requirements

For any security-relevant change, contributors and AI agents MUST provide evidence aligned with repository standards:
- Files changed
- Components changed
- Routes changed
- APIs changed
- Database changes
- Build status
- Runtime verification
- Integration verification

If functionality exists but is not integrated, it MUST be reported as:
- **Created but not integrated.**
  - Example states include: endpoint/spec exists but is not wired to runtime flow, component exists behind inactive feature flag with no user path, or workflow exists without integration verification evidence.

Evidence reporting location and format:
- Required in PR description and release notes using the repository Evidence fields defined in `./REPOSITORY_STANDARDS.md`.
- CI/CD validation and enforcement follow `./CI_CD.md`.

## 14) Cross-references

- `../README.md`
- `./ARCHITECTURE.md`
- `./COMPONENT_ARCHITECTURE.md`
- `./REPOSITORY_STRUCTURE.md`
- `./REPOSITORY_STANDARDS.md`
- `./CODING_STANDARDS.md`
- `./CI_CD.md`
- `./API_ARCHITECTURE.md`
- `./DATABASE_ARCHITECTURE.md`

## 15) Documentation-only constraint

This document is documentation-only. It defines standards and does not introduce application code, infrastructure code, or implementation artifacts.
