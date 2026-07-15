# Security Standards — VANTORIS

Status: normative documentation-only. This document defines mandatory security standards for VANTORIS and aligns with the repository’s architecture, API, database, CI/CD, and coding standards. These controls are designed to remain compatible with the Base44 migration path.

## 1) Security Architecture

VANTORIS security controls MUST be implemented using the following principles:

- **Zero Trust Architecture**: no implicit trust by network location, device, or session age; every request is continuously verified.
- **Defense in Depth**: controls are layered across client, API gateway, service, data, audit, and infrastructure boundaries.
- **Least Privilege**: users, services, tools, and workflows receive only minimum required access.
- **Separation of Duties**: privileged operations (security policy changes, role grants, payment approvals, key access) MUST require distinct roles and auditable handoffs.
- **Secure by Default**: default configuration MUST deny unsafe actions, enforce encryption, and require explicit enablement for privileged behavior.

## 2) Identity & Access Standards

### 2.1 Authentication and federation
- OAuth2 and OpenID Connect are the standard for user and application authentication flows.
- JWT access tokens are required for API authorization with short lifetimes and refresh token rotation.
- MFA is required for privileged access, sensitive account changes, and high-risk transaction paths.
- WebAuthn/Passkeys are supported for phishing-resistant authentication and re-authentication.

### 2.2 Authorization model
- RBAC is mandatory across UI, API, and workflow layers.
- Backend authorization enforcement is mandatory; frontend visibility checks are advisory only.
- Permission descriptors for AI actions and workflows MUST be machine-readable and centrally managed.
- The model MUST remain forward-compatible with ABAC expansion (resource-, context-, and risk-aware policy attributes).

### 2.3 Session and trusted device controls
- Maximum of **two trusted devices per account**.
- The two-device cap is a deliberate risk-reduction control for account takeover resistance and operational consistency, balancing common usage (phone plus one primary computer) with tighter attack-surface control.
- Adding a third trusted device requires removing one existing trusted device first.
- New trusted devices require all of: password verification, MFA challenge, verification workflow completion, and immutable audit logging.
- Trusted device lifecycle changes (add, approve, revoke, replace) MUST be fully auditable.

## 3) Session Security (Normative)

- Authenticated sessions MUST automatically terminate after inactivity with a policy-controlled value in the **5-10 minute range** (default **10 minutes**; high-risk profiles MAY enforce **5 minutes**).
- This aggressive timeout requirement is intentional for VANTORIS due to high-risk financial operations and must be applied consistently across channels.
- Terminated sessions MUST require full login again (no silent restoration).
- For read-only experiences, UI lock behavior may be used before full termination, but privileged actions still require fresh authentication.
- High-risk profiles include elevated fraud/risk signals, privileged roles, or sessions performing high-risk financial/security workflows.
- High-risk actions MUST require fresh authentication regardless of current session state:
  - Transfers
  - ACH
  - Domestic Wire
  - International Wire
  - Zelle
  - Crypto
  - Card Management
  - Security Settings
  - Verification Changes

## 4) Data Protection Standards

### 4.1 Encryption and tokenization
- Encryption at rest is mandatory for all sensitive data stores (database, object storage, backups, logs containing sensitive fields).
- Encryption in transit MUST use TLS 1.3 for external and internal service communications.
- Field-level encryption is required for high-sensitivity fields (PII, payment/security attributes, verification artifacts).
- Tokenization is required for payment-sensitive data (e.g., card Primary Account Number (PAN) handling and equivalent high-risk identifiers).

### 4.2 Key and secret management
- Keys MUST be managed using KMS-integrated workflows (e.g., AWS KMS or an equivalent managed key service).
- Envelope encryption is required where large object protection applies.
- Key rotation MUST be automated on a defined schedule and on-demand for incident response.
- Secrets MUST be stored in managed secret stores (Vault and/or AWS Secrets Manager); secrets MUST NOT be committed to source control.

## 5) Immutable Audit Standards

Every security-sensitive action MUST create immutable audit records.

Required audit fields:
- User
- Device
- Session
- Correlation ID
- Trace ID
- Before State
- After State
- IP
- Location
- Timestamp

Additional normative requirements:
- Audit history MUST be append-only and tamper-evident.
- Audit records MUST cover authentication, authorization, trusted device actions, verification events, security setting changes, AI actions, and payment operations.
- Correlation and trace identifiers MUST propagate across synchronous and asynchronous boundaries.

