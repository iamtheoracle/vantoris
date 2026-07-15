# Security Standards — VANTORIS

Status: normative. This document is the authoritative security standard for every contributor, operator, AI agent, and system component of VANTORIS. It incorporates architectural decisions from docs/ARCHITECTURE.md, docs/COMPONENT_ARCHITECTURE.md, docs/REPOSITORY_STRUCTURE.md, docs/REPOSITORY_STANDARDS.md, docs/CODING_STANDARDS.md, docs/CI_CD.md, docs/API_ARCHITECTURE.md, and docs/DATABASE_ARCHITECTURE.md. It is documentation-only until the Base44 export is imported; after import it becomes an enforced production standard.

Purpose
- Establish non-negotiable security requirements that apply to every layer of the platform: infrastructure, network, application, data, identity, AI, and operations.
- Define canonical security behaviors for session management, trusted devices, payment flows, verification, personalization, AI, chat, and compliance.
- Serve as the source of truth referenced by all other architecture and coding documents.

---

## Table of Contents

1. Security Architecture Principles
2. Identity and Access Management
3. Session Security
4. Trusted Devices
5. Data Protection
6. Secrets Management
7. Payment Security
8. AI Security
9. Chat Security
10. Verification Center Security
11. Personalization and Display Name Security
12. Audit and Observability
13. Compliance
14. Incident Response
15. Base44 Migration Compatibility
16. Cross-References

---

## 1. Security Architecture Principles

### 1.1 Zero Trust Architecture

VANTORIS adopts Zero Trust as its governing security model. No request is trusted by default regardless of origin, network, or previous authentication state.

Requirements:
- Every inbound request to any service must be authenticated, authorized, and validated individually.
- Internal service-to-service calls must use mTLS or signed JWTs; no service is implicitly trusted because it is inside the network perimeter.
- Every component must assume it may be compromised and must enforce its own access controls independently of the calling system.
- Access to sensitive data and operations must be verified at runtime, not assumed from a prior session state.

### 1.2 Defense in Depth

Security controls are layered. The failure of one control must not expose the system to unacceptable risk.

Layers:
- Network: VPC security groups, WAF, DDoS protection, private subnets for databases and internal services.
- Edge / Gateway: TLS termination, token validation, rate limiting, IP-based defenses.
- Application: RBAC and ABAC enforcement, input validation, output encoding, CORS policy.
- Data: Encryption at rest (TDE, field-level), tokenization, key rotation, immutable audit records.
- Operational: Security monitoring, anomaly detection, automated alerting, incident response playbooks.

### 1.3 Least Privilege

Every actor — member, operator, service, AI agent — receives only the minimum permissions required for the specific operation being performed.

Requirements:
- Default: deny all access; allow only explicitly granted permissions.
- Roles must be scoped to the narrowest applicable surface (e.g., read-only transaction viewer vs full account administrator).
- AI actions must be gated by permission descriptors stored in libs/ai/permissions; the AI cannot invoke any action unless the calling identity holds the matching permission.
- Temporary elevated access must be time-bounded and fully audited.

### 1.4 Separation of Duties

No single actor should be able to initiate and approve a high-risk action without a second-party control.

Requirements:
- Payment initiations above defined thresholds require dual-approval workflows.
- Security settings changes (MFA enrollment, trusted device registration, permission grants) must be initiated by the member and confirmed via a separate authentication factor.
- Administrative operations must be separated from member-facing operations at the role and service boundary level.

### 1.5 Secure by Default

All security controls must be active by default. Opt-out must be explicit, audited, and limited to non-security-critical contexts.

Requirements:
- New features launch with the most restrictive permission set.
- Debug modes and developer bypasses must be impossible to enable in production builds.
- No secrets, credentials, or PII may appear in application logs at any log level.
- Sensitive configuration must be injected via environment variables sourced from a secrets manager; never hardcoded.

---

## 2. Identity and Access Management

### 2.1 Authentication Protocol Stack

VANTORIS requires the following identity protocols for all member and operator authentication:

- OAuth 2.0 Authorization Code with PKCE: primary authentication flow for web and mobile clients.
- OpenID Connect (OIDC): identity layer over OAuth2 for member identity tokens; provides sub (stable user identifier), name, and standardized claims.
- JWT: access tokens and identity tokens; short-lived (15 minutes maximum); signed with RS256 or ES256.
- Refresh Token Rotation: every refresh issues a new refresh token and invalidates the previous one; stolen token detection via replay monitoring.
- mTLS: service-to-service authentication for internal API calls; complements or replaces signed JWTs for internal trust.

### 2.2 Multi-Factor Authentication (MFA)

MFA is required for all member accounts, all operator accounts, and all administrative accounts.

Requirements:
- At least one MFA method must be enrolled before account activation is complete.
- Supported MFA methods: TOTP (authenticator app), SMS OTP, email OTP, hardware security keys (WebAuthn).
- MFA enrollment changes (adding, removing, or replacing a factor) are treated as high-risk actions requiring fresh authentication and full audit logging.
- Re-authentication for high-risk operations must use a live MFA factor, not a cached session state.

### 2.3 WebAuthn and Passkeys

VANTORIS supports WebAuthn (FIDO2) as a first-class authentication method for passwordless and biometric flows.

Requirements:
- Members may register WebAuthn credentials (platform authenticators: Face ID, Touch ID, Windows Hello; roaming authenticators: FIDO2 hardware keys) as a primary or secondary factor.
- Passkeys (discoverable credentials synced across devices via platform keychain) are supported and recommended for primary authentication.
- Each registered WebAuthn credential must be bound to a specific trusted device record; removal of a trusted device must invalidate the associated WebAuthn credential.
- WebAuthn credential registration and deletion are audited events.

