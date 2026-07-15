# Security Standards — VANTORIS

Status: normative documentation-only. This document defines the mandatory security standards for VANTORIS and incorporates the current architectural decisions from the repository as the source of truth for future implementation and Base44 migration work.

## Purpose

- Define security requirements that apply across member, operations, executive, security, AI, chat, verification, and payment surfaces.
- Preserve a unified operating experience where members and operators perform their work entirely within VANTORIS.
- Ensure security controls are secure by default, auditable, compatible with regulated financial workflows, and compatible with the future Base44 import.

## Core Security Principles

### Unified Operating Experience

- VANTORIS MUST provide a unified operating experience for both members and operators.
- Members and operators MUST perform their work within VANTORIS rather than switching across disconnected third-party systems.
- The AI Assistant, Member Advisor, and Operations Center MUST automate routine workflows, coordinate tasks, and surface decisions inside the platform.
- External providers and partner systems MUST be abstracted behind VANTORIS APIs, workflows, and user interfaces.
- Manual intervention MUST be limited to high-risk actions, exception handling, or cases where policy, law, or regulation explicitly requires human review.
- Security controls MUST support this unified operating model without fragmenting the user experience.

### Security Architecture

- Zero Trust Architecture is mandatory: every request, device, session, service, and workflow boundary must be validated continuously.
- Defense in Depth is mandatory: network, application, identity, data, workflow, logging, and operational controls must work together.
- Least Privilege is mandatory: users, operators, services, workflows, and AI actions must receive only the minimum access required.
- Separation of Duties is mandatory: no single role or workflow should be able to approve, execute, and reconcile sensitive operations without appropriate controls.
- Secure by Default is mandatory: insecure defaults, optional audit trails, and opt-in protection for sensitive workflows are prohibited.

## Identity & Access Standards

- OAuth 2.0 is the standard for delegated authorization.
- OpenID Connect is the standard for identity federation and authenticated user identity claims.
- JWT access tokens are required for authenticated API access and must be short-lived.
- Refresh tokens must use rotation and revocation controls.
- MFA is required for privileged access, account recovery, device trust changes, and high-risk actions.
- WebAuthn / passkeys are the preferred phishing-resistant authentication mechanism for supported platforms.
- Session management, trusted-device state, MFA state, and fresh-auth state must be enforced consistently across web, mobile, operations, and AI surfaces.
- RBAC is the current authorization model for platform users, operators, and administrators.
- ABAC support must remain possible in future architecture without breaking current RBAC contracts, permissions, or audit expectations.
- Frontend visibility rules may reflect permissions, but backend enforcement is always authoritative.
- Service-to-service calls must use signed JWTs, mTLS, or equivalent strong service authentication.

## Session Security & Trusted Devices

- Each account may have a maximum of two active trusted devices.
- The two-device limit is a platform security policy and must not be overridden or bypassed through local configuration.
- The two-device limit balances usability and risk by supporting a primary personal device and one additional trusted device while reducing the attack surface of persistent trust relationships.
- Adding a third trusted device MUST require removal of one existing trusted device before activation.
- A new trusted device MUST require all of the following:
  - Password authentication
  - MFA challenge completion
  - Verification flow completion
  - Immutable audit logging
- Trusted device records MUST preserve history and must not be hard-deleted.
- Sessions must be bound to authenticated identity, device context, and session identifiers.
- After inactivity, the authenticated session MUST automatically terminate and require full login again.
- The enforced inactivity timeout MUST be policy-defined within a 5–10 minute range:
  - 5 minutes for privileged or elevated-risk sessions
    - Includes administrative sessions
    - Includes security and compliance sessions
    - Includes sessions reviewing, editing, approving, or submitting sensitive financial actions
  - 10 minutes for standard authenticated sessions that are not currently operating in a privileged or elevated-risk context
- Implementations may warn users before automatic termination, but warnings must not weaken or silently extend the required timeout.
- High-risk actions MUST always require fresh authentication regardless of current session state.
- High-risk actions include, at minimum:
  - Transfers
  - ACH
  - Domestic wire
  - International wire
  - Zelle
  - Crypto
  - Card management
  - Security settings
  - Verification changes
- Session termination, lockouts, reauthentication, trusted-device changes, and suspicious-session events MUST be audit logged.

## Authorization, Roles, and Separation of Duties

- Permissions must be machine-readable, consistently named, and enforceable across UI, APIs, workflows, and AI actions.
- Sensitive roles must be segregated across operations, security, executive administration, and compliance functions.
- Approval workflows must support maker-checker patterns for sensitive financial and security operations.
- Privileged administrative access must be time-bounded, attributable, and auditable.
- Role grants, revocations, permission changes, and policy overrides must create immutable audit records.