## 6) Payment Security Standards

These channels are security-critical and MUST follow step-up controls:
- ACH
- Domestic Wire
- International Wire
- Zelle
- Crypto
- Cards

For high-risk transactions:
- Step-up authentication is mandatory before execution.
- Transaction authorization decisions MUST be auditable.
- Risk-based controls (velocity, anomaly, geo/device signals, sanctions/AML flags) MUST be enforced prior to final execution.

## 7) AI Security Standards

VANTORIS AI capabilities (AI Command Center and Member Advisor surfaces) MUST implement:

- **Permission-aware AI**: AI capabilities are scoped to caller permissions.
- **AI Action Authorization**: every AI-triggered action must pass the same backend authorization checks as manual actions.
- **Prompt Protection**: prompt templates and system instructions are controlled assets with access restrictions and change auditability.
- **Memory Isolation**: AI memory must be scoped by tenant/member/context and protected against cross-user leakage.
- **Conversation Isolation**: conversation data boundaries are enforced per member, organization, and role.
- **Tool Permissions**: tool execution by AI is allowlisted and policy-enforced.
- **Workflow Permissions**: guided workflows require explicit permission checks at each privileged step.
- **Audit Logging**: all AI actions, prompts, tool invocations, and workflow outcomes are auditable with correlation and trace context.

## 8) Chat Security Standards

Security controls for messages, photos, videos, voice notes, documents, and AI summaries:

- Data encryption at rest and in transit is mandatory.
- Media/file access MUST use signed URLs with bounded lifetime and access scope.
- Malware scanning is mandatory for uploaded files before trusted availability.
- Access controls MUST enforce conversation membership, role, and tenant boundaries.
- Retention and deletion/archival policies MUST be documented and enforced per compliance requirements.
- AI-generated summaries inherit conversation-level access controls and audit requirements.

## 9) Verification Center Security Requirements

Verification Center is the canonical verification surface and MUST secure:
- Identity
- Address
- Email
- Phone
- Income
- Business
- Trusted Devices

Normative requirements:
- Verification states must remain explicit and auditable.
- Verification evidence and documents require strict access controls and encryption.
- Provider callbacks and decision changes MUST be idempotent, authenticated, and audited.
- Verification changes that affect account security posture MUST trigger re-authentication and risk controls.

## 10) Personalization Security and Legal Name Policy

Member profiles are required to support:
- **Legal First Name (Required)**
- **Legal Middle Name (Optional)**
- **Legal Last Name (Required)**
- **Preferred Name (Optional)**

If Legal Middle Name is provided, it becomes part of the legal identity record and MUST be included anywhere complete legal name is required.

Display priority:
1. Preferred Name
2. Legal First Name
3. Legal First Name + Legal Last Name

Normative restrictions:
- Email usernames (the local part before `@`) and full email addresses MUST NEVER be used as member display names.
- Complete legal name (**Legal First + Legal Last**, and **Legal Middle** when provided) MUST be used for verification, compliance, legal documents, statements, contracts, and regulatory reporting.
- Legal Middle Name usage in complete legal name applies to legal/compliance contexts and does not override the member-facing display-name priority defined above.
- Prohibiting email-derived display names reduces privacy leakage and avoids accidental exposure of login identifiers.

## 11) Compliance Controls

VANTORIS controls MUST support:
- PCI DSS
- SOC 2
- GDPR
- AML
- KYC
- Data Retention
- Incident Response

Compliance execution requirements:
- Security controls, evidence, and auditability must be demonstrable in CI/CD and runtime operations.
- Retention schedules, archival handling, and legal hold behavior must be documented and enforceable.
- Incident response must define detection, containment, eradication, recovery, and post-incident evidence preservation.

## 12) Base44 Migration Compatibility

Security standards during migration MUST:
- Preserve existing business entities and relationships where feasible.
- Apply security controls without requiring destructive data model rewrites.
- Remain compatible with contract-first API standards and PostgreSQL/node-pg-migrate conventions.
- Ensure imported Base44 components are integrated into the same identity, authorization, audit, encryption, and compliance control plane.

## 13) Cross-References

- ./ARCHITECTURE.md
- ./COMPONENT_ARCHITECTURE.md
- ./REPOSITORY_STRUCTURE.md
- ./REPOSITORY_STANDARDS.md
- ./CODING_STANDARDS.md
- ./CI_CD.md
- ./API_ARCHITECTURE.md
- ./DATABASE_ARCHITECTURE.md