### 2.4 Role-Based Access Control (RBAC)

VANTORIS implements RBAC as the primary authorization model with a clear path to Attribute-Based Access Control (ABAC) as the platform matures.

Roles (illustrative, non-exhaustive):
- member: standard account holder; access limited to own accounts and profile.
- member_joint: holder of joint account; access limited to shared accounts and own profile.
- org_admin: organization administrator; manages org members and settings within their organization.
- operations_agent: operations center staff; access to member accounts for support purposes; all access audited.
- operations_supervisor: operations supervisor; can approve high-risk operational actions.
- executive: read-only executive dashboard access; no transactional permissions.
- security_admin: security configuration and audit log access; cannot initiate financial transactions.
- system_admin: platform-wide administrative access; subject to highest audit and approval controls.
- ai_agent (service role): permission-aware AI service account; limited to explicitly granted AI action permissions.

RBAC requirements:
- Roles must be stored as first-class records and versioned; changes to role definitions require a documented change review.
- Backend services enforce RBAC independently of the frontend; the frontend may use permission hints for display purposes only.
- ABAC support will be introduced for context-sensitive controls (time-of-day, geography, account risk score) as a future enhancement without breaking existing RBAC rules.

### 2.5 Session Management

See Section 3 for full session security requirements. This section documents the token architecture.

- Access tokens: JWT; maximum 15 minutes lifetime; scoped to specific permissions.
- Refresh tokens: opaque tokens; maximum 30 days lifetime with sliding window; stored server-side; rotated on every use.
- Session records: stored in Redis with session_id, member_id, device_id, ip_address, created_at, last_activity_at, risk_score, and fresh_auth_flag.
- Session termination is propagated to all active WebSocket connections for the affected session.

---

## 3. Session Security

### 3.1 Inactivity Timeout

| Condition | Behavior |
|---|---|
| 2 minutes of inactivity | Application UI locks; biometric or PIN unlock required to resume without full re-authentication. |
| 5–10 minutes of inactivity | Authenticated session is fully terminated; full login required (password + MFA). |
| Risk-adjusted timeout | Sessions involving recent high-risk actions may apply a shorter inactivity threshold (e.g., 2 minutes). |

Requirements:
- The inactivity timer must reset on any user interaction (mouse, keyboard, scroll, or touch event).
- The 2-minute lock and the 5–10-minute termination are separate states; the lock does not prevent termination at the upper threshold.
- On session termination the server must invalidate the session record in Redis and revoke the refresh token.
- The frontend must not store session state in localStorage or sessionStorage beyond what is required for the UI lock state; cryptographic session identifiers must be in secure, HttpOnly, SameSite=Strict cookies.

### 3.2 High-Risk Action Re-Authentication

The following actions always require fresh authentication regardless of session state, inactivity status, or the presence of a valid access token:

| Action Category | Examples |
|---|---|
| Fund transfers | Internal transfers, external transfers, bill payments |
| ACH | ACH origination, ACH debit authorization |
| Domestic Wire | Domestic wire initiation, beneficiary management |
| International Wire | International wire initiation, SWIFT/IBAN changes |
| Zelle | Zelle send, Zelle recipient enrollment |
| Crypto | Crypto withdrawal, wallet address changes, staking |
| Card management | Card issuance, PIN change, card lock/unlock, spending limit changes |
| Security settings | Password change, MFA enrollment/removal, trusted device changes |
| Verification changes | Identity re-verification, address change, email change, phone change |

Fresh authentication means the member must provide their current password and complete an active MFA challenge within the same request context. The fresh_auth_flag in the session record is set by the authentication service and consumed by the service handling the high-risk action; it expires after a single use or after a configurable short window (default: 5 minutes after challenge completion).

### 3.3 Session Isolation

- Each session is bound to a single device_id and ip_address at creation time.
- Concurrent sessions from different devices are permitted (up to the trusted device limit; see Section 4).
- If the device_id or ip_address changes mid-session, the session is flagged for risk evaluation; high-risk deviations result in immediate session termination and member notification.
- Sessions associated with removed trusted devices are immediately invalidated.

---

## 4. Trusted Devices

### 4.1 Maximum Device Policy

| Rule | Value |
|---|---|
| Maximum active trusted devices per account | 2 |
| Primary trusted device | First registered trusted device |
| Adding a third device | Requires removing one existing trusted device |

Requirements:
- The system must enforce the two-device maximum at the persistence layer, not only at the application layer.
- A database-level constraint (or equivalent storage-level check) must prevent more than two records in trusted_devices with current_status = 'trusted' for the same member_id.
- When a member attempts to register a third trusted device, the platform must present a device management screen requiring the member to explicitly remove one existing trusted device before proceeding.
- Members must be able to view all active trusted devices at any time and remove any device.

### 4.2 New Trusted Device Registration

Adding a new trusted device is a high-risk action requiring all of the following steps in sequence:

1. Provide current password.
2. Complete active MFA challenge.
3. Complete device verification (device fingerprint capture, platform authenticator binding if WebAuthn, and out-of-band confirmation to existing trusted device or registered email/phone).
4. If the account already has two trusted devices, explicitly remove one existing device before the new device is added.
5. Record audit event with all device and actor metadata.