## Data Protection Standards

### Encryption at Rest

- Sensitive data MUST be encrypted at rest in databases, caches containing sensitive data, object storage, backups, archives, and logs containing protected fields.
- Database protections may include TDE, column-level encryption, and field-level encryption depending on data sensitivity.
- Object storage for documents, chat media, exports, and statements MUST use encryption at rest and controlled access policies.

### Encryption in Transit

- TLS 1.3 is required for external client traffic, administrative access, service APIs, and third-party integrations where supported.
- Internal service communication must use encrypted channels and strong identity validation.
- Unencrypted transport for production sensitive data is prohibited.

### Field-Level Encryption

- Field-level encryption is required for highly sensitive PII, financial identifiers, verification artifacts, and regulated data elements.
- Encrypted fields must be isolated from general application access and only decrypted in explicitly authorized workflows.

### Tokenization

- Tokenization is required for card data, payment credentials, and other sensitive payment artifacts where raw values are not needed operationally.
- Plaintext PAN (Primary Account Number) storage is prohibited.
- Tokenized references MUST be used in downstream workflows whenever raw values are not operationally required, preserving the unified operating experience without overexposing sensitive data.

### Key Rotation & KMS Integration

- Encryption keys MUST be managed through a centralized KMS or equivalent managed key platform.
- AWS KMS, Vault-backed key management, or equivalent approved systems MUST provide production key custody.
- The approved production allowlist initially includes AWS KMS and Vault-backed key management.
- An approved key-management system MUST provide:
  - Centralized administration
  - Strong access control
  - Audit logging
  - Rotation support
  - Encryption-key custody protections
  - Completion of a documented security review, threat assessment, and control-mapping review
  - Formal sign-off by platform and security owners before production use
- Key rotation MUST be defined and enforced for data encryption keys, service secrets, signing keys, and integration credentials.
- Envelope encryption MUST be used for large objects and document/media payloads.

### Secrets Management

- Secrets must be stored only in approved secret-management systems such as Vault or AWS Secrets Manager.
- Secrets must never be committed to the repository, embedded in documentation examples as live values, or hardcoded in application logic.
- Secret access MUST be least-privilege, time-bounded, and fully auditable.

## Audit & Security Observability

- Every security-sensitive action MUST create an immutable audit record.
- Audit records MUST capture, where applicable:
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
- Audit events must be append-only, tamper-evident, and retained according to compliance and legal requirements.
- Correlation IDs and trace context must propagate through synchronous and asynchronous workflows, including Kafka/event-driven processing.
- Security monitoring must support anomaly detection, incident investigation, workflow tracing, and regulatory evidence production.
- Audit coverage is mandatory for:
  - Authentication and MFA events
  - Trusted-device events
  - Session creation, refresh, termination, and suspicious activity
  - Permission grants and policy changes
  - Verification actions and status transitions
  - Payment initiation, approval, reversal, and failure events
  - AI actions, tool execution, workflow execution, and memory access

## Payment Security Standards

- Payment workflows must preserve transaction integrity, traceability, and strong user authorization.
- The following payment domains are in scope:
  - ACH
  - Domestic wire
  - International wire
  - Zelle
  - Crypto
  - Cards
- High-risk payment actions MUST require step-up authentication and fresh authentication.
- Payment workflows must enforce least privilege, dual control where appropriate, and immutable audit logging.
- Payment instructions, beneficiary changes, settlement actions, reversals, and exceptions must be attributable to a user, device, session, or approved system workflow.
- PCI-sensitive and payment-sensitive data must use tokenization and field-level protections.
- Sanctions, AML, OFAC, fraud, and compliance checks must be embedded within VANTORIS workflows rather than delegated to end users through external tools.

## AI Security Standards

- AI must be permission-aware by default.
- AI action authorization is mandatory: AI may only surface or execute actions the current actor is authorized to perform.
- Prompt protection is mandatory: system prompts, policy prompts, and security instructions must be protected from unauthorized disclosure or override.
- Memory isolation is mandatory: AI memory must be scoped and access-controlled by actor, tenant, role, and approved workflow context.
- Conversation isolation is mandatory: AI conversations and related context must not leak across users, operators, organizations, or security domains.
- Tool permissions are mandatory: AI tool access must be explicitly granted, narrowly scoped, and auditable.
- Workflow permissions are mandatory: AI-guided workflows must inherit and enforce the same authorization rules as direct user actions.
- All AI actions, tool calls, workflow executions, prompt renders, memory writes, and permission decisions MUST be audit logged.
- AI MUST automate routine workflows inside VANTORIS where authorized, but high-risk or regulated actions MUST still require the same human approval and authentication controls as non-AI flows.

