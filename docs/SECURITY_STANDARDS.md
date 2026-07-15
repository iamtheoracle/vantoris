# Security Standards — VANTORIS

Status: normative documentation-only. This document is the platform-wide security standard for VANTORIS. It is compatible with the Base44 migration and must be followed by every contributor and AI agent. No application or infrastructure code is generated here. After the Base44 export is imported, these standards become enforceable requirements and must be reflected in code, configuration, and CI gates.

---

## Table of Contents

1. [Security Architecture Principles](#1-security-architecture-principles)
2. [Identity and Access Management](#2-identity-and-access-management)
3. [Data Protection](#3-data-protection)
4. [Audit Logging](#4-audit-logging)
5. [Payment Security](#5-payment-security)
6. [Session Security](#6-session-security)
7. [AI Security](#7-ai-security)
8. [Chat Security](#8-chat-security)
9. [Verification Center Security](#9-verification-center-security)
10. [Compliance Guidance](#10-compliance-guidance)
11. [Secrets Management](#11-secrets-management)
12. [Incident Response](#12-incident-response)
13. [Cross-References](#13-cross-references)
14. [Gaps and Dependencies](#14-gaps-and-dependencies)
15. [Remaining Documentation](#15-remaining-documentation)
16. [Recommendations Before Next Document](#16-recommendations-before-next-document)

---

## 1. Security Architecture Principles

### 1.1 Zero Trust

VANTORIS applies a Zero Trust security model across every layer of the platform.

- Assume breach: every request — whether from an external client, a service-to-service call, or an internal AI agent — is treated as potentially hostile.
- Verify explicitly: authentication and authorization are enforced at every boundary (gateway, service, database, AI action, file access). See docs/ARCHITECTURE.md §Security & Compliance Layer.
- Least privilege access: identities (members, operators, AI agents, service accounts) are granted only the minimum permissions required to perform their function.
- No implicit trust based on network location: internal services must use mTLS or signed JWTs for mutual authentication; VPC membership alone does not grant access.
- Continuous validation: tokens are short-lived, session state is regularly revalidated, and device trust is revoked when anomalies are detected.

### 1.2 Defense in Depth

Multiple, independent security controls are layered so that the failure of any single control does not expose member data or enable unauthorized financial actions.

Layer 1 — Network: VPC with security groups, Web Application Firewall (WAF), DDoS protection, and IP-based rate limiting at the network edge.

Layer 2 — API Gateway: token validation, RBAC enforcement hints, request signing, correlation header injection, rate limiting, and input sanitization. See docs/API_ARCHITECTURE.md §API Gateway & Edge.

Layer 3 — Application: server-side authorization checks on every privileged endpoint (never rely on frontend visibility alone); input validation and output encoding; dependency scanning and SAST in CI. See docs/CODING_STANDARDS.md §Permission Gating.

Layer 4 — Data: encryption at rest (TDE and field-level), encryption in transit (TLS 1.3), tokenization for PCI-sensitive data, row-level security in Postgres, and backup encryption. See docs/DATABASE_ARCHITECTURE.md §Encryption & key management.

Layer 5 — Audit and Detection: immutable audit logs, behavioral anomaly detection, SIEM integration, alerting on suspicious patterns. See Section 4 of this document.

### 1.3 Least Privilege

- Members are granted only the account access they own or are explicitly authorized to access (joint accounts, beneficiaries).
- Operations and Executive roles are scoped to their functional area; no role grants access to financial account balances without explicit justification.
- AI agents and AI actions operate under per-action permission descriptors stored in libs/ai/permissions. An AI agent may not invoke an action for which the calling member lacks authorization.
- Service accounts use narrow-scope OAuth client credentials; credentials are rotated on a schedule and stored in the secret management system (not in source code).
- Database access follows the principle of least privilege: services are granted SELECT/INSERT/UPDATE on only their own schema tables. No service has CREATE/DROP access to production schemas.

---

## 2. Identity and Access Management

### 2.1 OAuth2 and OIDC

- The authorization server issues OAuth2 Authorization Code + PKCE flows for browser and mobile clients.
- OpenID Connect (OIDC) is used for identity federation and SSO across VANTORIS platform surfaces (Member, Operations, Executive, Security dashboards).
- Access tokens are short-lived (15 minutes or less); refresh tokens are rotated on every use and have a configurable absolute expiry (default 30 days for members, 8 hours for operator sessions).
- Service-to-service calls use mTLS or client-credential-grant JWTs; these tokens are never exposed to the browser.
- Token introspection endpoints must be protected and rate-limited.

### 2.2 JWT

- JWT claims must include: sub (user id), iss (issuer), aud (audience), iat, exp, jti (token id), scope, device_id, session_id.
- The jti is tracked for revocation; logout and step-up re-authentication invalidate the jti in the token revocation store (Redis).
- Algorithms: RS256 or ES256 (asymmetric). HS256 is prohibited for external tokens.
- Sensitive PII must not be embedded in JWT payloads (no email, name, SSN in the token).

### 2.3 Multi-Factor Authentication (MFA)

- MFA is required for all member accounts and mandatory for all operator and admin accounts.
- Supported MFA methods (in order of preference):
  1. WebAuthn (passkeys, FIDO2 hardware keys, platform biometrics — Face ID, Touch ID)
  2. TOTP (authenticator apps: Google Authenticator, Authy, etc.)
  3. SMS OTP (fallback only; not recommended as primary due to SIM-swap risk)
  4. Email OTP (secondary fallback)
- SMS OTP is explicitly discouraged for high-risk actions (transfers above threshold, account settings changes, trusted device approval); these actions require WebAuthn or TOTP.
- MFA bypass is not permitted at the application layer. Emergency account recovery must follow a documented administrative procedure with full audit trail.

### 2.4 WebAuthn and Biometrics

- WebAuthn (FIDO2) is the preferred authentication mechanism for member-facing surfaces.
- Platform authenticators (Face ID, Touch ID) are supported; cross-platform authenticators (hardware security keys) are supported for operator accounts.
- WebAuthn credentials are bound to the device; loss of device requires re-verification through Verification Center.
- Biometric data is never transmitted to VANTORIS servers. Only the WebAuthn assertion (a signed challenge) is sent.

### 2.5 Trusted Devices

- Platform defaults to a maximum of two active trusted devices per member account. See docs/DATABASE_ARCHITECTURE.md §Trusted Devices.
- Adding a new trusted device requires explicit approval:
  - Option A: Replace the current trusted device (old device is de-trusted immediately).
  - Option B: Follow an out-of-band approval flow (email MFA + TOTP challenge) to add a second device.
  - Exceeding two trusted devices is blocked at the API level; the member must explicitly remove a device first.
- Trusted device records are soft-deleted (removed_date is set) and never fully purged; they are retained for audit purposes per the retention policy in Section 10.
- Device metadata stored: device_id, device_name, device_type, OS, browser/app version, IP address, approximate location, trust_date, last_active, approval_method, and audit_reference_id. See docs/DATABASE_ARCHITECTURE.md §Trusted Devices schema.
- Anomalous device behavior (new location, unusual user-agent) triggers a re-authentication challenge or an operator alert depending on risk score.

### 2.6 Role-Based Access Control (RBAC)

- RBAC is enforced at the API level for every privileged endpoint. Frontend visibility is advisory only and must never be the sole control.
- Role definitions are maintained as machine-readable descriptors referenced by both the authorization middleware and the AI permission system.
- Core role categories:
  - Member roles: member (self-service), joint_account_holder, beneficiary.
  - Operations roles: operations_agent, operations_manager, fraud_analyst, compliance_officer.
  - Executive roles: executive_viewer, executive_manager.
  - Security roles: security_admin, security_analyst.
  - AI roles: ai_read, ai_execute, ai_admin.
  - System roles: service_account, internal_api.
- RBAC changes (new roles, permission grants) must be documented in a PR, reviewed by a security reviewer listed in OWNERS, and produce an audit event.
- Role assignments are audited: every grant/revoke is recorded in the audit log with actor, target, role, justification, and timestamp.

---

## 3. Data Protection

### 3.1 Encryption in Transit

- All communication between clients and servers uses TLS 1.3. TLS 1.2 is permitted only for legacy third-party integrations where the provider does not yet support TLS 1.3; each exception must be documented and reviewed annually.
- Certificate management: use ACME (Let's Encrypt) or a managed certificate service (AWS ACM). Certificates rotate automatically.
- HTTP Strict Transport Security (HSTS) with a max-age of at least 1 year and includeSubDomains is required.
- Internal service-to-service calls inside the cluster use mTLS via a service mesh (e.g., Istio, Linkerd) or mutual TLS certificate pinning.
- WebSocket connections (real-time chat, AI streaming) must be established over WSS (WebSocket Secure).

### 3.2 Encryption at Rest

- All PostgreSQL data volumes are encrypted using Transparent Data Encryption (TDE) via the cloud provider's managed disk encryption (AWS EBS encryption with KMS-managed keys).
- S3 buckets (media, documents, reports, backups) use server-side encryption (SSE-KMS) with customer-managed keys (CMKs).
- Redis clusters use in-transit and at-rest encryption. Keys are managed by the cloud KMS.
- Backups: database snapshots and WAL archives are encrypted before offsite storage. Refer to docs/DATABASE_ARCHITECTURE.md §Backup & Disaster Recovery.

### 3.3 Field-Level Encryption

- Fields classified as PCI-sensitive, PII-high, or financial-critical are encrypted at the application layer in addition to TDE. Column-level encryption uses envelope encryption: the data key (DEK) is encrypted by a key-encryption key (KEK) stored in KMS.
- PCI-sensitive fields (must be field-encrypted at rest):
  - Card Primary Account Numbers (PANs) — stored as tokens only; raw PANs are never persisted (see Section 3.5 Tokenization).
  - Card security codes (CVV/CVC) — never stored.
  - Full magnetic stripe data — never stored.
- PII-high fields (field-encrypted in DB):
  - Social Security Number / Tax ID (or equivalent national ID).
  - Date of birth.
  - Government-issued document numbers.
  - Biometric reference IDs.
- Financial-critical fields may be stored as encrypted JSONB in column-level ciphertext; services decrypt only when required for a specific operation.

### 3.4 Tokenization

- Card PANs are replaced with opaque tokens (pan_token) before being stored in the database. The tokenization service (or a third-party vault such as a payment network token service) issues and manages tokens.
- Tokens are non-reversible outside the tokenization service. Only the tokenization service holds the mapping; VANTORIS services store and use the token.
- ACH account numbers for external accounts may also be tokenized; routing numbers do not need tokenization.
- Crypto wallet addresses are stored as-is (they are public by design) but must not be associated with PII in exported datasets.

### 3.5 Key Management System (KMS)

- VANTORIS uses a managed KMS (AWS KMS, Google Cloud KMS, or HashiCorp Vault) as the root of trust for all cryptographic keys.
- Key hierarchy:
  - Root Key (managed exclusively by KMS, never exported)
  - Key-Encryption Keys (KEKs) per data domain (members, cards, documents, etc.)
  - Data Encryption Keys (DEKs) per record or per table partition (envelope encryption)
- All DEKs are encrypted under the appropriate KEK. Applications request DEK decryption from KMS via authenticated API calls; they never store unencrypted KEKs in code or config.
- KMS API calls are logged to CloudTrail / KMS audit log; these logs are immutable and retained per the audit retention policy.

### 3.6 Key Rotation

- KEKs rotate at least annually or immediately after a suspected compromise.
- DEKs rotate in place using re-encryption: old ciphertext is decrypted with the old DEK and re-encrypted with the new DEK within the same KMS transaction.
- TLS certificates rotate automatically (ACME) with a validity period of 90 days or less.
- JWT signing keys rotate every 90 days; a 24-hour overlap window allows tokens signed with the previous key to remain valid during the transition.
- Service account credentials rotate every 90 days via automated secret rotation in the secret management system.
- Key rotation is tracked in the audit log (key_id, rotation_date, triggered_by, actor).

### 3.7 Secrets Management

See Section 11 (Secrets Management) for the full policy. Summary:
- Secrets are stored in HashiCorp Vault or AWS Secrets Manager; never in source code, environment variable files committed to Git, or unencrypted configuration files.
- CI/CD pipelines retrieve secrets at runtime via OIDC-authenticated requests to the secret store; secrets are injected as environment variables or files and are never logged.

---

## 4. Audit Logging

### 4.1 Immutable Audit Records

- Every state-changing action on sensitive resources produces an immutable audit event. Audit events are append-only; there is no UPDATE or DELETE on audit_events. See docs/DATABASE_ARCHITECTURE.md §Audit Logs schema.
- Audit logs are forwarded in near-real time to an immutable event store (WORM-compatible storage: AWS S3 Object Lock, or equivalent) in addition to the primary database.
- Integrity verification: audit events are hash-chained (each event includes a hash of the previous event's id + timestamp + payload) to enable tamper detection.

### 4.2 Required Fields on Every Audit Event

Every audit event must include all of the following fields:

| Field | Description |
|---|---|
| id | Unique event identifier (UUID v4) |
| actor_id | ID of the user, service account, or AI agent that performed the action |
| user_id | ID of the authenticated member or operator (may equal actor_id) |
| session_id | Active session ID at time of event |
| device_id | Trusted device ID or client identifier |
| ip_address | Source IP address of the request |
| correlation_id | X-Correlation-ID from the request header; propagated through async systems |
| trace_id | Distributed trace ID (W3C traceparent) for cross-service correlation |
| action | Machine-readable action code (e.g., TRANSFER_INITIATED, DEVICE_TRUSTED, AI_ACTION_EXECUTED) |
| resource_type | Type of resource affected (e.g., account, card, member, ai_action) |
| resource_id | ID of the specific resource affected |
| before_state | JSON snapshot of the resource's state before the action (omit for creates; redact PCI fields) |
| after_state | JSON snapshot of the resource's state after the action (redact PCI fields) |
| timestamp | ISO 8601 UTC timestamp with millisecond precision |
| source_service | Name of the service that generated the event |
| risk_level | Assessed risk level of the action (low, medium, high, critical) |

### 4.3 Actions That Must Produce Audit Events

The following actions must always produce audit events regardless of their outcome (include both successful and failed attempts):

- Authentication events: login, logout, MFA challenge, MFA success, MFA failure, token refresh, token revocation.
- Account events: account created, account suspended, account closed, account ownership changed.
- Financial events: transfer initiated, transfer approved, transfer rejected, transfer reversed; ACH/wire/Zelle/bill-pay instruction created/updated/cancelled; card issued/activated/suspended/revoked; card limits changed; PIN changed.
- Payment events: ACH pull/push, domestic wire, international wire, Zelle, crypto send/receive.
- High-risk operations: step-up authentication triggered, high-risk action approved/rejected, limit override, manual balance adjustment.
- Identity and access events: role granted/revoked, permission descriptor changed, API key created/revoked.
- Device events: trusted device added, trusted device removed, device trust verification requested/approved/rejected.
- Verification events: verification flow initiated, document submitted, verification state change, provider webhook received.
- AI events: AI action invoked, AI workflow started/completed/failed, AI memory written/deleted, prompt template version changed.
- Chat events: message sent (metadata only, not content, unless legally required), message deleted, media uploaded, conversation created/deleted, AI summary generated.
- Security events: suspicious activity flagged, rate limit exceeded, forbidden action attempted, admin privilege used.
- Configuration events: system settings changed, security policy updated, KMS key rotated, secret rotated.

### 4.4 Audit Log Access Controls

- Audit logs are write-accessible only to the audit logging service (system account). No application-layer code has UPDATE or DELETE rights to audit_events.
- Audit log read access is restricted to: compliance officers, security administrators, and automated compliance reporting jobs.
- Audit log queries by operators are themselves audited (query events in a separate meta-audit table).
- Audit log export for external auditors or regulators requires a formal access request process and is logged.

---

## 5. Payment Security

### 5.1 General Payment Controls

- All payment-initiating endpoints require a valid authenticated session with a fresh authentication claim (see Section 6.4).
- Idempotency keys (Idempotency-Key header) are mandatory for all payment write operations to prevent duplicate submissions. See docs/API_ARCHITECTURE.md §Idempotency.
- Amount and beneficiary validation is performed server-side for every payment regardless of what the client sends.
- Velocity limits and cumulative daily/monthly limits are enforced at the server side by the payment service and are not overridable by client input.
- All payment operations produce immutable audit events as specified in Section 4.

### 5.2 ACH

- ACH instructions must include NACHA-compliant fields: routing number, account number (tokenized), SEC code, company name, company description.
- ACH account numbers are tokenized at storage (see Section 3.4).
- ACH pull (debit) requires explicit prior authorization from the member; the authorization record must be maintained for the period required by NACHA rules (minimum 2 years).
- Same-Day ACH initiation above a configurable threshold requires step-up authentication.
- OFAC sanctions screening is applied to the receiving party before submission to the ACH network.

### 5.3 Wire Transfers

- Domestic and international wire instructions must be validated against the SWIFT/ABA directory before processing.
- International wires require OFAC, FinCEN, and applicable local sanctions screening.
- Wire transfers above the configurable threshold require:
  1. Step-up authentication (biometric or TOTP).
  2. A maker-checker workflow for operator-initiated wires.
  3. A confirmation delay window (configurable; default 30 minutes) during which the member may cancel.
- Wires cannot be reversed once submitted; the confirmation window is the primary recall mechanism.
- Wire fee disclosure must be presented to the member before final confirmation.

### 5.4 Zelle

- Zelle transactions use the Zelle Network token-based payment flow; VANTORIS stores only the Zelle token and transaction reference.
- Zelle sends to new recipients require step-up authentication on first use.
- Zelle transaction limits are enforced server-side per network and platform rules.
- Zelle dispute handling follows the Zelle Network dispute resolution procedures and must be documented in the dispute management runbook.

### 5.5 Cryptocurrency

- Crypto private keys are never stored in application databases. Custody is delegated to an HSM-backed custodian (self-managed HSM or a regulated custodian service).
- Database stores: wallet_id, wallet_address (public), custody_reference (external custodian token). No private key material is ever written to VANTORIS storage.
- Crypto withdrawals above threshold require:
  1. Step-up authentication.
  2. Address whitelisting: first-time withdrawal to an address requires a 24-hour cooling-off window (configurable) after the address is added.
  3. Multi-signature confirmation where the custodian requires it.
- On-chain transaction hashes are stored for audit and reconciliation.
- AML screening applies to counterparty wallet addresses using on-chain analytics (Chainalysis, Elliptic, or equivalent).

### 5.6 Card Payments

- Card PANs are never stored in plaintext. Tokenization is mandatory (see Section 3.4).
- CVV/CVC codes are never persisted at any point.
- Card-not-present transactions are authenticated using 3D Secure 2 (3DS2); VANTORIS must support 3DS2 challenge and frictionless flows.
- Card controls (freeze/unfreeze, spend limits, merchant category restrictions) are enforced server-side by the card service; client-side display is advisory.
- Card issuance and replacement events produce audit records and trigger notifications to the member.

### 5.7 Step-Up Authentication for High-Risk Payment Actions

The following payment actions always require step-up authentication (fresh biometric or TOTP challenge, not just a valid session token):

- Any single transfer or payment above the platform-configured high-risk threshold.
- Wire transfer initiation of any amount.
- ACH pull above threshold or to a new external account.
- Crypto withdrawal to an address not on the approved whitelist.
- Zelle to a new recipient.
- Card limits increase or card controls removal.
- Batch payments or bulk transfer operations.
- Emergency or override transactions by operators.

Step-up authentication invalidates the fresh_auth claim after use; subsequent high-risk actions within the same session require a new step-up challenge.

---

## 6. Session Security

### 6.1 Session Architecture

- Sessions are stored server-side in Redis with a session_id (UUID v4) as the key. The session record includes: user_id, device_id, ip_address, created_at, last_active_at, risk_level, fresh_auth (boolean with expiry), mfa_methods_satisfied, and session_state.
- The client holds only the session token (an opaque reference); session state is never embedded in client-accessible storage in a reversible form.
- Session tokens are transmitted exclusively in HttpOnly, Secure, SameSite=Strict cookies (web) or in-memory with secure storage (mobile).

### 6.2 Trusted Device Binding

- Sessions are bound to the device that initiated authentication. A session created on Device A cannot be used from Device B.
- Device binding is validated on every request via the device_id claim in the session and the device fingerprint header. Mismatches cause session termination and an audit event.
- Maximum active trusted devices: two per account. See Section 2.5.

### 6.3 Inactivity Lock

- After 2 minutes of inactivity, the UI enters a locked state. The session remains server-side valid; the client must present a biometric (WebAuthn) or PIN to unlock.
- Inactivity is measured by absence of user interaction events (keyboard, mouse, touch). The lock countdown resets on every interaction.
- The locked UI must not display sensitive account data, balances, or transaction details.
- The lock screen must provide no bypass mechanism; forgotten PIN requires full re-authentication and device re-verification.

### 6.4 Full Session Termination

- Full session termination (server-side session destruction + JWT revocation) occurs after:
  - 15–30 minutes of continuous inactivity in the locked state (exact window is configurable; default 15 minutes for member sessions, 30 minutes for operations).
  - Explicit logout.
  - Device trust revocation.
  - Session anomaly detection (concurrent session from a different device or location).
  - Administrative session invalidation (operator forces logout for member).
- On full termination: the session record is deleted from Redis, the refresh token is revoked in the revocation store, and an audit event is emitted.

### 6.5 Fresh Authentication for High-Risk Actions

- High-risk actions (see Section 5.7 for payment actions; also includes: changing password, changing email, changing phone, adding/removing trusted device, changing MFA method, accessing audit logs, performing admin operations) require fresh authentication.
- fresh_auth is a claim in the session set to true when the user completes a full MFA challenge (WebAuthn assertion or TOTP code). The claim expires after 5 minutes (configurable for each action category).
- Services validate fresh_auth at the server side; the claim is not accepted from client-provided headers.
- After fresh_auth is consumed by one high-risk action, the member must re-authenticate for the next high-risk action.

### 6.6 Concurrent Session Policy

- Members are permitted one active session per trusted device. Attempting to create a new session on a device with an existing session either reuses the existing session (if the device matches) or requires the member to explicitly close the other session.
- Concurrent sessions from different devices are detected and trigger an in-app notification to the member; the member may remotely terminate the other session.
- Operator accounts allow a single concurrent session; new login from a different device terminates the previous session and produces an audit event.

---

## 7. AI Security

### 7.1 Permission-Aware AI Actions

- Every AI action is governed by a permission descriptor (YAML/JSON) stored in libs/ai/permissions/. The descriptor specifies: action_id, action_name, description, required_roles, required_scopes, risk_level, and allowed_in_contexts.
- The AI Command Center (ACC) queries the Permission Discovery API (GET /v1/ai/permissions?actor={id}) to determine which actions the current user may see and invoke. See docs/API_ARCHITECTURE.md §AI Command Center APIs.
- The AI backend enforces permissions server-side on every action invocation; frontend visibility is not the authoritative check.
- AI agents must not infer or bypass permission checks based on conversational context. An AI agent that detects an unauthorized request must refuse and produce an audit event.

### 7.2 Prompt Injection Protection

- All user input passed to AI models is sanitized and wrapped in a structured prompt template before submission. Raw user input is never interpolated directly into system prompts.
- Prompt templates are versioned and stored in libs/ai/prompts/; template changes require a PR with security review.
- Output validation: AI model responses are validated against expected schemas before being acted upon (especially for tool-calling and structured output flows). Unexpected output formats are rejected, logged, and surfaced as errors.
- Jailbreak and prompt injection attempts are detected using pattern-matching filters and, where applicable, a guard model. Detected attempts produce high-risk audit events and may trigger a session security alert.
- No sensitive PII, account numbers, or credentials are included in prompts sent to external AI model providers. Sensitive context is passed via internal references (account_id, member_id) and resolved server-side.

### 7.3 Memory and Conversation Isolation

- AI memory (short-term and long-term) is isolated per member. ai_memory records are keyed by owner_id and namespace; cross-member memory access is not permitted at any level of the stack.
- AI conversations are private to the owning member. Operator access to member AI conversations requires explicit authorization and produces an audit event.
- AI session context is reset on full session termination (Section 6.4). Memory that persists across sessions (long-term memory) is governed by member consent and is subject to data retention policies (Section 10.4).
- In the Member Advisor context, operator-facing chat transcripts are stored separately from member-facing conversation history and are subject to support ticket retention rules.

### 7.4 Tool and Workflow Permissions

- AI tool invocations (external API calls, database lookups, financial actions triggered by AI) are individually permission-gated. The AI orchestration layer must validate that:
  1. The action is listed in the calling member's permission descriptor.
  2. The action's required_roles and required_scopes are satisfied by the current session token.
  3. The action does not exceed the member's financial limits or daily velocity thresholds.
- Multi-step AI workflows (defined in libs/ai/workflows/) follow the same permission checks at each step. A workflow step that requires step-up authentication must pause and request it; it must not skip or preemptively satisfy the MFA requirement.
- AI workflows that initiate financial transactions must generate a preview for member confirmation before submission. Silent financial submissions by AI are prohibited.

### 7.5 AI Audit Logging

All AI events specified in Section 4.3 must be logged, including:
- Action invoked (action_id, inputs, permission_check_result, outcome).
- Workflow started, each step executed, and workflow completed or failed.
- Memory read/write events (key, namespace, not the value for PII namespaces).
- Prompt template version used.
- External model provider invoked (model name, token count, no raw prompts logged if they contain member data).
- Any detected injection attempt or permission denial.

---

## 8. Chat Security

### 8.1 Message Encryption

- Messages in transit are protected by TLS 1.3 (see Section 3.1).
- At rest, the messages table in PostgreSQL is on an encrypted volume (TDE). For high-sensitivity channels (direct messages between members and advisors containing PII), consider field-level encryption on the body column using the envelope encryption model (Section 3.3).
- Media attachments stored in S3 use SSE-KMS encryption with customer-managed keys.

### 8.2 Media Security

- All media uploads use presigned S3 URLs for direct-to-storage uploads; the VANTORIS API issues the presigned URL after validating the user's identity and the file's metadata (content type, size limits).
- After upload, a background moderation pipeline runs:
  1. Virus scanning (ClamAV or cloud-native equivalent).
  2. NSFW / harmful content detection for member-facing channels.
  3. PII detection for documents (OCR-based SSN, card number detection).
- Messages with attachments begin in a moderation_state of pending; after the pipeline clears them, the state transitions to safe (made visible) or flagged (blocked, audit event emitted, content reviewed by compliance).
- Malware-flagged files are quarantined (never served to any user), produce a high-risk audit event, and trigger a security alert.

### 8.3 Retention and Deletion

- Chat message retention periods by channel:

| Channel | Default Retention | Legal Hold Override |
|---|---|---|
| Member-to-Advisor (support) | 7 years | Indefinite until hold lifted |
| AI conversation history | 2 years | Indefinite until hold lifted |
| Operator-internal chat | 5 years | Indefinite until hold lifted |
| WhatsApp Business transcripts | 7 years | Indefinite until hold lifted |
| Voice call transcripts | 7 years | Indefinite until hold lifted |

- Message deletion by a member marks the message as deleted (soft-delete with deleted_at timestamp) and removes the visible content; the tombstone record is retained for the remainder of the retention period to satisfy audit requirements.
- Messages under legal hold cannot be deleted, redacted, or modified regardless of member request.

### 8.4 Signed URLs and Access Controls

- Media files are never served directly from a public S3 bucket. All access goes through signed URLs generated by the backend with a short expiry (15 minutes default; configurable per content type).
- Signed URL generation requires a valid authenticated session; the URL encodes the requester's identity and the resource id. Backend logs signed URL generation as an audit event.
- Access to another member's media (e.g., in a group conversation or support ticket) is validated at the signed URL generation step; the requester must be a participant of the conversation.
- Media URLs must not be shared or embedded in publicly accessible pages.

### 8.5 Chat Access Controls

- Chat conversations are scoped to their participants. Cross-conversation access is blocked at the API layer.
- Operators accessing member chats for support purposes must be in the role operations_agent or higher, must be assigned to the support ticket or conversation, and the access is audited.
- AI-generated summaries are accessible only to the conversation participants (member and advisor) or to an authorized operator accessing a support ticket.
- Search indexes for chat messages must not allow cross-member or cross-conversation queries; each search request must be scoped to the caller's accessible conversations.

---

## 9. Verification Center Security

The Verification Center is the single identity and compliance verification surface in VANTORIS. It replaces any generic KYC page. KYC must not appear in the More menu. All verification states must be real and current; no "Coming Soon" placeholders.

### 9.1 Identity Verification

- Identity verification uses a third-party KYC provider (Socure, Jumio, Onfido, or equivalent) integrated via the docs/api/verification.yaml contract.
- Documents submitted for identity verification are encrypted in transit (TLS 1.3) and at rest (SSE-KMS in S3 + field-level encryption on metadata).
- Document images are forwarded to the KYC provider via a server-side relay; documents are never sent directly from the client browser to the provider.
- VANTORIS stores only the verification result (status, provider_reference, extracted non-PCI fields necessary for onboarding), not the raw document images long-term. Raw images are retained only for the period required by AML regulations (minimum 5 years) and then purged according to the retention schedule.
- Liveness checks (selfie + document match) are conducted in-app using the provider's SDK; biometric data is processed by the provider and never transmitted to VANTORIS servers in raw form.

### 9.2 Address Verification

- Address verification may use document-based proof (utility bill, bank statement) or third-party address verification service (USPS CASS, or equivalent).
- Submitted documents are subject to the same upload security controls as identity documents (Section 9.1).
- Address data is stored with a verification_status flag in the member_profile; changes to address require re-verification.

### 9.3 Email Verification

- Email verification uses a time-limited OTP (6-digit code or tokenized link) sent to the member's email address.
- OTP validity: 15 minutes, single-use, rate-limited (maximum 5 resends per 24-hour period).
- The verification token is stored as a salted hash; the plaintext token is never persisted.
- Email change verification requires the member to verify both the old address (receives a notification) and the new address (receives the OTP).

### 9.4 Phone Verification

- Phone verification uses a 6-digit OTP delivered via SMS or voice call.
- OTP validity: 10 minutes, single-use, rate-limited (maximum 5 delivery attempts per hour).
- SMS delivery uses an upstream provider (Twilio or equivalent); the provider is used for delivery only and does not retain the OTP content.
- Phone number changes require both a new phone OTP and a fresh MFA challenge from a verified method.
- Verified phone numbers are used for transactional alerts and as a fallback MFA method; they are not used as a primary authentication factor.

### 9.5 Income Verification

- Income verification accepts:
  - Pay stubs, W-2s, tax returns (PDF/image upload, max 3 documents).
  - Bank statement via Plaid or equivalent read-only bank connection (OAuth-based; never credentials).
  - Employer letter (PDF upload).
- Uploaded documents are stored encrypted and are accessible only to the compliance team and the AI income analysis pipeline.
- AI-assisted income extraction must not store raw document content beyond the retention window; extracted fields (gross_income, employer_name, frequency) are stored in the verification record.

### 9.6 Business Verification (KYB)

- Business verification (Know Your Business) covers: entity name, jurisdiction, tax ID, beneficial ownership (UBO disclosure), formation documents, and authorized signers.
- UBO data (names, ownership percentages, date of birth, nationality) is encrypted at the field level (see Section 3.3) and retained for the period required by FinCEN's CDD Rule (currently the life of the account + 5 years).
- Beneficial owners with ≥25% ownership must complete individual identity verification (Section 9.1) before the business account is activated.

### 9.7 Trusted Device Verification Flow

- Adding a trusted device follows this verification flow:
  1. Member authenticates (existing trusted device or email + MFA).
  2. Member requests device trust for the new device.
  3. A device trust approval notification is sent to the existing trusted device (push notification or in-app alert).
  4. Member approves on the existing device (biometric or TOTP confirmation).
  5. New device is registered as trusted; old device receives a confirmation notification.
  6. If the member has no existing trusted device (e.g., lost device recovery), the flow routes through Verification Center (identity re-verification + support escalation).
  7. All steps produce audit events.

---

## 10. Compliance Guidance

### 10.1 PCI DSS

- VANTORIS must achieve and maintain PCI DSS compliance for all cardholder data environment (CDE) components.
- Scope reduction: tokenization (Section 3.4) is the primary scope-reduction strategy; most VANTORIS services never handle raw PANs and are out of CDE scope.
- Required controls:
  - Build and maintain a secure network (firewall rules, no vendor defaults).
  - Protect cardholder data (tokenization, field-level encryption, TDE).
  - Maintain a vulnerability management program (patch management, AV, SAST/SCA in CI).
  - Implement strong access control measures (RBAC, least privilege, MFA for CDE access).
  - Regularly monitor and test networks (logging, IDS/IPS, penetration testing).
  - Maintain an information security policy.
- Annual PCI DSS self-assessment questionnaire (SAQ) or third-party QSA assessment depending on transaction volume.
- Penetration testing of the CDE annually and after significant changes.

### 10.2 SOC 2

- VANTORIS targets SOC 2 Type II certification covering the Trust Service Criteria: Security, Availability, Processing Integrity, Confidentiality, and Privacy.
- Key controls mapped to this document:
  - Logical access controls → Section 2 (IAM), Section 6 (Sessions).
  - Data encryption → Section 3 (Data Protection).
  - Audit logging → Section 4 (Audit Logging).
  - Incident response → Section 12 (Incident Response).
  - Change management → docs/REPOSITORY_STANDARDS.md §PR & Release requirements.
  - Vendor management → Third-party integrations reviewed annually.
- SOC 2 evidence artifacts are produced automatically by CI/CD (build logs, test results, deployment records) and by the immutable audit log.

### 10.3 GDPR

- VANTORIS processes personal data of EU residents and must comply with GDPR.
- Legal basis for processing: contractual necessity (account management, transactions), legal obligation (AML/KYC), and legitimate interest (fraud detection). Consent is used only where contractual necessity or legal obligation does not apply.
- Data subject rights implemented:
  - Right of access: members may request an export of all personal data held about them.
  - Right to rectification: members may correct inaccurate personal data through profile settings.
  - Right to erasure (right to be forgotten): members may request deletion; deletion is blocked for data required for AML/tax/regulatory retention; otherwise data is pseudonymized within 30 days of a valid request.
  - Right to portability: account and transaction data is exportable in machine-readable format (JSON/CSV).
  - Right to object / restrict processing: documented objection handling procedure; non-marketing processing based on legal obligation cannot be restricted.
- Data minimization: APIs must not return PII fields beyond what is necessary for the operation (see docs/API_ARCHITECTURE.md §PII minimization).
- Data Protection Officer (DPO): appoint a DPO and maintain a Record of Processing Activities (RoPA).
- Data transfers outside the EEA use Standard Contractual Clauses (SCCs) or adequacy decisions.

### 10.4 Data Retention Schedule

| Data Category | Retention Period | Basis | Deletion Method |
|---|---|---|---|
| Member PII (name, email, phone, address) | Life of account + 7 years | AML/BSA, contractual | Pseudonymization after close |
| Transaction records | 7 years from posting | BSA / Dodd-Frank / Reg E | Archive to cold storage; do not delete |
| ACH authorization records | 2 years from last use | NACHA rules | Secure deletion after period |
| Wire transfer records | 5 years | BSA / Dodd-Frank | Archive |
| Audit logs | 7 years | SOX, SOC 2, PCI DSS | Immutable; no deletion |
| KYC/identity documents | 5 years from account closure | FinCEN / BSA | Secure purge from S3 |
| UBO / KYB records | Life of account + 5 years | FinCEN CDD Rule | Secure purge |
| Card data (tokenized) | Life of card + 5 years | PCI DSS | Token mapping purged after period |
| AI conversation history | 2 years | Legitimate interest | Soft-delete + purge |
| Support chat transcripts | 7 years | Contractual / legal | Archive |
| Device trust records | 7 years from removal | Security / audit | Soft-delete; archive after close |
| Backup files | 90 days (operational) | DR policy | Automated expiry in S3 lifecycle |
| Encryption key audit logs | 10 years | PCI DSS, SOC 2 | Immutable; no deletion |

Legal hold overrides all retention period deletions. A legal hold flag on a member record prevents all automated deletion jobs from processing that member's data.

### 10.5 AML and KYC

- AML (Anti-Money Laundering) and KYC (Know Your Customer) controls are embedded in the Verification Center (Section 9) and the transaction monitoring pipeline.
- Transaction monitoring rules run continuously against the transaction stream (Kafka events) using a rule engine or third-party AML system.
- Suspicious Activity Reports (SARs) and Currency Transaction Reports (CTRs) are generated by the compliance engine and filed with FinCEN per BSA requirements.
- OFAC and international sanctions screening is applied to: new members at onboarding, ACH and wire counterparties, Zelle recipients, and crypto wallet addresses.
- Enhanced Due Diligence (EDD) is applied to Politically Exposed Persons (PEPs), high-risk jurisdictions, and accounts exceeding defined risk thresholds.
- AML records and screening results are retained per the retention schedule (Section 10.4) and are accessible to compliance officers and auditors.

### 10.6 Incident Response

See Section 12 (Incident Response) for the full policy. Summary of notification obligations:
- GDPR: notify the supervisory authority within 72 hours of discovering a personal data breach.
- PCI DSS: notify card brands and acquiring bank within the timeframe specified by their incident response requirements.
- FinCEN / BSA: file a SAR within 30 days of identifying suspicious activity.
- State breach notification laws: notify affected individuals per applicable state law (typically within 30–60 days of discovery).

---

## 11. Secrets Management

### 11.1 Policy

- No secrets (API keys, database credentials, KMS key IDs, OAuth client secrets, service account tokens, TLS private keys) may be committed to the Git repository, embedded in Docker images, or written to application logs.
- Secrets are managed exclusively in HashiCorp Vault or AWS Secrets Manager (or equivalent). The choice is made per deployment environment and documented in infra/.
- All secrets are encrypted at rest by the secret store and in transit (TLS). Access to the secret store is authenticated using service identity (IAM role, Vault AppRole, or OIDC token from GitHub Actions).

### 11.2 Developer Secrets

- Local development secrets are stored in a .env file that is listed in .gitignore and is never committed.
- .env.example files may be committed to document required environment variables but must contain placeholder values only — never real credentials.
- A pre-commit hook checks for patterns matching common secret formats (API key patterns, AWS credentials, private key headers). See docs/CI_CD.md §Security & compliance checks in CI.

### 11.3 CI/CD Secrets

- CI/CD pipelines access secrets from the secret store at runtime using OIDC-based authentication (GitHub Actions OIDC + AWS IAM role or Vault JWT auth).
- Secrets are injected as masked environment variables or temporary files; they are never printed to logs.
- Pipeline job roles are scoped to least privilege: a lint job has no access to production DB credentials; only the deploy job has access to the kubeconfig secret.

### 11.4 Rotation Schedule

| Secret Type | Rotation Frequency | Automated |
|---|---|---|
| Service account credentials | 90 days | Yes |
| Database credentials | 90 days | Yes (Vault dynamic secrets preferred) |
| JWT signing keys | 90 days | Yes (with 24-hour overlap) |
| TLS certificates | 90 days (ACME auto) | Yes |
| KMS KEKs | Annual | Yes (re-encryption job) |
| API keys (third-party) | Annual or on compromise | Manual + automated alert |
| OAuth client secrets | Annual or on compromise | Manual + automated alert |

### 11.5 Compromise Response

- Any suspected or confirmed secret compromise triggers immediate rotation, invalidation of all affected sessions/tokens, and a high-risk audit event.
- Incident response procedure is followed (Section 12).
- Git history containing committed secrets must be considered permanently compromised; the affected credentials must be revoked immediately (not just removed from history).

---

## 12. Incident Response

### 12.1 Incident Categories

| Category | Severity | Examples |
|---|---|---|
| P0 — Critical | Immediate (< 1 hour response) | Active data breach, unauthorized fund movement, production system compromise, ransomware |
| P1 — High | < 4 hours | Authentication system failure, KMS unavailability, confirmed account takeover, PCI data exposure |
| P2 — Medium | < 24 hours | Suspicious activity pattern, non-critical data exposure, AML alert requiring investigation |
| P3 — Low | < 72 hours | Policy violation, informational security event, minor vulnerability disclosure |

### 12.2 Response Steps

1. Detection: automated alerts from SIEM, anomaly detection, or external report.
2. Triage: security analyst assesses severity and category.
3. Containment: isolate affected systems, revoke compromised credentials, block malicious IPs, freeze affected accounts where required.
4. Eradication: remove the root cause (patch vulnerability, remove malware, fix misconfiguration).
5. Recovery: restore services from clean state, validate integrity, re-enable accounts after verification.
6. Notification: notify affected members, regulators (GDPR 72-hour rule, PCI DSS), and card networks as required by law and contract.
7. Post-Incident Review: root cause analysis (RCA) within 5 business days of resolution; update controls to prevent recurrence; document lessons learned.

### 12.3 Notification Obligations

- GDPR personal data breach: notify the lead supervisory authority within 72 hours; notify affected data subjects without undue delay if high risk.
- PCI DSS: notify card brands (Visa, Mastercard) and acquiring bank per their incident response procedures (typically within 24 hours of confirmed cardholder data exposure).
- FinCEN SAR: file within 30 days of identifying a suspicious transaction; 60 days for continuing suspicious activity.
- US state breach notification laws: notify affected residents per applicable state laws; timelines vary (typically 30–60 days).

### 12.4 Evidence Preservation

- Audit logs, system logs, and access records related to the incident must be preserved on legal hold immediately upon incident declaration.
- No log rotation, deletion jobs, or data archival operations may run on systems within the incident scope during investigation.
- Chain of custody must be documented for evidence collected for potential legal proceedings.

---

## 13. Cross-References

This document is the source of truth for VANTORIS security standards and must be referenced by the following documents:

| Document | Reference Context |
|---|---|
| docs/ARCHITECTURE.md | Security & Compliance Layer; Zero Trust; security boundaries |
| docs/REPOSITORY_STANDARDS.md | Security-critical PR requirements; secrets policy |
| docs/CODING_STANDARDS.md | Permission gating; field-level encryption usage; session handling |
| docs/API_ARCHITECTURE.md | Auth/authorization; audit headers; PII minimization; field-level encryption for PCI |
| docs/DATABASE_ARCHITECTURE.md | Encryption at rest; retention/redaction; audit log schema; session model; trusted devices schema |
| docs/CI_CD.md | Security scan gates; secret scanning; SAST; SBOM; compliance checks |
| docs/VERIFICATION_CENTER.md | Identity, address, email, phone, income, business, and device verification flows (to be created) |
| docs/AUTHENTICATION.md | OAuth2/OIDC/JWT implementation details; MFA; WebAuthn (to be created) |
| docs/RBAC.md | Role definitions; permission descriptors; RBAC enforcement (to be created) |
| docs/MIGRATION_GUIDE.md | Security requirements during Base44 import; secrets migration; schema mapping (to be created) |
| docs/TESTING.md | Security test requirements; penetration test policy; contract security tests (to be created) |

---

## 14. Gaps and Dependencies Discovered

The following gaps and open decisions were identified while authoring this document:

1. Authentication service implementation choice: The platform references Keycloak, Auth0, and custom JWT. A concrete authorization server must be selected before Base44 import; this affects OAuth2/OIDC endpoint configuration, token introspection, and OIDC federation setup.

2. KMS provider selection: AWS KMS vs. HashiCorp Vault vs. Google Cloud KMS is not yet finalized. The key hierarchy in Section 3.5 is provider-agnostic; a concrete selection must be documented in infra/ before implementing field-level encryption.

3. Secret management tooling: HashiCorp Vault vs. AWS Secrets Manager vs. GCP Secret Manager — select and document in infra/. The rotation automation in Section 11.4 depends on this choice.

4. Tokenization provider: PAN tokenization may be handled by the payment network (Visa Token Service, Mastercard MDES), a third-party vault (Basis Theory, Very Good Security), or a self-hosted tokenization service. Selection must be made before card processing is enabled.

5. AML transaction monitoring platform: Third-party vs. self-built rule engine. The compliance chapter references automated SAR/CTR generation which requires a concrete platform selection.

6. On-chain AML screening provider: Chainalysis, Elliptic, or equivalent for crypto counterparty screening — not yet selected.

7. Biometric modality for mobile: The security model references Face ID / Touch ID (iOS) and Android BiometricPrompt; ensure the mobile SDK supports WebAuthn Level 2 platform authenticators on both platforms.

8. Vector database security model: AI memory uses a vector database for embeddings (Section 7.3). The isolation model for multi-tenant vector search (namespace isolation vs. separate index per owner) must be documented in docs/AI_ARCHITECTURE.md when that document is authored.

9. Trusted device count discrepancy: docs/DATABASE_ARCHITECTURE.md §Session security model states "max two trusted devices"; docs/DATABASE_ARCHITECTURE.md §Trusted Devices Rules states "maximum of two active trusted devices." This document adopts two as the authoritative maximum. The REPOSITORY_STANDARDS.md language of "single active device" should be clarified: one device is the default at signup; the member may add a second through explicit approval. Update REPOSITORY_STANDARDS.md to clarify this during the next revision.

10. Legal hold system: The retention policy references a legal hold flag but no legal hold management system is documented. A legal hold feature must be designed and documented (likely in docs/COMPLIANCE.md or docs/VERIFICATION_CENTER.md).

---

## 15. Remaining Documentation to Be Created

Based on cross-references in this document and in previously committed documents, the following documentation has not yet been created and is required before the Base44 import:

| Document | Priority | Purpose |
|---|---|---|
| docs/AUTHENTICATION.md | High | OAuth2/OIDC provider setup, JWT lifecycle, MFA enrollment, WebAuthn implementation details |
| docs/RBAC.md | High | Role taxonomy, permission descriptor format, RBAC enforcement middleware |
| docs/VERIFICATION_CENTER.md | High | Verification flows, third-party KYC vendor integration, status state machine |
| docs/MIGRATION_GUIDE.md | High | Base44 import checklist, schema mapping, security requirements during migration |
| docs/TESTING.md | Medium | Security test requirements, penetration testing policy, test matrix |
| docs/DESIGN_SYSTEM.md | Medium | Shared design tokens, component library |
| docs/DOCUMENTATION_STANDARDS.md | Low | Documentation conventions, authoring standards |
| docs/AI_ARCHITECTURE.md | Medium | AI Command Center deep-dive, memory architecture, vector DB model, prompt pipeline |
| docs/COMPLIANCE.md | Medium | AML/KYC program details, legal hold system, regulatory filing procedures |

---

## 16. Recommendations Before Next Document

Before authoring docs/AUTHENTICATION.md (the suggested next document):

1. Confirm the authorization server: Select Keycloak, Auth0, or a custom JWT implementation. The authentication document must be written for a concrete provider, not a placeholder. If Auth0 is selected, note that it supports OIDC, MFA, WebAuthn, and refresh token rotation natively. If Keycloak is selected, document the realm configuration. If custom, plan for significant implementation work.

2. Decide on the step-up authentication mechanism: This document specifies fresh_auth as a session claim validated server-side. docs/AUTHENTICATION.md must document the exact challenge flow (prompt UI, backend validation endpoint, claim injection). Align with the authorization server choice.

3. Resolve the trusted device count: Update docs/REPOSITORY_STANDARDS.md to clarify that the default at signup is one trusted device and the maximum is two. This removes ambiguity between the "single trusted active device" language in REPOSITORY_STANDARDS.md and the two-device model in DATABASE_ARCHITECTURE.md and this document.

4. Assign DPO: Appoint a Data Protection Officer before the platform processes any EU personal data. This is a GDPR legal requirement, not a documentation task.

5. Initiate PCI DSS scoping conversation: Engage a QSA early to define the CDE boundary before Base44 import introduces card processing code. Tokenization scope reduction must be validated by the QSA.

---

## Document Metadata

- Status: normative documentation-only
- Version: 1.0
- Base44 migration compatible: yes
- Code generated: none
- Files created: docs/SECURITY_STANDARDS.md