The device registration flow must be resistant to device-swapping attacks (where a malicious actor replaces a trusted device without the member's knowledge).

### 4.3 Trusted Device Data Model

Each trusted device record must capture:

| Field | Description |
|---|---|
| device_id | Stable, unique device identifier (UUID) |
| member_id | Owning member |
| device_name | Human-readable device name (member-assigned or auto-detected) |
| device_type | Enum: mobile, desktop, tablet, hardware_key |
| operating_system | OS name and version |
| browser | Browser name and version (if applicable) |
| ip_address | IP address at time of trust registration |
| location | Geographic location derived from IP (city, country) stored as JSONB |
| trust_date | Timestamp when device was trusted |
| last_active | Last time device was used for an authenticated action |
| current_status | Enum: trusted, removed, suspended |
| removed_date | Timestamp when device was removed (nullable) |
| removal_reason | Enum: member_request, admin_action, policy_violation, automatic_rotation |
| approval_method | Enum: password_mfa, admin_approval, out_of_band |
| audit_reference_id | Foreign key to audit_events for the registration event |

Requirements:
- Trusted device records must never be deleted; removed devices must be retained with current_status = 'removed' and a non-null removed_date.
- Every status change to a trusted device record must generate an immutable audit event.
- The trusted device history must be accessible to the member through the security settings surface and to security administrators through the security dashboard.

---

## 5. Data Protection

### 5.1 Encryption in Transit

- All data in transit between clients and platform services must use TLS 1.3.
- TLS 1.2 is permitted only for connections to legacy external services (e.g., banking network partners) that do not yet support TLS 1.3; every such exception must be documented and reviewed annually.
- Internal service-to-service traffic within the VPC must also be TLS-encrypted; mTLS is required for sensitive internal communications.
- Certificate management must use automated renewal (e.g., ACM, Let's Encrypt, or equivalent); certificate expiry monitoring must be active with alerting at 30 and 7 days before expiry.
- HSTS (HTTP Strict Transport Security) with a minimum max-age of 31536000 (one year) and includeSubDomains must be enforced on all production domains.

### 5.2 Encryption at Rest

- All data at rest in PostgreSQL must be protected by Transparent Data Encryption (TDE) or equivalent storage-level encryption at the hosting provider level.
- In addition to TDE, sensitive fields must use column-level or field-level application-layer encryption for defense in depth (see 5.3).
- All S3-compatible object storage must enable server-side encryption with customer-managed keys (SSE-KMS).
- Redis data at rest must be encrypted; use encrypted EBS/NVMe volumes or Redis in-transit and at-rest encryption features.
- Backups (PostgreSQL WAL archives, daily snapshots) must be encrypted with the same key hierarchy as the primary data.

### 5.3 Field-Level Encryption

The following data categories require field-level encryption independent of storage-level TDE:

| Data Category | Examples | Key Tier |
|---|---|---|
| Payment card data | PAN tokens, CVV references | PCI key hierarchy |
| Government IDs | SSN, passport number, tax ID | PII key hierarchy |
| Financial account numbers | Routing/account numbers | PII/PCI key hierarchy |
| Biometric data | Facial recognition embeddings, fingerprint hashes | Biometric key hierarchy |
| Health or sensitive personal data | Income documentation content | PII key hierarchy |
| Cryptographic wallet keys | References to HSM-managed keys only | HSM |

Requirements:
- Field-level encryption uses envelope encryption: a data encryption key (DEK) encrypts the field; a key encryption key (KEK) stored in the KMS encrypts the DEK.
- No plaintext PAN, SSN, or government ID number may exist in any database table, log, or analytics pipeline.
- Card PANs must be tokenized using an approved tokenization service before storage; the platform stores only the token and the last four digits for display purposes.

### 5.4 Tokenization

- Card PANs are tokenized before persistence using a PCI DSS-compliant tokenization service or network token (Visa Token Service, Mastercard Digital Enablement Service).
- ACH account and routing numbers received from members are stored only in encrypted form; they must not appear in any log, event, or analytics payload.
- When returning financial data in API responses, services must return tokens or masked values (e.g., last four digits) unless the endpoint is specifically privileged and the caller holds the appropriate decryption scope.

### 5.5 Key Management

- All cryptographic keys must be managed by an approved Key Management Service (KMS): AWS KMS, HashiCorp Vault, or equivalent HSM-backed solution.
- Key hierarchy:
  - Root keys: managed exclusively by the KMS; never leave the KMS in plaintext.
  - Key Encryption Keys (KEK): derived from root keys; rotated annually or on suspected compromise.
  - Data Encryption Keys (DEK): unique per data object or field; rotated per data retention policy.
- Key rotation requirements by data tier:

| Key Type | Rotation Frequency |
|---|---|
| Root KMS keys | Annually (automatic via KMS policy) |
| KEKs for PCI data | 12 months maximum |
| KEKs for PII data | 24 months maximum |
| DEKs for individual records | On rotation of parent KEK or on data archival |

- Access to KMS management operations is restricted to the Security Administration role; every key operation is logged.

### 5.6 Data Retention and Purge

| Data Type | Retention | Action after Retention |
|---|---|---|
| Transaction records | 7 years | Archive to cold storage (S3 Glacier or equivalent); retain metadata |
| Audit logs | 7 years minimum | Archive to WORM-compliant storage |
| Member PII (active members) | Indefinite while account active | Redact/pseudonymize on account closure per GDPR/CCPA |
| Member PII (closed accounts) | 7 years after closure | Purge or pseudonymize after retention window |
| Chat messages | 3 years (configurable) | Archive; member may request deletion subject to legal hold |
| Chat media (photos, video) | 1 year (configurable) | Purge from object storage; message record retained with attachment metadata |
| AI conversation history | 1 year | Purge; AI memory/embeddings must also be deleted |
| Session records | 30 days after expiry | Purge from Redis; summarized access log retained in audit |
| Application logs containing PII | 90 days | Purge; structured events (no PII) retained in audit logs |

Requirements:
- PII must never appear in unstructured logs, metrics labels, error messages, or tracing spans.
- Retention schedules must be implemented by automated lifecycle policies, not manual processes.
- Legal hold capability must override retention schedules; the platform must support flagging specific records for legal hold.

---

## 6. Secrets Management

### 6.1 Approved Secrets Stores

All secrets (API keys, database credentials, service account tokens, encryption keys, certificates) must be stored exclusively in one of the following approved secrets managers:

- HashiCorp Vault (self-hosted or HCP Vault)
- AWS Secrets Manager
- AWS Systems Manager Parameter Store (for non-sensitive configuration; not for secrets)

Prohibited patterns:
- No secrets in source code, committed files, environment variable files (.env), or documentation.
- No secrets in CI/CD workflow definitions in plaintext; use GitHub Actions secrets or Vault agent injection.
- No secrets in container images, build artifacts, or container registries.
- No secrets in application logs, error messages, tracing spans, or API responses.

### 6.2 Secret Injection

- Secrets are injected into runtime environments via:
  - Vault Agent Sidecar or Init Container for Kubernetes workloads.
  - AWS IAM roles with instance metadata for EC2/ECS workloads.
  - GitHub Actions secrets for CI/CD pipelines.
- Applications must read secrets at startup from environment variables sourced from the secrets manager; secrets must not be cached beyond the startup lifecycle without a documented rotation strategy.
- Rotation of a secret must not require application downtime; services must handle graceful reload of rotated credentials.

### 6.3 Secret Scanning

- CI must include secret scanning at push time using an approved scanner (e.g., GitGuardian, TruffleHog, GitHub secret scanning).
- High-confidence secret detections block merges to main.
- Any secret detected in a commit, even if subsequently reverted, must be treated as compromised; the secret must be rotated immediately and an incident documented.

---

## 7. Payment Security

### 7.1 General Payment Security Requirements

- All payment initiation endpoints (ACH, domestic wire, international wire, Zelle, crypto, card transactions) require fresh authentication (see Section 3.2) before accepting a transaction.
- Payment instructions must be persisted before being sent to payment networks; the persisted record is the audit trail.
- All payment workflows must implement idempotency keys to prevent duplicate submissions.
- Payment amounts, beneficiaries, and routing details are validated at submission, at the gateway, and at the payment service; no single validation point is sufficient.

### 7.2 Payment Method Security Requirements

#### ACH

- NACHA formatting rules and validation must be enforced before submission.
- ACH debit authorization records must be stored and associated with the authorizing member session.
- Same-day ACH and forward ACH limits must be enforced per member account tier and configurable by operations.
- OFAC/sanctions screening must occur before any ACH instruction is submitted.

#### Domestic Wire

- Routing number and account number validation (ABA check digit) must be performed.
- Beneficiary information must be confirmed by the member on a pre-submit confirmation screen.
- Step-up authentication (password + MFA) required on every domestic wire regardless of session state.
- Wire instructions above a configurable threshold require dual-approval by an authorized second party.

#### International Wire

- SWIFT BIC/IBAN validation must be performed for all international wire beneficiaries.
- OFAC/sanctions screening and correspondent bank rules must be applied.
- Step-up authentication required on every international wire.
- Currency conversion rates must be displayed and confirmed before submission; rates are locked for a defined window (e.g., 30 seconds) after confirmation.
- Regulatory reporting obligations (e.g., FinCEN CTR for transactions above $10,000) must be triggered automatically.

#### Zelle

- Zelle recipient enrollment requires confirmation via a token sent to the recipient's registered email or phone.
- Step-up authentication required on first Zelle send to any new recipient and on any Zelle send above a configurable limit.
- Zelle fraud detection rules must be applied; suspicious transactions must be queued for review.

#### Crypto

- Cryptocurrency withdrawal requires step-up authentication on every transaction regardless of amount.
- Withdrawal addresses must be whitelisted; adding a new withdrawal address requires step-up authentication and a time-delayed confirmation (e.g., 24-hour holding period for new addresses).
- Private keys are never held or processed by VANTORIS application services; custody is delegated to a qualified custodian or HSM-backed custody service.
- Blockchain transaction broadcasts must be idempotent (transaction hash tracking).

#### Cards

- Card number (PAN) is never stored in plaintext; only token and last four digits.
- Virtual card numbers for single-use or merchant-locked use are supported.
- Card controls (spending limits, merchant category restrictions, geographic restrictions, card lock) are enforced at the card service level and require authentication to change.
- Card PIN changes require step-up authentication and are never exposed in API responses.
- 3D Secure (3DS2) is required for card-not-present transactions above a configurable threshold.

### 7.3 Transaction Monitoring

- Real-time fraud scoring must be applied to all payment transactions.
- Transactions flagged as high-risk are queued for review; the submitting member is notified.
- Velocity checks must be implemented: limits on number and aggregate value of transactions per time window per member.
- AML transaction monitoring must run independently of fraud detection; suspicious activity reports (SARs) must be generated through the compliance workflow.

---

## 8. AI Security

### 8.1 Permission-Aware AI

All AI-driven actions in VANTORIS (via the AI Command Center, Member Advisor, or any AI-powered workflow) are gated by permission descriptors.

Requirements:
- Every AI action definition stored in libs/ai/actions/ and libs/ai/permissions/ must include a required_permissions field listing the permission keys the calling identity must hold.
- The AI service must validate the calling member's permissions before invoking any action; a permission check failure must result in the action being omitted from the action catalog for that caller.
- The UI must only display AI actions the current member is authorized to perform; this is advisory. The backend must independently enforce the same permission check.
- AI agents operating as service accounts (ai_agent role) must be granted the minimum required permissions for their workflow and must not be granted elevated permissions to compensate for missing member permissions.

### 8.2 AI Action Authorization

- AI-initiated financial actions (e.g., initiating a transfer on behalf of a member) require explicit member confirmation with the same step-up authentication that would be required if the member performed the action directly.
- AI actions that modify account settings, verification state, or security configuration are prohibited without explicit member confirmation.
- Autonomous AI workflows that chain multiple financial actions must obtain a single explicit authorization per workflow run; the authorization event is recorded with the workflow_id, all constituent actions, and the full authorization context.

### 8.3 Prompt Protection

- System prompts and instruction templates must not contain secrets, PII, or internal system information that should not be disclosed to members.
- Prompt injection attacks must be mitigated: user-supplied input must be treated as untrusted data and must not be concatenated directly into system instructions.
- AI conversations must be sandboxed; a conversation cannot access data or tools outside the permissions granted to the requesting member.
- Prompt templates must be versioned (stored in libs/ai/prompts/); changes to prompts that affect member-facing behavior are treated as product changes requiring documentation and testing evidence.

### 8.4 Memory Isolation

- AI memory namespaces are strictly isolated per member: no AI memory object belonging to one member can be read by or leaked to another member's conversation context.
- AI memory stored in the database (ai_memory table) must include an owner_id and a namespace field; queries against ai_memory must always filter by owner_id.
- Long-term AI memory stored as vector embeddings must be indexed with member-scoped access keys; vector similarity searches must be restricted to the calling member's embedding namespace.

### 8.5 Conversation Isolation

- Each AI conversation session belongs to exactly one member.
- Members cannot access another member's conversation history, summaries, or context objects.
- Operator access to member AI conversations is permitted only for legitimate support purposes with the member's consent or under a legal process; every such access is logged as an audit event.
- AI conversations are retained per the retention schedule in Section 5.6.

### 8.6 Tool and Workflow Permissions

- AI tools (executable functions available to the AI model) must be registered as named capabilities with associated permission keys.
- Tools that interact with financial data or perform mutations must require the ai_agent service account to hold the corresponding member-delegated permission.
- Workflow definitions must enumerate every tool they may invoke; the workflow authorization check must validate permissions for all tools in the workflow before execution begins.

### 8.7 AI Audit Logging

Every AI action must produce an immutable audit event. The audit payload for AI actions must include:

| Field | Description |
|---|---|
| actor_id | member_id of the member whose context triggered the action |
| ai_agent_id | identifier of the AI service account |
| session_id | session_id of the originating session |
| device_id | device_id of the originating device |
| conversation_id | ai_conversations.id of the triggering conversation |
| action_id | ai_actions.id |
| workflow_id | ai_workflows.id (if applicable) |
| prompt_template_id | ai_prompts.id (versioned) |
| inputs | sanitized action inputs (no secrets or sensitive values) |
| outputs | sanitized action outputs |
| permissions_checked | list of permission keys evaluated |
| authorization_result | granted or denied |
| correlation_id | X-Correlation-ID from the originating request |
| trace_id | distributed trace id |
| timestamp | UTC ISO 8601 |

---

## 9. Chat Security

### 9.1 Message Security

- All chat messages and attachments are encrypted in transit (TLS 1.3) and at rest (field-level encryption for message body; SSE-KMS for object storage attachments).
- Message contents are stored in the VANTORIS database; binary media (photos, videos, voice notes, documents) are stored in S3-compatible object storage.
- Messages must be associated with a conversation_id and sender_id; these associations cannot be forged.

### 9.2 Media Security

Media uploaded via chat (photos, videos, voice notes, documents) must follow these security controls:

| Control | Requirement |
|---|---|
| Upload mechanism | Presigned PUT URLs; media does not pass through application servers |
| File type validation | Server-side MIME type validation after upload; client-declared content-type is advisory only |
| Malware scanning | Asynchronous malware and ransomware scan before message delivery; message held in pending moderation state until scan completes |
| PII detection | Asynchronous PII detection scan for documents and images; flagged content is quarantined pending review |
| File size limits | Maximum file sizes enforced per media type (configurable by platform operators) |
| Signed URLs for retrieval | Media is never served via public URL; retrieval uses time-limited signed URLs authenticated to the requesting session |
| Encryption at rest | S3 SSE-KMS; content hash stored in DB for integrity verification |

### 9.3 AI Summaries

AI-generated summaries of chat conversations are subject to the same access controls as the underlying conversation. A member can access the AI summary of their own conversations; operators may access summaries only under the same conditions as accessing the conversation itself (see Section 8.5).

### 9.4 Retention and Deletion

- Chat messages: retained per the schedule in Section 5.6 (default 3 years).
- Media attachments: retained per the schedule in Section 5.6 (default 1 year); after retention expiry, the binary is purged from object storage and the attachment record in the database is marked purged.
- Members may request deletion of their own chat history; deletion requests are honored within the legal hold constraints.
- Deletion of a message must also delete associated AI summaries that derive from that message.

### 9.5 Access Controls

- Chat participants are enforced at the conversation level; a member cannot read messages in a conversation they are not a participant of.
- Internal chat between members and operators (e.g., support chats) must enforce role-based access on the operator side.
- Third-party channel integrations (WhatsApp Business, Instagram) must not expose VANTORIS internal message IDs or conversation IDs to the external platform.

---

## 10. Verification Center Security

The Verification Center replaces all generic KYC endpoints and is the single surface for identity, address, income, business, email, phone, and trusted-device verification.

### 10.1 Verification Flow Security

Each verification type has specific security requirements:

#### Email Verification
- OTP sent to the registered email address via a secure transactional email provider.
- OTP validity window: 10 minutes; single-use.
- Rate limit: maximum 3 OTP requests per 30 minutes per email address.
- Email address changes require re-verification; the change is treated as a high-risk action (Section 3.2).

#### Phone Verification
- OTP delivered via SMS or voice call to the registered phone number.
- OTP validity window: 5 minutes; single-use.
- Rate limit: maximum 3 OTP requests per 30 minutes per phone number.
- Phone number changes require re-verification; treated as high-risk action.
- Phone numbers must be validated as callable/deliverable before OTP dispatch.

#### Identity Verification
- Identity documents (passport, driver's license, national ID) must be uploaded via a liveness-checked biometric flow.
- Document images are processed by an approved identity verification provider (Socure, Jumio, Onfido, or equivalent).
- Document images and biometric data are retained only for the period required by applicable law; they must not be used for any purpose other than the stated verification.
- Identity verification results are stored in verification_requests with the provider's result as provider_payload JSONB.

#### Address Verification
- Address verification may be completed via document upload (utility bill, bank statement, government letter) or via a third-party address verification service.
- Uploaded documents are subject to the same malware and PII scanning requirements as chat media (Section 9.2).

#### Income Verification
- Income documents (pay stubs, tax returns, bank statements) are sensitive PII; they must be encrypted at rest using the PII key hierarchy (Section 5.3).
- Access to income verification documents is restricted to the member and authorized compliance/verification personnel; every access is audited.

#### Business Verification
- Business verification (UBO disclosure, articles of incorporation, business licenses) requires collection of beneficial ownership information.
- UBO information is subject to AML regulatory requirements and must be retained per the transaction record retention schedule (7 years).

#### Trusted Device Verification
- Trusted device verification is the device registration flow described in Section 4.2.
- Device verification must confirm physical possession of the device through a platform authenticator challenge or an out-of-band OTP.

### 10.2 Verification State Machine

All verification requests follow a canonical state machine:

| State | Description |
|---|---|
| Unverified | No verification initiated |
| IdentitySubmitted | Member has submitted documents; awaiting review |
| UnderReview | Active review by provider or internal compliance team |
| Verified | Verification successfully completed |
| Failed | Verification failed; member may retry subject to rate limits |

State transitions are audited; no state may be set directly by the member (states are set by service layer after provider callbacks or internal review).

---

## 11. Personalization and Display Name Security

### 11.1 Required Profile Fields

Every member profile must include the following name fields:

| Field | Required | Description |
|---|---|---|
| first_name | Required | Member's legal first name |
| middle_name | Optional | Member's legal middle name |
| last_name | Required | Member's legal last name |
| preferred_name | Optional | Member-chosen display name |

### 11.2 Display Name Priority

The platform must apply the following priority order for display names and greetings:

1. Preferred Name (if present and non-empty)
2. First Name (if Preferred Name is absent)
3. First Name + Last Name (for formal contexts where full name is appropriate)

Requirements:
- A member's email address or email username prefix must never be used as a greeting, display name, or fallback name in any surface (UI, notification, email template, AI response, chat).
- The greeting utility (libs/utils/greeting or equivalent) must implement and enforce this priority logic; all UI components must use the greeting utility rather than constructing display names independently.
- The greeting and display name logic must be covered by unit tests that explicitly assert that email-derived strings are never returned.

### 11.3 Legal Name Usage

The member's complete legal name (First Name + Middle Name (if present) + Last Name) must be used in the following contexts:

- Identity verification submissions
- KYC and AML compliance documentation
- Account statements and official account documents
- Contracts and legal agreements
- Regulatory reports and filings
- Any third-party submission requiring legal identity

Legal name fields must never be editable by the member without triggering a re-verification flow.

### 11.4 Name Data Security

- Name fields are PII and must be treated as such for retention, redaction, and encryption purposes.
- Name fields must not appear in application logs, tracing spans, or error messages.
- API list endpoints must apply PII minimization: name fields are omitted from bulk list responses unless explicitly required by the use case.

---

## 12. Audit and Observability

### 12.1 Immutable Audit Records

All security-sensitive actions must generate immutable audit records. The audit log is append-only; no record may be edited or deleted.

Security-sensitive actions include (non-exhaustive):

- Authentication events: login success, login failure, logout, MFA challenge, MFA failure, session creation, session termination.
- Trusted device events: device registration, device removal, device status change.
- Payment events: payment initiation, payment approval, payment failure, payment reversal.
- Account events: account creation, account closure, account status change, beneficiary changes.
- Security settings events: password change, MFA enrollment/removal, permission grant/revoke.
- Verification events: verification submission, status change, provider callback.
- AI action events: AI action invocation, AI workflow execution, AI permission evaluation.
- Administrative events: role assignment, configuration change, operator access to member data.
- Data access events: access to sensitive documents, audit log access.

### 12.2 Audit Event Schema

Every audit event must include the following fields:

| Field | Type | Description |
|---|---|---|
| id | UUID | Unique event identifier |
| actor_id | UUID | Identifier of the entity performing the action (member_id, operator_id, service_id) |
| user_id | UUID | Identifier of the member whose data is affected (may differ from actor_id for operator actions) |
| session_id | UUID | Session identifier at the time of the action |
| device_id | UUID | Trusted device identifier at the time of the action |
| correlation_id | UUID | X-Correlation-ID propagated through the entire request chain |
| trace_id | string | Distributed trace identifier (W3C traceparent format recommended) |
| action | string | Machine-readable action identifier (e.g., payment.ach.initiated, auth.mfa.enrolled) |
| resource_type | string | Type of resource affected (e.g., account, trusted_device, ai_action) |
| resource_id | UUID | Identifier of the affected resource |
| before_state | JSONB | State of the resource before the action (redacted for PCI/PII fields) |
| after_state | JSONB | State of the resource after the action (redacted for PCI/PII fields) |
| ip_address | string | IP address of the requesting client |
| location | JSONB | Geographic location derived from IP (city, country, region) |
| timestamp | timestamptz | UTC timestamp of the event |
| source_service | string | Name and version of the service that generated the event |
| risk_score | decimal | Optional; risk score assigned at the time of the action |
| outcome | string | Enum: success, failure, denied |

### 12.3 Audit Log Integrity

- Audit events are written to a write-once, append-only table in the primary database.
- Audit events must also be streamed to a secondary immutable event store (Kafka topic with retention configured to meet the 7-year minimum; or a WORM-compliant archive such as AWS S3 Object Lock).
- Hash chaining or log signing (e.g., each event includes the hash of the previous event) is recommended for tamper detection; implementation is deferred to the production engineering phase.
- Access to the audit log for read purposes is restricted to the security_admin role and auditors; such access is itself logged.
- No application code may issue an UPDATE or DELETE against the audit_events table; this is enforced at the database privilege level.

### 12.4 Correlation and Tracing

- Every inbound request at the API gateway must be assigned a unique correlation_id if one is not provided; the gateway injects X-Correlation-ID into the request before forwarding to services.
- Services must propagate the correlation_id and trace context (traceparent) through all downstream calls, database writes, and event publications.
- Structured application logs must always include correlation_id and trace_id; never include PII.
- Audit events and application logs are linkable via correlation_id, enabling end-to-end traceability for compliance investigations.

---

## 13. Compliance

### 13.1 PCI DSS

- Card data handling must comply with PCI DSS Level 1 requirements (or the applicable level based on transaction volume).
- PANs are tokenized using a PCI-compliant tokenization service; the VANTORIS application is never in the path of plaintext PAN data post-tokenization.
- The cardholder data environment (CDE) is segmented from non-card systems using network controls.
- Annual PCI DSS assessments and quarterly vulnerability scans are required.
- Evidence of PCI compliance (Attestation of Compliance) must be maintained.

### 13.2 SOC 2

- VANTORIS targets SOC 2 Type II compliance covering Security, Availability, Processing Integrity, Confidentiality, and Privacy trust service criteria.
- Controls documented in this standards document (access management, encryption, audit logging, incident response, change management) directly map to SOC 2 control objectives.
- Annual SOC 2 audits are required; interim period reviews are recommended.

### 13.3 GDPR

- Members in the European Economic Area (EEA) have rights under GDPR: right of access, right to rectification, right to erasure, right to data portability, right to restrict processing, and right to object.
- A data processing inventory (ROPA — Record of Processing Activities) must be maintained.
- Consent management must be implemented for processing activities that rely on consent as the legal basis.
- Data breaches affecting EEA residents must be reported to the applicable supervisory authority within 72 hours of discovery.
- Cross-border data transfers outside the EEA must be covered by approved transfer mechanisms (Standard Contractual Clauses, adequacy decision, or equivalent).

### 13.4 CCPA / CPRA

- Members who are California residents have rights under CCPA/CPRA including rights to know, delete, correct, and opt out of sale/sharing of personal information.
- Privacy notices must disclose all categories of personal information collected and the purposes of processing.

### 13.5 AML and KYC

- All member onboarding must complete KYC verification through the Verification Center before financial operations are permitted.
- AML transaction monitoring must be active on all payment channels; suspicious activity reports (SARs) must be filed with FinCEN (or applicable regulator) per regulatory requirements.
- OFAC/sanctions screening must run at account opening and on an ongoing basis; positive matches must be escalated to compliance personnel immediately.
- Customer Due Diligence (CDD) and Enhanced Due Diligence (EDD) processes must be documented and auditable.
- Currency Transaction Reports (CTRs) must be generated automatically for qualifying transactions.

### 13.6 Data Residency

- Primary data residency is the United States; cross-region replication for DR purposes must comply with applicable data residency requirements.
- Where members are located in jurisdictions with specific data residency requirements, the platform must implement appropriate data routing and storage controls.

---

## 14. Incident Response

### 14.1 Incident Classification

| Severity | Description | Examples |
|---|---|---|
| P0 (Critical) | Active breach, data exfiltration, financial fraud in progress | Unauthorized account access, payment fraud, secret compromise |
| P1 (High) | Potential breach, production security control failure | Authentication bypass, audit log tampering, unencrypted PII exposure |
| P2 (Medium) | Security misconfiguration, vulnerability with potential impact | Overly permissive access, unpatched high-severity CVE |
| P3 (Low) | Security improvement opportunity | Weak password policy, suboptimal logging configuration |

### 14.2 Response Procedures

- P0 Incidents: immediate response; on-call security engineer paged within 5 minutes; incident commander assigned; containment actions begin within 15 minutes.
- P1 Incidents: response team assembled within 30 minutes; containment actions begin within 1 hour.
- P2 Incidents: triaged within 24 hours; remediation scheduled within 7 days.
- P3 Incidents: triaged within 5 business days; remediation scheduled within 30 days.

### 14.3 Breach Notification

- GDPR regulatory notification: within 72 hours of discovery for breaches affecting EEA residents.
- Member notification: within the legally required period for the applicable jurisdiction; VANTORIS targets notification within 72 hours as a default.
- Payment network notification: per card network and payment rail rules for card or payment data breaches.
- Incident records must be retained for a minimum of 3 years.

### 14.4 Secret Compromise Response

- Any detected or suspected secret compromise must be treated as a P0 incident.
- The compromised secret must be rotated immediately.
- All sessions and tokens issued using the compromised secret must be invalidated.
- The compromise event must be recorded in the audit log and a post-incident review conducted.

---

## 15. Base44 Migration Compatibility

### 15.1 Migration Security Requirements

The Base44 migration must not weaken existing security controls. Specific requirements:

- No plaintext secrets may be introduced into the repository or any migration artifact.
- All imported schemas must be reviewed for unencrypted PII or financial fields; any such fields must be encrypted before the migration is considered complete.
- The migration import PR must include a security review sign-off from a security_admin role holder.
- Post-import, the audit log must be populated with a migration event recording the import timestamp, source system, and responsible actor.

### 15.2 Schema Compatibility

- Trusted device logic (maximum two active devices per account) must be enforced in the imported schema from day one; no migration state may have more than two active trusted devices per member_id.
- The member_profile table must include first_name, last_name, preferred_name fields; if the Base44 schema uses a single name or email-derived field, the migration plan must include a data transformation step to populate the correct fields.
- Audit tables from the Base44 system must be imported into the audit_events schema; they must not be discarded.

### 15.3 Post-Import Security Validation

Before the Base44 import PR is merged to main, the following security validations must be completed:

- Secret scan passes with zero findings.
- All PII fields verified to be encrypted or scheduled for encryption in the first production sprint.
- RBAC roles and permissions mapped from Base44 to the VANTORIS role model.
- Session security model (inactivity timeouts, device limits) verified to be configured and active in staging.
- Audit logging verified to be producing events for at least authentication and payment actions in the staging environment.

---

## 16. Cross-References

| Document | Relationship |
|---|---|
| docs/ARCHITECTURE.md | Security layer and architectural boundaries |
| docs/COMPONENT_ARCHITECTURE.md | Frontend security patterns and permission gating |
| docs/REPOSITORY_STRUCTURE.md | Location of security configs, secrets, AI permission definitions |
| docs/REPOSITORY_STANDARDS.md | AI Command Center permission requirements, trusted device rules, personalization rules |
| docs/CODING_STANDARDS.md | Permission gating in code, greeting utilities, TypeScript security patterns |
| docs/CI_CD.md | Security gates in CI, secret scanning, CodeQL, SCA |
| docs/API_ARCHITECTURE.md | API security headers, audit event emission, token scopes |
| docs/DATABASE_ARCHITECTURE.md | Encryption at rest, audit table schema, trusted device schema, session model |
| docs/VERIFICATION_CENTER.md | Verification flow details and third-party provider integration (to be created) |
| docs/MIGRATION_GUIDE.md | Base44 import security checklist (to be created) |

---

## Dependencies and Gaps Discovered

The following items are referenced by this document but not yet present in the repository or require further decisions:

1. KMS provider selection — AWS KMS and HashiCorp Vault are both listed as approved options; a definitive infrastructure decision is needed before the Base44 import to allow key hierarchy provisioning.
2. Tokenization service — A PCI DSS-compliant tokenization service (network token service or vault-based tokenization) must be selected and integrated; this decision gates card and ACH production readiness.
3. Identity verification provider — Socure, Jumio, Onfido, and equivalents are listed; a contractual agreement with an approved provider must be in place before onboarding can go live.
4. WORM storage for audit archives — A provider decision for immutable audit archive storage (AWS S3 Object Lock, Azure Immutable Storage, or equivalent) is required.
5. docs/VERIFICATION_CENTER.md — Vendor integration details, workflow diagrams, and test double specifications for CI are not yet written.
6. docs/MIGRATION_GUIDE.md — Base44 schema mapping, ID transformation, and security-specific migration steps are not yet written.
7. Threat detection and SIEM — A security information and event management (SIEM) platform or log analysis service (e.g., Splunk, Datadog Security, Elastic SIEM) must be selected for audit log ingestion and real-time alerting.
8. Penetration testing schedule — Annual penetration testing is required (Section 1); a provider and schedule must be defined.
9. Hash chaining for audit logs — Recommended in Section 12.3 but deferred; an implementation decision is needed for the first production engineering sprint.

---

## Remaining Documentation

The following documents are planned and not yet created:

- docs/VERIFICATION_CENTER.md
- docs/MIGRATION_GUIDE.md
- docs/AUTHENTICATION.md (detailed auth flow diagrams and token lifecycle)
- docs/RBAC.md (role definitions and permission matrix)
- docs/TESTING.md (test strategy and security test requirements)
- docs/DOCUMENTATION_STANDARDS.md
- docs/DESIGN_SYSTEM.md

---

## Recommendations Before the Next Document

1. Confirm KMS provider (AWS KMS vs Vault) so that docs/AUTHENTICATION.md and docs/MIGRATION_GUIDE.md can reference the concrete key management architecture.
2. Confirm tokenization service so that card and payment documentation can reference the specific integration.
3. Author docs/VERIFICATION_CENTER.md next — it is the highest-priority remaining document because it defines critical member onboarding requirements referenced by API_ARCHITECTURE, DATABASE_ARCHITECTURE, and this security document.
4. Author docs/RBAC.md after VERIFICATION_CENTER.md — the complete role and permission matrix is needed before implementation begins so that AI permission descriptors, service account scopes, and operator role definitions are consistent across all services.
5. Author docs/AUTHENTICATION.md to complement this document with detailed OAuth2/OIDC flow diagrams, token lifecycle, refresh rotation, and biometric auth integration.
6. Begin drafting docs/MIGRATION_GUIDE.md to capture the security-specific steps identified in Section 15 of this document before the Base44 import occurs.

---

Files created by this commit
- docs/SECURITY_STANDARDS.md

This is a documentation-only commit. No application code, infrastructure code, or SQL migrations were generated.