## Chat & Media Security Standards

- Unified chat security applies across messages, photos, videos, voice notes, documents, and AI summaries.
- Chat content and metadata must be protected with encryption in transit and encryption at rest.
- Media and document uploads must use controlled upload flows such as signed URLs with server-side metadata validation.
- Malware scanning is required for uploaded files and attachments before they are treated as safe for general access.
- Access to messages, attachments, summaries, and conversation metadata must be permission-based and scoped to authorized participants and staff.
- AI summaries must inherit the access controls of the underlying conversation and source content.
- Signed URLs must be short-lived, non-public, and bound to authorized retrieval workflows.
- Chat retention policies must align with legal, security, privacy, and support requirements.
- PII-containing files and messages must support classification, retention handling, and redaction requirements where policy requires it.
- Moderation, malware, and security status transitions for uploaded content must be recorded and auditable.

## Verification Center Security Standards

- Verification Center is the single verification surface for the platform.
- Security requirements must be defined and enforced for:
  - Identity verification
  - Address verification
  - Email verification
  - Phone verification
  - Income verification
  - Business verification
  - Trusted-device verification
- Verification workflows must be stateful, auditable, and explicit; verification-critical states must not be hidden behind ambiguous messaging.
- Verification artifacts, decisions, and provider responses must be treated as sensitive data with encryption, access control, and retention policies.
- Verification workflows must stay inside VANTORIS from the user and operator perspective, even when external vendors are used behind the platform.
- Manual review MUST be reserved for exceptions, elevated risk, provider failures, or policy/regulatory requirements.

## Personalization & Identity Data Handling

- The member profile source of truth MUST support:
  - Legal First Name (required)
  - Legal Middle Name (optional)
  - Legal Last Name (required)
  - Preferred Name (optional)
- Display priority for member-facing and operator-facing interfaces MUST be:
  1. Use Preferred Name when present.
  2. If Preferred Name is absent, use Legal First Name for compact display contexts.
  3. If Preferred Name is absent and a fuller non-legal display is needed, use Legal First Name + Legal Last Name.
- If Preferred Name is present, it remains the default display value even when a fuller non-legal display would otherwise be used.
- Routine display contexts such as greetings, dashboards, conversation lists, notifications, and standard operator work queues must not include Legal Middle Name.
- Legal Middle Name must be excluded from routine display contexts unless a legal, compliance, verification, contractual, statement, or regulatory use case requires the complete legal name.
- Email usernames must never be displayed as member names.
- Legal-name and preferred-name fields must be protected as sensitive profile data with access controls appropriate to member, operations, support, compliance, and security roles.
- Changes to legal-name fields and preferred-name fields must be auditable.
- The complete legal name (Legal First Name + Legal Middle Name + Legal Last Name) MUST be used for:
  - Verification
  - Compliance workflows
  - Legal documents
  - Statements
  - Contracts
  - Regulatory reporting
- Personalization rules must be implemented consistently across member, operations, AI, chat, and reporting surfaces.

## Compliance, Retention, and Incident Response

- VANTORIS security controls must support PCI DSS, SOC 2, GDPR, AML, KYC, and related financial-services obligations.
- Data retention policies must be defined by data class, legal obligation, and operational need.
- Audit logs, payment history, verification artifacts, documents, and chat records must have explicit retention and archival policies.
- Privacy controls must support minimization, access control, lawful processing, and appropriate deletion/redaction workflows where legally permitted.
- Incident response must define detection, containment, escalation, evidence preservation, customer/regulatory notification, recovery, and post-incident review requirements.
- Security exceptions must be documented, approved, time-bounded, and reviewable.

## Base44 Migration Compatibility

- These standards must remain compatible with the future Base44 migration.
- Imported Base44 code and data must be mapped into the VANTORIS security model rather than bypassing it.
- Security-sensitive entities, IDs, audit references, and verification/payment records MUST be preserved during migration except where a documented regulatory, legal, or technical constraint requires an approved transformation.
- Migration and refactor work must preserve auditability, access controls, data protection, and user-visible personalization rules.
- No migration step may introduce weaker defaults than the standards defined in this document.

## Cross-References

- ../README.md
- ARCHITECTURE.md
- COMPONENT_ARCHITECTURE.md
- REPOSITORY_STRUCTURE.md
- REPOSITORY_STANDARDS.md
- CODING_STANDARDS.md
- CI_CD.md
- API_ARCHITECTURE.md
- DATABASE_ARCHITECTURE.md
