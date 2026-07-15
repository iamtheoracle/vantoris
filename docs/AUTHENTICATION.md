# Authentication Architecture — VANTORIS

Status: normative documentation-only. This file defines the production-grade authentication architecture for VANTORIS across all account types, authentication methods, session lifecycle, and role-based integration. It is the authoritative reference for authentication design and must remain compatible with the planned Base44 migration. Do NOT generate application code from this document.

---

## Table of Contents

1. [Architectural Principles](#1-architectural-principles)
2. [Authentication Methods](#2-authentication-methods)
3. [Account Types and Creation](#3-account-types-and-creation)
4. [Member Profile Model](#4-member-profile-model)
5. [Session Management](#5-session-management)
6. [Trusted Device Management](#6-trusted-device-management)
7. [Token Architecture](#7-token-architecture)
8. [Multi-Factor Authentication](#8-multi-factor-authentication)
9. [Passkeys and Biometrics (WebAuthn)](#9-passkeys-and-biometrics-webauthn)
10. [Recovery Codes](#10-recovery-codes)
11. [Role-Based Access Integration](#11-role-based-access-integration)
12. [High-Risk Action Re-Authentication](#12-high-risk-action-re-authentication)
13. [Verification Center Integration](#13-verification-center-integration)
14. [Audit and Observability](#14-audit-and-observability)
15. [Security Boundaries](#15-security-boundaries)
16. [Base44 Migration Compatibility](#16-base44-migration-compatibility)
17. [Cross-References](#17-cross-references)
18. [Dependencies and Gaps](#18-dependencies-and-gaps)
19. [Remaining Documentation](#19-remaining-documentation)
20. [Recommendations Before Next Document](#20-recommendations-before-next-document)

---

## 1. Architectural Principles

Authentication in VANTORIS is designed as a first-class security domain, not a peripheral add-on. The following principles govern every authentication decision:

### Identity vs. Authorization Separation

- **Authentication only establishes identity.** The authentication layer proves who the actor is — member, operator, or system.
- **Authorization determines permissions.** What an authenticated actor may see or do is determined entirely by the RBAC engine (see docs/RBAC.md), not by the authentication layer.
- These two concerns must never be conflated. An authenticated session carries a verified identity claim; permission checks happen independently on every request.

### Zero Trust

- No actor — member, operator, or internal service — is trusted by default, regardless of network origin.
- Every request crossing a service boundary must carry a verifiable credential (JWT, mTLS certificate, or signed token).
- Device trust must be explicitly established and re-verified according to policy.

### Defense in Depth

- Authentication is one layer of a multi-layer security model. Even authenticated sessions are subject to rate limiting, anomaly detection, session scope validation, and RBAC enforcement.
- Compromise of one layer (e.g., a leaked refresh token) must not result in full account takeover. MFA, trusted device checks, and step-up authentication provide additional barriers.

### Secure by Default

- All authentication channels must default to the most secure configuration available.
- Weaker authentication methods (e.g., SMS OTP) are supported for compatibility but must be supplemented by MFA and device trust controls.
- Unauthenticated endpoints are explicitly enumerated; all others are protected by default.

### Unified Operating Experience

- Authentication controls must not fragment the member or operator experience.
- OAuth2 flows, MFA challenges, passkey prompts, and trusted device confirmations integrate seamlessly into the VANTORIS interface.
- Members and operators perform their entire authentication workflow within VANTORIS; no context switching to third-party systems.
- External identity providers are abstracted behind the platform authentication layer.

### Never Expose Hidden Authority

- Internal authority levels, role codes, and permission identifiers must never be surfaced to any client, log entry visible to members, or error message.
- Authentication responses convey identity claims; permission resolution is opaque to the client.

---

## 2. Authentication Methods

VANTORIS supports a layered set of authentication methods to accommodate diverse member contexts and device capabilities.

### 2.1 Email Authentication

- Members authenticate with a registered email address and credential (password or passkey).
- Email is the primary identity anchor for personal and joint accounts.
- Email addresses are stored with case-insensitive unique indexing (see docs/DATABASE_ARCHITECTURE.md, members schema).
- Email addresses are never used as display names, greetings, or UI labels for members.

### 2.2 Phone Number Authentication

- Members may authenticate using a registered mobile phone number, verified via SMS OTP or voice call.
- Phone verification is handled by the Verification Center (see Section 13 and docs/VERIFICATION_CENTER.md).
- Phone-based authentication requires a verified phone number on file (status: Verified).
- Phone authentication alone is not sufficient for high-risk actions; step-up authentication is required.

### 2.3 Username (Optional)

- Members may optionally configure a username as an alternative to email for sign-in.
- Usernames must be unique across the platform.
- Usernames are not derived from email addresses. The display name, greeting, and identity label rules in Section 4 apply independently of any username.
- Username support is additive; email and phone authentication remain the primary methods.

### 2.4 Passkeys (WebAuthn)

- VANTORIS supports WebAuthn-based passkeys as a primary and phishing-resistant authentication method.
- Passkeys replace passwords and provide platform-bound or cross-device authentication (FIDO2 / WebAuthn Level 2).
- Passkey registration requires prior identity verification through the Verification Center.
- Passkeys integrate with platform biometric authenticators (Face ID, Touch ID, Windows Hello) and hardware security keys.
- Passkey credential management (add, remove, rename) is available in the member security settings with fresh authentication required for each change.
- WebAuthn relying party configuration must be scoped to the VANTORIS domain.
- Passkeys are stored as credential records associated with the member's account and the registered trusted device.
- On platforms that support WebAuthn conditional UI, passkey autofill is supported on the sign-in form.

### 2.5 Biometrics

- Biometric authentication is the on-device verification step used to unlock a stored passkey or local credential.
- Biometrics (Face ID, Touch ID, fingerprint) are processed entirely on-device; VANTORIS never receives raw biometric data.
- Biometric availability depends on device capability and operating system support.
- Biometric fallback: if biometric authentication fails or is unavailable, the member is prompted for their passkey PIN or password.
- Biometric re-enrollment after a trusted device is removed is automatic when the device is re-registered as a new trusted device.

### 2.6 Multi-Factor Authentication (MFA)

- MFA is a required second factor for all authentication events on non-passkey flows.
- Supported MFA methods (in order of security preference):
  1. TOTP (Time-based One-Time Password) — authenticator app (e.g., Google Authenticator, Authy)
  2. WebAuthn hardware security key — FIDO2 security key as a second factor
  3. Push notification — in-app push approval from a trusted device
  4. SMS OTP — one-time code delivered by SMS (fallback; lower assurance)
  5. Voice OTP — one-time code delivered by voice call (fallback for accessibility)
- MFA method enrollment and management require fresh authentication and are recorded in the audit log.
- Administrators may set a minimum MFA assurance level per role. Operations and iCommand roles require TOTP or hardware key; SMS OTP is not accepted for these roles.

### 2.7 Recovery Codes

- At MFA enrollment, the member is issued a set of one-time recovery codes.
- Recovery codes provide emergency access if all MFA methods become unavailable.
- Recovery codes are single-use; each code is invalidated immediately upon use.
- Using a recovery code triggers an alert, forced MFA re-enrollment, and an immutable audit event.
- Recovery codes are never stored in plaintext; they are stored as salted hashes.
- Recovery code generation and regeneration require fresh authentication and are audit-logged.
- Recovery codes are not displayed in the application after initial issuance. If lost, the member must contact support through the Verification Center.

---

## 3. Account Types and Creation

### 3.1 Supported Account Types

VANTORIS supports three member account types:

| Account Type | Description |
|---|---|
| **Personal Account** | Individual member account with a single primary owner. |
| **Joint Account** | Shared account with two or more co-owners. Each co-owner authenticates independently. Permissions and signing authorities are configurable per account. |
| **Business Account** | Account owned by an organization entity. Requires business KYC and verification of Ultimate Beneficial Owners (UBOs). Operators are associated with the organization. |

### 3.2 New Member Onboarding (Account Creation)

- The onboarding flow is the single path for new member account creation.
- Onboarding collects legal identity information, establishes credentials, and initiates the Verification Center identity verification workflow.
- Onboarding must remain unchanged from its current design; this document does not alter onboarding steps.
- During onboarding, the member establishes at least one authentication method (email + password or passkey).
- MFA enrollment is prompted at the end of onboarding and is strongly recommended; for high-risk or business accounts, MFA enrollment may be mandatory.
- The first device used during onboarding is registered as the first trusted device.

### 3.3 Returning Member Sign In

- Returning members must go directly to Sign In; they must not be routed through the onboarding flow.
- The sign-in entry point must detect whether the member has an existing account (by email, phone, or username) and present the appropriate credential prompt.
- If the member has a registered passkey on the current device, WebAuthn conditional UI is offered first.
- The sign-in flow does not re-collect legal name, identity documents, or onboarding information.

### 3.4 Joint Account Authentication

- Each co-owner of a joint account authenticates with their own individual credentials.
- Joint account actions may require confirmation from one or more co-owners depending on configured signing rules.
- Multi-party approval workflows for high-value transactions are a banking operations concern and are documented separately.

### 3.5 Business Account Authentication

- Business accounts are associated with an organization entity (see docs/DATABASE_ARCHITECTURE.md, organizations schema).
- Human operators (business members) authenticate with their own individual credentials.
- Business accounts require business KYC via the Verification Center before full account access is granted.
- UBO verification requirements are determined by compliance rules.

---

## 4. Member Profile Model

### 4.1 Profile Fields

Every member profile includes the following name fields:

| Field | Required | Purpose |
|---|---|---|
| **Legal First Name** | Required | Legal identity; used for compliance, verification, regulatory reporting, statements, and contracts. |
| **Legal Middle Name** | Optional | Legal identity; included in full legal name when present. |
| **Legal Last Name** | Required | Legal identity; used for compliance, verification, regulatory reporting, statements, and contracts. |
| **Preferred Name** | Optional | Display and greeting; chosen by the member for how they wish to be addressed within the platform. |

### 4.2 Display Name Priority

When addressing a member in the UI, notifications, or AI responses, the following priority order is applied:

1. **Preferred Name** — if set, always used for greetings and display.
2. **Legal First Name** — if Preferred Name is not set, use Legal First Name.
3. **Legal First Name + Legal Last Name** — used in contexts requiring fuller identification (e.g., confirmation screens, profile headers).

**Rule**: Email addresses and email-derived strings (e.g., the local part before `@`) must never be used as a member's display name or in any greeting. This is an absolute prohibition.

### 4.3 Legal Name Usage

The complete legal name (Legal First Name + Legal Middle Name + Legal Last Name) is used exclusively in:

- Identity verification documents
- KYC and AML records
- Account statements and financial documents
- Contracts and agreements
- Regulatory filings and reports
- Compliance workflows

Legal name fields must be validated against identity documents provided during Verification Center workflows.

### 4.4 Database Mapping

Member profile name fields map to the `member_profile` table in the members schema:

- `first_name` → Legal First Name
- `middle_name` → Legal Middle Name (nullable)
- `last_name` → Legal Last Name
- `preferred_name` → Preferred Name (nullable)

The `display_name` field, if present, must never be derived from the email address. See docs/DATABASE_ARCHITECTURE.md for the full members schema.

---

## 5. Session Management

### 5.1 Session Lifecycle

Sessions are the authenticated context established after successful sign-in. Sessions are stored in Redis with a `session_id` and `device_id` association (see docs/DATABASE_ARCHITECTURE.md, session security model).

```
Sign In → Credential Verification → MFA Challenge → Session Created → Active Session
                                                          ↓
                                            Inactivity Timer Starts
                                                          ↓
                                    [5–10 min inactivity] → Full Session Termination
                                                          ↓
                                              Member must sign in again
```

### 5.2 Inactivity Termination

- After **5 to 10 minutes of inactivity** (configurable by risk profile), the authenticated session is **fully terminated**.
- Full termination means:
  - The session token is revoked server-side.
  - All refresh tokens associated with the session are invalidated.
  - The member must complete a full sign-in with MFA to resume.
- There is no partial "locked but not terminated" state; inactivity results in complete session end.
- The inactivity timer resets on any authenticated user interaction.
- The client-side UI provides a countdown warning before termination so the member can choose to continue or sign out gracefully.

### 5.3 Explicit Sign-Out

- Members may sign out from any active session.
- Sign-out immediately invalidates the session token and all associated refresh tokens.
- Signing out of one session does not affect sessions on other trusted devices unless the member selects "Sign out of all devices."

### 5.4 Concurrent Sessions

- A member may have active sessions on up to the number of registered trusted devices (maximum two; see Section 6).
- Each session is bound to a specific trusted device.
- Sessions are not transferable between devices.

### 5.5 Session Security Attributes

Every session record must capture:

| Attribute | Description |
|---|---|
| `session_id` | Unique session identifier (UUID) |
| `member_id` | Authenticated member |
| `device_id` | Registered trusted device |
| `ip_address` | IP address at session creation |
| `location` | Geolocation metadata (optional, privacy-controlled) |
| `created_at` | Session creation timestamp |
| `last_active_at` | Most recent activity timestamp |
| `expires_at` | Absolute session expiry |
| `mfa_verified` | Whether MFA was completed for this session |
| `fresh_auth_at` | Timestamp of the most recent re-authentication challenge |
| `risk_score` | Session risk score from anomaly detection |

---

## 6. Trusted Device Management

### 6.1 Trusted Device Policy

- A member account may have a **maximum of two active trusted devices** at any time.
- Adding a third trusted device requires the member to first remove one of the two existing trusted devices.
- There is no automatic replacement; the removal must be an explicit member action.
- Trusted devices are associated with the member's account, not individual accounts or sessions.

### 6.2 Registering a New Trusted Device

A new device may be registered as a trusted device only after all of the following conditions are met:

1. The member successfully authenticates with their password or passkey.
2. MFA is completed (TOTP, push notification, or hardware key).
3. The Verification Center confirms device trust (trusted device verification type).
4. If the member already has two trusted devices, one must be removed before proceeding.
5. The event is recorded in the audit log with: device metadata, approval method, actor, and timestamp.

### 6.3 Device Trust Attributes

Each trusted device record contains (see docs/DATABASE_ARCHITECTURE.md, devices schema):

| Field | Description |
|---|---|
| `device_id` | Unique device identifier |
| `member_id` | Associated member |
| `device_name` | Human-readable label (e.g., "iPhone 16 Pro") |
| `device_type` | Mobile / Desktop / Tablet |
| `os` | Operating system |
| `browser` | Browser or app identifier |
| `ip_address` | IP at registration |
| `location` | Geolocation at registration |
| `trust_date` | When the device was trusted |
| `last_active` | Most recent session activity |
| `current_status` | `trusted` \| `removed` \| `suspended` |
| `removed_date` | When the device was removed (soft delete) |
| `approval_method` | Password+MFA / Passkey / Admin approval |
| `audit_reference_id` | Reference to the audit log event |

### 6.4 Device Removal

- Trusted device records are never hard-deleted; they are soft-deleted (status set to `removed`, `removed_date` populated).
- Removing a trusted device immediately terminates all active sessions on that device.
- Device removal requires fresh authentication and is recorded in the audit log.

### 6.5 Device Fingerprinting

- Devices are fingerprinted at registration using available signals: user agent, hardware identifiers (where platform-permitted), and cryptographic binding via passkey credentials.
- Device fingerprint changes trigger a re-verification challenge.

---

## 7. Token Architecture

### 7.1 OAuth2 Authorization Code with PKCE

The primary authentication flow for web and mobile clients uses:

- **Protocol**: OAuth2 Authorization Code with PKCE (RFC 7636)
- **Purpose**: Prevents authorization code interception; required for public clients (SPA, mobile)
- **Token types**:
  - **Access Token** — short-lived JWT (15 minutes); carries identity claims and token scopes
  - **Refresh Token** — longer-lived opaque token with rotation; used to obtain new access tokens

### 7.2 JWT Access Token Claims

Access tokens carry a minimal, non-sensitive claim set:

| Claim | Description |
|---|---|
| `sub` | Member or actor ID (UUID) |
| `iss` | VANTORIS issuer identifier |
| `aud` | Intended audience (service or client) |
| `exp` | Expiration timestamp |
| `iat` | Issued-at timestamp |
| `jti` | Unique token identifier (for revocation) |
| `scope` | Space-delimited token scopes |
| `device_id` | Bound trusted device identifier |
| `session_id` | Associated session identifier |
| `mfa_verified` | Boolean MFA completion flag |
| `fresh_auth` | Timestamp of last re-authentication (for step-up checks) |

**Token claims must not include**: role names, permission codes, authority levels, internal identifiers, or PII beyond the `sub` claim. Permission resolution happens server-side on every request.

### 7.3 Refresh Token Rotation

- On each refresh token use, a new refresh token is issued and the previous one is invalidated.
- Detecting reuse of an invalidated refresh token triggers immediate session termination and security alert.
- Refresh tokens are bound to the `device_id` and `session_id` from which they were issued.

### 7.4 Token Scopes

- Token scopes are fine-grained and map to specific permissions in the RBAC engine.
- Scopes align with AI action descriptors defined in `libs/ai/permissions` (see docs/REPOSITORY_STANDARDS.md).
- Scope validation occurs at the API gateway and at individual service endpoints.

### 7.5 Service-to-Service Authentication

- Internal service calls use mTLS or signed JWTs.
- Service credentials are managed through the secrets management system (Vault or AWS Secrets Manager).
- Internal service tokens do not carry member identity claims unless explicitly proxied.

---

## 8. Multi-Factor Authentication

### 8.1 MFA Enrollment

- MFA enrollment is available for all supported methods (TOTP, WebAuthn hardware key, push, SMS, voice).
- A member may enroll multiple MFA methods for redundancy.
- The primary MFA method is the highest-assurance method enrolled.
- MFA enrollment requires the member to be authenticated (password or passkey verified).
- Enrollment events are immutably logged.

### 8.2 MFA Challenge Flow

```
Credential Verified → MFA Required? → [Yes] → MFA Challenge Presented
                                                        ↓
                                          Member Provides MFA Response
                                                        ↓
                                       Valid Response? → [Yes] → Session Created
                                                    ↓
                                                  [No] → Attempt Counter Incremented
                                                        → After N failures: account locked
```

### 8.3 MFA Lockout and Brute-Force Protection

- After a configurable number of consecutive MFA failures (default: 5), the account is temporarily locked.
- Lockout duration increases exponentially with repeated failures.
- Account unlock requires identity re-verification through the Verification Center.
- All MFA failure events are recorded in the audit log with IP address, device, and timestamp.

### 8.4 MFA Downgrade Prevention

- The platform must never allow downgrading from a higher-assurance MFA method to a lower-assurance method without fresh authentication and explicit member confirmation.
- Operations and iCommand roles may not use SMS OTP as their sole MFA method.

---

## 9. Passkeys and Biometrics (WebAuthn)

### 9.1 Passkey Registration Flow

```
Member Requests Passkey Registration
        ↓
Fresh Authentication Required (password or existing passkey)
        ↓
Server Generates Registration Challenge (WebAuthn PublicKeyCredentialCreationOptions)
        ↓
Client Invokes Authenticator (platform biometric or hardware key)
        ↓
Authenticator Creates Key Pair — Private Key Stored on Device, Public Key Returned
        ↓
Server Verifies Attestation and Stores Public Key Credential
        ↓
Passkey Bound to Member Account and Trusted Device
        ↓
Audit Event Recorded
```

### 9.2 Passkey Authentication Flow

```
Member Initiates Sign In
        ↓
Server Generates Authentication Challenge (PublicKeyCredentialRequestOptions)
        ↓
Client Presents WebAuthn Conditional UI (if supported) or explicit passkey prompt
        ↓
Member Authenticates via Biometric or PIN (on-device)
        ↓
Authenticator Signs Challenge with Private Key
        ↓
Server Verifies Signature Against Stored Public Key
        ↓
Identity Verified → Session Created (MFA requirement satisfied by WebAuthn)
```

### 9.3 Biometric Authentication on Mobile

- On iOS, Face ID and Touch ID are used as the local authenticator for WebAuthn credentials.
- On Android, fingerprint, face unlock, and screen lock credentials are used.
- Biometric data never leaves the device. VANTORIS receives only a cryptographic assertion.
- If a device's biometric enrollment changes (e.g., new fingerprint added), the passkey credential may require re-registration per platform policy.

### 9.4 Passkey Credential Management

- Members may view, rename, and remove registered passkeys from security settings.
- A minimum of one authentication method must remain registered; removing the last passkey requires adding a password credential first.
- Passkey removal requires fresh authentication and is audit-logged.

---

## 10. Recovery Codes

### 10.1 Recovery Code Issuance

- A set of recovery codes (default: 8 codes) is generated at the time of MFA enrollment.
- Recovery codes are presented to the member once, immediately after generation, with a strong prompt to store them securely.
- Codes are stored server-side as salted cryptographic hashes (never in plaintext).

### 10.2 Recovery Code Usage

- A recovery code bypasses MFA and grants access to the account when used.
- Each code is single-use; it is invalidated immediately upon use.
- Using a recovery code triggers:
  1. An immediate security notification sent to the member's registered email and phone.
  2. An immutable audit event capturing the actor, IP, device, and timestamp.
  3. A forced MFA re-enrollment prompt at next sign-in.

### 10.3 Recovery Code Regeneration

- Members may regenerate a new set of recovery codes at any time from security settings.
- Regeneration invalidates all previously issued codes.
- Regeneration requires fresh authentication (password or passkey + MFA).
- Regeneration is audit-logged.

### 10.4 Recovery Code Expiry

- Recovery codes do not expire by time, but they are invalidated in bulk on:
  - Password reset
  - Recovery code regeneration
  - Account security lockdown initiated by an operator

---

## 11. Role-Based Access Integration

### 11.1 Authentication and RBAC Separation

Authentication establishes identity. RBAC (documented in docs/RBAC.md) enforces what that identity may do. These are two separate, independently enforced systems.

- The authentication system issues tokens with `scope` and `sub` claims.
- The RBAC engine resolves permissions from those claims on every request.
- Authentication must not make permission decisions. RBAC must not alter session lifecycle or credential management.

### 11.2 Platform Roles and Authentication Experiences

Authentication surfaces and post-authentication experiences differ by role:

| Role | Authentication Path | Post-Authentication Experience |
|---|---|---|
| **Public Visitor** | No authentication required | Access to public marketing and informational content only. All banking, member, and operations routes require authentication. |
| **Member** | Email / Phone / Username + Password or Passkey + MFA | Member Center: accounts, transfers, investments, crypto, card management, chat, Member Advisor. |
| **Operations** | Email + Password or Passkey + MFA (TOTP or hardware key required) | Operations Dashboard: transaction monitoring, dispute management, member account management, compliance reporting. Step-up authentication for sensitive actions. |
| **VANTORIS iCommand** | Email + Passkey + Hardware MFA (highest assurance path) | Full platform access including executive analytics, security monitoring, system configuration, and audit log review. All high-risk actions require fresh authentication. |

### 11.3 Role Visibility

- Users only see UI elements, routes, and data that their role permits.
- Role-conditional rendering is driven by permission descriptors in `libs/ai/permissions`.
- The UI never reveals the existence of features or routes that the current role cannot access.
- Internal role codes, authority level identifiers, and permission keys are never exposed to clients.

### 11.4 Privilege Escalation Prevention

- A member may not elevate their own role or permissions through the authentication layer.
- Role assignments are managed exclusively by authorized operators through the Operations Center or iCommand administrative interfaces.
- Any attempt to access a resource above the authenticated role's permission level returns a generic 403 response (no details about why access is denied or what the resource requires).

---

## 12. High-Risk Action Re-Authentication

### 12.1 Policy

High-risk actions require fresh authentication regardless of existing session state. "Fresh authentication" means the member must re-verify their credential and complete MFA within a defined recency window (e.g., within the last 5 minutes).

This is enforced server-side. The client's session token age or `fresh_auth` claim is validated before any high-risk operation is authorized.

### 12.2 Actions Requiring Fresh Authentication

The following operations unconditionally require re-authentication:

**Financial Transactions**
- ACH transfers (initiation and approval)
- Domestic Wire transfers
- International Wire transfers
- Zelle payments
- Cryptocurrency transfers and withdrawals
- High-value bill payments (above configurable threshold)

**Card Management**
- Card activation
- Card freeze/unfreeze
- Card limit changes
- Virtual card creation
- Card cancellation

**Security Settings**
- Password change or reset
- Passkey registration and removal
- MFA method enrollment and removal
- Recovery code regeneration
- Trusted device registration and removal
- Session termination for other devices

**Verification Changes**
- Email address change
- Phone number change
- Identity document update
- Address change

**Account Management**
- Beneficiary addition or modification
- External account linking
- Account closure initiation

### 12.3 Step-Up Authentication Flow

```
Member Requests High-Risk Action
        ↓
Server Validates fresh_auth Claim in Token
        ↓
[fresh_auth within window?]
    [Yes] → Proceed with action (no interruption)
    [No]  → Step-Up Challenge Presented to Member
                    ↓
            Member Re-Authenticates (passkey / password + MFA)
                    ↓
            fresh_auth Updated in Session
                    ↓
            Action Proceeds
```

### 12.4 Step-Up Challenge Presentation

- Step-up challenges are presented inline within the current workflow; the member is not redirected to a separate sign-in page.
- The challenge clearly states the action requiring re-authentication without revealing internal permission details.
- A failed step-up challenge does not terminate the existing session; it only blocks the high-risk action.

---

## 13. Verification Center Integration

Authentication depends on the Verification Center for identity-bound credential events. The Verification Center is the single surface for identity and device verification (replacing any generic KYC page).

### 13.1 Verification Types Relevant to Authentication

| Verification Type | Trigger | Description |
|---|---|---|
| Email Verification | Account creation, email change | Token sent to email; member confirms ownership. |
| Phone Verification | Account creation, phone change, phone auth enrollment | OTP sent via SMS or voice call. |
| Identity Verification | Onboarding KYC, passkey registration (high assurance) | Document scan, liveness check, identity document validation. |
| Trusted Device Verification | New device registration | Confirms device binding with password + MFA approval. |

### 13.2 Verification States

Verification flows progress through canonical states:

`Unverified` → `IdentitySubmitted` → `UnderReview` → `Verified` | `Failed`

Authentication events that depend on a verification (e.g., phone authentication, passkey on a new device) must confirm that the relevant verification is in state `Verified` before proceeding.

### 13.3 Re-Verification Triggers

The following events trigger mandatory re-verification through the Verification Center:

- Adding or changing a phone number used for authentication
- Changing the email address used for authentication
- Registering a new trusted device
- Recovery code usage (triggers MFA re-enrollment)
- Suspected account compromise (triggered by security monitoring)

---

## 14. Audit and Observability

All authentication events produce immutable audit log entries. Audit events are append-only and forwarded to a tamper-evident audit store (see docs/DATABASE_ARCHITECTURE.md, audit schema).

### 14.1 Authentication Events to Audit

| Event | Logged Fields |
|---|---|
| Sign-in success | member_id, device_id, session_id, ip, location, auth_method, mfa_method, timestamp |
| Sign-in failure | attempted_identifier (masked), ip, device fingerprint, failure_reason, timestamp |
| MFA challenge presented | session_id, mfa_method, timestamp |
| MFA success / failure | session_id, mfa_method, attempt_count, timestamp |
| Session created | session_id, member_id, device_id, ip, timestamp |
| Session terminated (inactivity) | session_id, member_id, reason: inactivity, timestamp |
| Session terminated (explicit) | session_id, member_id, reason: signout, timestamp |
| Session terminated (security) | session_id, member_id, reason: security, correlation_id, timestamp |
| Passkey registered | member_id, device_id, credential_id, ip, timestamp |
| Passkey removed | member_id, credential_id, actor_id, ip, timestamp |
| Trusted device added | member_id, device_id, device_name, approval_method, ip, timestamp |
| Trusted device removed | member_id, device_id, actor_id, ip, timestamp |
| MFA method enrolled | member_id, mfa_method, ip, timestamp |
| MFA method removed | member_id, mfa_method, actor_id, ip, timestamp |
| Recovery code used | member_id, code_index (not value), ip, device fingerprint, timestamp |
| Recovery codes regenerated | member_id, actor_id, ip, timestamp |
| Step-up authentication completed | member_id, session_id, action, ip, timestamp |
| Password changed | member_id, actor_id, ip, timestamp |
| Account locked (MFA brute force) | member_id, ip, attempt_count, timestamp |

### 14.2 Correlation and Trace IDs

Every audit event carries a `correlation_id` (from the `X-Correlation-ID` request header) and a `trace_id` for end-to-end distributed tracing. These identifiers propagate through all async processing and are included in log output.

### 14.3 Audit Log Immutability

- Audit events are write-once. No update or delete operations are permitted on audit records.
- Audit tables use database privileges and application-layer enforcement to prevent mutation.
- For compliance-critical periods, audit partitions are archived to WORM-compatible storage.

---

## 15. Security Boundaries

Authentication spans multiple security boundaries defined in docs/ARCHITECTURE.md:

| Boundary | Authentication Role |
|---|---|
| **Network Boundary** | VPC / WAF / DDoS protection before authentication requests reach the API gateway. |
| **Application Boundary** | API Gateway validates JWT tokens, enforces rate limiting, and injects correlation headers on every inbound request. |
| **Service Boundary** | Each microservice independently validates the JWT (signature, expiry, scopes, device binding) and applies RBAC. |
| **Data Boundary** | Authentication credentials (password hashes, MFA secrets, recovery code hashes, passkey public keys) are stored in the members schema with field-level encryption for sensitive credential fields. |
| **Audit Boundary** | Authentication events are written to the immutable audit log service, isolated from the operational database. |

### 15.1 Rate Limiting

- Sign-in attempts: rate limited by IP and by account identifier.
- MFA attempts: rate limited per session (see Section 8.3).
- Passkey registration: rate limited per account.
- API Gateway enforces rate limit headers (`X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`).

### 15.2 Brute-Force and Credential Stuffing Protection

- Progressive delays on repeated sign-in failures from the same IP or account.
- Anomaly detection flags velocity attacks and geographic anomalies.
- CAPTCHA or proof-of-work challenges presented after threshold failures.
- Credential stuffing detection via compromised credential lookup integration.

### 15.3 Transport Security

- All authentication endpoints require TLS 1.3 (see docs/ARCHITECTURE.md, non-functional requirements).
- HSTS headers enforced on all authentication endpoints.
- Certificate pinning is recommended for the mobile client.

---

## 16. Base44 Migration Compatibility

This authentication architecture is designed to remain fully compatible with the future Base44 migration.

### 16.1 Compatibility Requirements

- Authentication service contracts and API endpoint paths defined here (and in `docs/api/auth.yaml`) must be preserved during the Base44 import.
- The member credential schema (`member_credentials` table) must map cleanly from the Base44 credential model without breaking password hashes or MFA enrollments.
- Session token formats must be backward compatible or include a migration period with dual token validation.
- Trusted device records must be migrated with their trust history intact.

### 16.2 Migration Constraints

- Do NOT generate authentication code in this repository before the Base44 export is imported.
- After import, refactor the Base44 authentication code to conform to this architecture rather than replacing it entirely.
- Authentication-related schema changes must use node-pg-migrate scripts and be tested against ephemeral databases in CI (see docs/DATABASE_ARCHITECTURE.md, docs/CI_CD.md).
- The Base44 import PR must include evidence that existing member sessions remain valid (or that a migration period is in place) before the PR is merged to main.

### 16.3 Post-Migration Verification

- After Base44 import, a smoke test suite must verify:
  - Email + password sign-in
  - MFA challenge and completion
  - Passkey authentication (where applicable on Base44)
  - Session inactivity termination
  - Trusted device management
  - Step-up authentication for a sample high-risk action

---

## 17. Cross-References

| Document | Relationship |
|---|---|
| `docs/ARCHITECTURE.md` | System-level architecture, security boundaries, TLS requirements, technology stack |
| `docs/API_ARCHITECTURE.md` | OAuth2/JWT token flow, `docs/api/auth.yaml` contract, correlation headers, rate limit headers |
| `docs/DATABASE_ARCHITECTURE.md` | members, devices, verification, audit, session schemas; Redis session model; trusted device rules |
| `docs/REPOSITORY_STANDARDS.md` | Trusted device policy, personalization rules, Verification Center standards, Base44 migration checklist |
| `docs/CODING_STANDARDS.md` | TypeScript profile model, permission gating implementation, personalization greeting rules |
| `docs/CI_CD.md` | Security scans (CodeQL, SAST, secret scanning), evidence requirements, staging smoke tests |
| `docs/COMPONENT_ARCHITECTURE.md` | UI component design for authentication forms (WebAuthn conditional UI, MFA inputs, sign-in forms) |
| `docs/RBAC.md` | (to be created) Role definitions, permission descriptors, authorization enforcement |
| `docs/SECURITY_STANDARDS.md` | (to be created) Encryption for credential storage, PII redaction, retention, audit log retention |
| `docs/VERIFICATION_CENTER.md` | (to be created) Verification flow details, third-party KYC provider integration, verification states |
| `docs/MIGRATION_GUIDE.md` | (to be created) Base44 import steps, credential schema mapping, session migration plan |
| `docs/api/auth.yaml` | (to be created) OpenAPI contract for authentication endpoints |
| `docs/api/trusted-devices.yaml` | (to be created) OpenAPI contract for trusted device management endpoints |
| `docs/api/verification.yaml` | (to be created) OpenAPI contract for Verification Center flows |

---

## 18. Dependencies and Gaps

The following dependencies are required by this authentication architecture but are not yet fully documented or implemented:

| Dependency | Status | Notes |
|---|---|---|
| `docs/RBAC.md` | Not yet created | Role definitions, permission descriptor schema, and RBAC enforcement model. Authentication (Section 11) depends on this. |
| `docs/SECURITY_STANDARDS.md` | Not yet created | Credential encryption standards, password hashing algorithm (bcrypt/argon2), MFA secret encryption, recovery code hashing, PII retention rules. |
| `docs/VERIFICATION_CENTER.md` | Not yet created | Trusted device verification flow, phone verification, identity document verification details. |
| `docs/api/auth.yaml` | Not yet created | OpenAPI contract for authentication endpoints. Required before any authentication implementation. |
| `docs/api/trusted-devices.yaml` | Not yet created | OpenAPI contract for trusted device endpoints. |
| `docs/MIGRATION_GUIDE.md` | Not yet created | Base44 credential schema mapping, session token migration strategy. |
| `libs/ai/permissions/*.yaml` | Not yet created | Permission descriptors for authentication-adjacent UI gating (passkey management, MFA settings). |
| Base44 export | Not yet received | Existing authentication implementation unknown; schema mapping TBD after import. |

**Identified gaps in this document:**

1. **Password policy** — Minimum length, complexity, and breach detection rules are not defined here. These belong in `docs/SECURITY_STANDARDS.md`.
2. **TOTP secret key length and algorithm** — Algorithm details (SHA-1 vs SHA-256, 6 vs 8 digits, 30-second window) belong in `docs/SECURITY_STANDARDS.md`.
3. **Session token signing algorithm** — RSA vs ECDSA key selection belongs in `docs/SECURITY_STANDARDS.md`.
4. **Exact inactivity threshold** — "5 to 10 minutes" is the range defined by policy; the precise per-role value is a configuration decision for `docs/SECURITY_STANDARDS.md`.
5. **MFA lockout thresholds** — Exact numbers (failure count, lockout duration) belong in `docs/SECURITY_STANDARDS.md`.
6. **Account type-specific signing rules for joint accounts** — Multi-party approval workflows are a banking operations concern outside authentication scope.
7. **SSO / enterprise federation** — SAML or OIDC federation for business accounts is not addressed in this document and requires a future design decision.

---

## 19. Remaining Documentation

The following documents remain to be authored (in priority order based on dependencies):

| Document | Priority | Why |
|---|---|---|
| `docs/RBAC.md` | High | Authentication (Section 11) references role definitions and permission descriptors that must be canonicalized. |
| `docs/SECURITY_STANDARDS.md` | High | Authentication depends on credential encryption, password hashing, token signing, and session security standards. |
| `docs/VERIFICATION_CENTER.md` | High | Authentication integration with the Verification Center (Section 13) requires documented verification flows and vendor API contracts. |
| `docs/MIGRATION_GUIDE.md` | Medium | Base44 import steps and credential schema migration plan. |
| `docs/TESTING.md` | Medium | Authentication test matrix: unit, integration, E2E, and contract tests for all authentication flows. |
| `docs/DESIGN_SYSTEM.md` | Medium | Sign-in, MFA, passkey, and trusted device UI component specifications. |
| `docs/DOCUMENTATION_STANDARDS.md` | Low | Documentation authoring standards for the repository. |
| `docs/api/auth.yaml` | High | OpenAPI contract; required before any authentication implementation work begins. |
| `docs/api/trusted-devices.yaml` | High | OpenAPI contract for trusted device management. |
| `docs/api/verification.yaml` | High | OpenAPI contract for Verification Center. |

---

## 20. Recommendations Before Next Document

1. **Create `docs/RBAC.md` immediately.** Authentication is the gateway; RBAC is what determines what authenticated members and operators can do. Without RBAC, the role-based experience differences described in Section 11 are undefined. RBAC should be the next document authored.

2. **Create `docs/SECURITY_STANDARDS.md` concurrently or immediately after RBAC.** Authentication depends on specific cryptographic choices (password hashing, token signing, MFA secret storage) that must be canonicalized before any implementation begins on the Base44 import.

3. **Create `docs/api/auth.yaml` as the first API contract.** Authentication is the entry point for all platform functionality. The OpenAPI contract for authentication endpoints must exist before the Base44 export is imported so that the import can be validated against it.

4. **Define the exact inactivity threshold per role.** The current policy is "5 to 10 minutes." This range should be resolved to specific per-role values (e.g., Member: 10 minutes, Operations: 5 minutes, iCommand: 5 minutes) in `docs/SECURITY_STANDARDS.md` to enable precise session management implementation.

5. **Decide on the SSO / enterprise federation strategy for business accounts.** Business account operators may require integration with enterprise identity providers (SAML, OIDC federation). This decision should be documented in `docs/RBAC.md` or a dedicated `docs/SSO.md`.

6. **Validate Base44 credential compatibility early.** Before the Base44 import PR is approved, a schema discovery step should map the existing credential tables, MFA enrollments, and session structures to this architecture to identify any migration gaps.

---

## Files Created

- `docs/AUTHENTICATION.md`

## Summary of Changes

This commit introduces the normative authentication architecture for VANTORIS. The document covers:

- Seven authentication methods (email, phone, username, passkeys, biometrics, MFA, recovery codes) with policy and flow for each
- Three account types (personal, joint, business) and distinct onboarding vs. sign-in paths
- Member profile model with legal name fields and display priority rules
- Session lifecycle with 5–10 minute inactivity termination and full session termination policy
- Trusted device policy (maximum two devices, explicit removal required before adding a third)
- JWT/OAuth2 token architecture with PKCE, refresh token rotation, and scope binding
- MFA flows, enrollment, lockout, and downgrade prevention
- WebAuthn passkey registration and authentication flows
- Recovery code issuance, usage, and regeneration policies
- RBAC integration with four role-differentiated experiences
- Step-up authentication requirements for all high-risk actions
- Verification Center integration for device registration and identity-bound credential events
- Comprehensive audit event catalog with required fields
- Security boundary mapping across network, application, service, data, and audit layers
- Base44 migration compatibility requirements and post-migration verification checklist

This document is documentation-only. No application code is generated.

---

*This is a documentation-only commit. No application code, SQL migrations, or infrastructure artifacts are generated.*
