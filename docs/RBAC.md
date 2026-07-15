# RBAC — Role-Based Access Control

Status: normative documentation-only. This document defines the complete authorization model for VANTORIS. Authentication (see `docs/AUTHENTICATION.md`) establishes identity. RBAC determines what an authenticated identity is permitted to see and do. All architectural decisions in this document are drawn from and consistent with: `README.md`, `docs/ARCHITECTURE.md`, `docs/COMPONENT_ARCHITECTURE.md`, `docs/REPOSITORY_STRUCTURE.md`, `docs/REPOSITORY_STANDARDS.md`, `docs/CODING_STANDARDS.md`, `docs/CI_CD.md`, `docs/API_ARCHITECTURE.md`, and `docs/DATABASE_ARCHITECTURE.md`.

Do not generate application code, SQL, or infrastructure from this document.

---

## 1. Foundational Principles

### 1.1 Separation of Authentication and Authorization

Authentication and authorization are strictly separated concerns in VANTORIS:

- **Authentication** — establishes the identity of a user (who they are). Handled by the Authentication Service using OAuth 2.0 / OIDC, JWT, MFA, WebAuthn/Passkeys, and Biometrics. See `docs/AUTHENTICATION.md`.
- **Authorization** — determines what an authenticated identity is permitted to see and do (what they can access). Handled by the Authorization Engine using RBAC as defined in this document.

An authenticated session does not imply any permission. Every access decision is independently evaluated against the permission model.

### 1.2 Zero Trust Authorization

VANTORIS adopts a Zero Trust authorization posture consistent with its Zero Trust security architecture (`docs/ARCHITECTURE.md` — Security & Compliance Layer):

- Every request must present a valid token and be evaluated against the permission model, regardless of network origin.
- Backend services enforce permissions independently; gateway-level RBAC hints (`docs/API_ARCHITECTURE.md` — API Gateway & Edge) are advisory and must not substitute for backend enforcement.
- Permissions are re-evaluated on every request. A permission granted during session initiation does not persist if the user's role or assignment changes.

### 1.3 Least Privilege

Every role grants only the minimum permissions required to perform the functions of that role. No role inherits permissions from a higher-privilege role unless explicitly defined in this document.

### 1.4 Separation of Duties

Administrative, operational, financial, security, and governance functions are separated across distinct roles. No single user can both initiate and approve a financial transaction, configure the platform and override security controls, or manage compliance and audit their own actions.

### 1.5 Visibility Rules

The following rules apply universally across all roles and all surfaces (web, mobile, AI assistant, chat):

- **Hide, do not disable**: Every feature, menu item, action button, and navigation element that a user is not permitted to access must be hidden entirely. Disabled states that reveal the existence of a restricted function are not permitted.
- **Never expose hidden authorities**: No role may see authority level identifiers, internal authority codes, permission keys, or internal system permission labels.
- **Never expose authority identifiers**: Role names and codes used in the database, token claims, or permission descriptors must not surface in the user interface.
- **Scope isolation**: Users must never see data belonging to other members, other roles, or other organizational scopes unless explicitly granted by this model.

### 1.6 Unified Operating Experience

VANTORIS provides a unified operating experience. Members and operators perform all their work within VANTORIS. External integrations are abstracted behind the platform. The authorization model must support this principle:

- Permission enforcement must not fragment the user experience or require context-switching to external systems.
- AI assistants, workflows, and chat surfaces operate within the same permission boundary as the authenticated user.
- Step-up authentication (fresh auth for high-risk actions) may be required per session security rules but must be presented as a seamless in-platform flow.

---

## 2. User Types and Role Definitions

VANTORIS defines seven user types. Each user type maps to a role scope with a specific permission set.

| User Type | Role Scope | Primary Surface |
|---|---|---|
| Public Visitor | `public` | Marketing / Onboarding |
| Member | `member` | Member Center |
| Joint Member | `joint_member` | Member Center (shared account scope) |
| Business Member | `business_member` | Member Center (organization scope) |
| Operations | `operations` | Operations Center |
| Support & Member Services | `support` | Operations Center (support surface) |
| VANTORIS iCommand | `icommand` | iCommand Dashboard |

### 2.1 Role Hierarchy

Roles are not hierarchically inherited. Each role is independent. A higher-authority role does not automatically grant the permissions of a lower-authority role unless explicitly specified. iCommand operators do not automatically have member permissions, and support agents do not have operations permissions.

---

## 3. Public Visitor

### 3.1 Definition

A Public Visitor is an unauthenticated user accessing the VANTORIS platform. No authentication context exists.

### 3.2 Permitted Access

- Marketing and informational pages
- Account creation and onboarding flows (Personal, Joint, Business)
- Sign-in page (returning users are directed here; new users proceed through onboarding)
- Public support content (FAQ, help articles)
- Contact / inquiry forms

### 3.3 Prohibited Access

- Any authenticated route or surface
- Member Center, Operations Center, iCommand Dashboard
- Any data, resource, or API endpoint requiring an authenticated identity
- Any AI assistant capability

### 3.4 Visibility Rules

No authenticated navigation, account controls, or system features are visible or reachable by Public Visitors. Onboarding flows guide new users through account creation; returning users are directed to sign-in without re-presenting onboarding entry points.

---

## 4. Member

### 4.1 Definition

A Member is an authenticated individual with a personal banking account on VANTORIS. The Member role provides access exclusively to that member's own data and account functions.

### 4.2 Permitted Access — Own Data Only

A Member may access the following resources, scoped exclusively to their own account:

| Domain | Permitted Operations |
|---|---|
| Accounts | View own accounts, balances, account details |
| Cards | View own cards, manage card controls, freeze/unfreeze own cards |
| Investments | View own investment portfolios and positions, initiate trades |
| Credit | View own credit accounts, credit utilization, payment schedules |
| Documents | View and download own documents |
| Statements | View and download own account statements |
| Notifications | View and manage own notifications and notification preferences |
| Verification Center | Complete own identity verification, submit verification documents |
| Support Conversations | Initiate and participate in own support conversations |
| Transfers | Initiate fund transfers (ACH, Wire, Zelle, internal) from own accounts |
| Payments | Initiate bill payments, view own payment history |
| Crypto | View own crypto wallets, initiate own crypto transactions |
| Profile & Settings | View and update own profile (Legal First Name, Legal Middle Name, Legal Last Name, Preferred Name), security settings, trusted devices |
| AI Member Advisor | Use the Member Advisor AI, which inherits the member's permission scope |

### 4.3 Strict Prohibitions — Never Permitted

A Member must never be permitted to access:

- Records, accounts, documents, or transactions belonging to any other member
- Internal notes, internal case records, or internal operational comments
- Internal cases or case management queues
- Internal chat channels between operations staff
- Audit logs or audit event records
- Operations data, operations dashboards, or operations metrics
- Platform configuration, system settings, or administrative controls
- Any permission keys, role identifiers, or authority codes
- Any data or surface outside their own account scope

### 4.4 Display Rules

- The member's preferred display name follows the priority order: **Preferred Name → Legal First Name → Legal First Name + Legal Last Name**.
- Email usernames must never be used as a display name or greeting.
- Legal name (Legal First Name + Legal Middle Name + Legal Last Name) is used exclusively for verification, compliance, legal documents, statements, contracts, and regulatory reporting and is not displayed as a general greeting.

### 4.5 Navigation

The Member Center navigation must surface only the sections the member is permitted to use. No operations, support, or iCommand navigation items are visible.

---

## 5. Joint Member

### 5.1 Definition

A Joint Member is a member who holds or participates in a joint account. Joint accounts are created during onboarding and involve two or more individuals sharing a single account. Each participant in a joint account is authenticated individually and inherits the Member role for their own profile while gaining shared access to the joint account scope.

### 5.2 Permitted Access

All permissions defined for the Member role apply, plus:

| Domain | Permitted Operations |
|---|---|
| Joint Account | View joint account balance, transaction history, statements |
| Joint Account Cards | View and manage cards issued under the joint account |
| Joint Account Documents | View and download documents associated with the joint account |
| Joint Account Notifications | View notifications relevant to the joint account |
| Joint Account Transfers | Initiate transfers from the joint account (subject to account-level controls) |
| Joint Account Support | Initiate support conversations referencing the joint account |

### 5.3 Strict Prohibitions

A Joint Member is subject to all prohibitions of the Member role. In addition:

- A Joint Member may not see the other joint account holder's personal (non-joint) accounts, documents, or profile data.
- A Joint Member may not unilaterally close the joint account or remove another joint account holder. Such actions require defined authorization controls.
- A Joint Member may not access any operations, support-staff, or iCommand surfaces.

### 5.4 Scope Boundary

The joint account scope is additive. Joint Members access the joint account as a shared resource. Each member's personal accounts remain private and invisible to the other joint account holder.

---

## 6. Business Member

### 6.1 Definition

A Business Member is a member who holds or participates in a business banking account. Business accounts are associated with an organization entity and may involve multiple authorized individuals (e.g., account owners, authorized signers). Each individual authenticates under their own identity and receives organization-scoped access defined by their role within the organization.

### 6.2 Permitted Access

All permissions defined for the Member role apply, plus:

| Domain | Permitted Operations |
|---|---|
| Business Account | View business account balances, transaction history, statements |
| Business Cards | View and manage business cards assigned to the user within the organization |
| Business Documents | View and download business account documents |
| Business Statements | View and download business account statements |
| Business Payments | Initiate business payments (ACH, Wire, Bill Pay) subject to organization-defined limits and authorization rules |
| Business Investments | View and manage business investment portfolios |
| Business Verification | Complete and manage business verification submissions |
| Business Support | Initiate support conversations referencing the business account |

### 6.3 Organization Role Separation

Within a business account, organization-level roles (e.g., Owner, Authorized Signer, Viewer) govern what each individual within the organization can perform. These intra-organization roles are a sub-layer of the Business Member role and must be defined in the organization's access model. At the platform level, Business Members are scoped to their organization and must never access another organization's data.

### 6.4 Strict Prohibitions

- Business Members may not access other organizations' data.
- Business Members may not access operations, support-staff, or iCommand surfaces.
- Business Members may not view other members' personal account data, even if those members are also participants in the same organization.

---

## 7. Operations

### 7.1 Definition

Operations staff are internal VANTORIS employees responsible for reviewing member activity, managing cases, and overseeing transactional and verification workflows. The Operations role provides access to member records and operational tools but does not grant authority over platform configuration, security policy, or governance.

### 7.2 Permitted Access

| Domain | Permitted Operations |
|---|---|
| Member Review | View member profiles (name, account status, verification status) for operational purposes |
| Verification Review | Review member identity verification submissions and results |
| Transaction Review | View and review member transactions for operational and compliance purposes |
| Case Management | Create, update, assign, and close operational cases |
| Support Management | View and manage support tickets and escalations |
| Assigned Work Queue | View and act on work assigned to the operator |
| Member Communication | Communicate with members via the in-platform messaging system |
| AI Operations Assistant | Use the AI Operations Assistant, which inherits the operator's permission scope |
| Reporting | View operational reports within their assigned scope |
| Documents Review | View documents submitted by members for operational processing |

### 7.3 Strict Prohibitions

Operations staff must not be permitted to:

- Change platform configuration, system settings, or administrative controls
- View hidden authority levels, authority identifiers, or internal permission keys
- Access executive governance functions, compliance oversight dashboards, or iCommand surfaces
- Approve or override security policy settings
- Access AI governance controls
- View or modify audit log records (audit logs are read-only via designated compliance channels only)
- Create member accounts or provision platform resources

### 7.4 Data Visibility Boundaries

Operations staff may view member data required for their operational function. They must not be able to export raw member PII in bulk, access member financial credentials, or view member authentication records.

### 7.5 AI Operations Assistant

The AI Operations Assistant available to Operations staff inherits the operator's permission scope. The assistant may surface member data, case information, and operational workflows that are within the operator's permitted access. The assistant must not surface or infer data outside the operator's permissions, including platform configuration, hidden authority data, or iCommand governance information.

---

## 8. Support & Member Services

### 8.1 Definition

Support & Member Services staff are internal VANTORIS employees responsible for front-line member support interactions. The Support role is a constrained subset of the Operations role, focused on communication and ticket management.

### 8.2 Permitted Access

| Domain | Permitted Operations |
|---|---|
| Member Chat | Initiate and participate in chat conversations with members via the in-platform messaging system |
| Ticket Management | Create, update, and track support tickets |
| Document Upload | Upload documents on behalf of members as part of a support workflow |
| Appointment Scheduling | Schedule appointments for members (e.g., callback, advisor meeting) |
| Case Escalation | Escalate cases to Operations or iCommand as appropriate |
| Member Profile (read-only) | View member name and contact information required for support interactions |

### 8.3 Strict Prohibitions

Support & Member Services staff must not be permitted to:

- Approve, authorize, or execute financial transactions of any kind
- Approve or override security actions (e.g., trusted device approvals, MFA resets)
- Access case management queues beyond their escalation capability
- Access full transaction history or detailed financial records
- Access operations dashboards or operational metrics
- Access platform configuration or administrative controls
- Access iCommand surfaces or governance functions
- Approve verification submissions

### 8.4 Escalation Path

Support staff escalate cases to Operations for financial, verification, or operational matters. Operations may further escalate to iCommand for governance or policy matters. Support staff do not have visibility into escalation outcomes beyond the escalation confirmation.

---

## 9. VANTORIS iCommand

### 9.1 Definition

VANTORIS iCommand is the highest operational authority on the platform. iCommand personnel are responsible for governance, platform configuration, security policy, AI governance, compliance oversight, and executive reporting. All iCommand actions are subject to immutable audit logging.

### 9.2 Permitted Access

| Domain | Permitted Operations |
|---|---|
| Governance | Review and establish platform governance policies |
| Platform Configuration | Configure platform settings, feature flags, and system parameters |
| Security Policy | Define, review, and enforce security policies and controls |
| AI Governance | Configure and govern AI assistant behavior, permission scopes, and guardrails |
| Compliance Oversight | Access compliance dashboards, regulatory reports, and compliance monitoring tools |
| Reporting | Access executive-level reporting and business intelligence |
| Audit Review | Read-only access to the immutable audit log for compliance and governance purposes |
| Role & Permission Management | Define and manage role definitions and permission assignments for all other roles |
| Escalated Cases | Review cases escalated from Operations |
| User Administration | Manage internal user accounts for Operations and Support staff |

### 9.3 Full Audit Requirement

Every action performed by iCommand personnel — including configuration changes, policy updates, role assignments, and compliance reviews — must produce an immutable audit event. The audit event must capture: actor identity, device, session, action, resource, before state, after state, correlation ID, and timestamp.

iCommand personnel may not modify or delete audit records, including their own.

### 9.4 Separation from Member Access

iCommand personnel do not have automatic access to individual member financial accounts, individual member AI conversations, or individual member documents beyond what is required for compliance review and escalated case handling. Member data accessed during compliance review must be logged.

### 9.5 Strict Prohibitions

- iCommand personnel may not modify or delete audit log entries.
- iCommand actions that change platform security posture require dual authorization where platform policy mandates it.
- iCommand surfaces must not be reachable from the Member Center, Operations Center, or Support surfaces under any condition.

---

## 10. AI Assistant Permission Model

### 10.1 Principle: Inherit the Signed-In User's Permissions

Every AI Assistant available on VANTORIS — the Member Advisor, the AI Operations Assistant, and any future AI capability — must inherit the permissions of the signed-in user exactly. The AI assistant is an extension of the user's session; it does not hold independent permissions.

### 10.2 Rules

- **Scoped to the user**: The AI may only access, surface, and act upon data and resources the signed-in user is explicitly authorized to access.
- **No privilege escalation**: The AI must not use system-level prompts, tool calls, or internal capabilities to access data beyond the user's permission scope.
- **No information leakage**: The AI must never reveal, infer, or summarize information outside the user's permitted scope — including member records outside the user's own scope, internal notes, internal cases, audit logs, operations data, or platform configuration.
- **Visible actions only**: The AI may only surface and offer actions the user is authorized to perform. Actions requiring permissions the user does not hold must be hidden from the AI's action catalog for that user.
- **Permission-aware action catalog**: The AI Action Catalog (per `docs/API_ARCHITECTURE.md` — AI Command Center APIs, Action Catalog endpoint) must return only actions permitted by the caller's token and permission scope.
- **Memory and conversation isolation**: AI memory, conversation history, and context are isolated per user. No AI instance may access another user's memory, conversation, or context.
- **Prompt injection protection**: AI assistants must enforce prompt injection protections that prevent external content from manipulating the AI into violating the user's permission scope.
- **Audit of AI actions**: Every action executed by an AI assistant on behalf of a user must produce an audit event attributed to the user, including the action name, inputs, outputs, and permission key used.

### 10.3 AI and Hidden Authority

AI assistants must never reveal internal permission descriptors, authority levels, authority identifiers, or role codes — even when queried directly. The AI must not be able to answer questions about the internal permission model, role assignments, or authority structure.

---

## 11. Rules Engine Integration

### 11.1 RBAC and the Rules Engine

VANTORIS uses a Rules Engine for workflow automation, task routing, and automated decision support (`docs/ARCHITECTURE.md` — AI & Intelligence Layer, Automation Engine). The RBAC model integrates with the Rules Engine as follows:

- **Permission-based task assignment**: The Rules Engine assigns tasks to users and roles based on their permissions. A task requiring Operations access may only be assigned to an operator. A task requiring iCommand approval may only be routed to iCommand.
- **Workflow routing**: Automated workflows consult the RBAC model to determine eligible actors for each workflow step. Workflow routing must respect all permission boundaries defined in this document.
- **Escalation routing**: Escalation paths (Support → Operations → iCommand) are encoded in the Rules Engine and must not bypass the authorization model.
- **Event-driven permission checks**: When the Rules Engine triggers actions on behalf of a user or role (e.g., automatic case creation, notification dispatch), the triggering context must include an actor identity whose permissions authorize the action.
- **No system-level bypass**: The Rules Engine must not have a system-level permission that bypasses RBAC. Every Rules Engine action must be attributable to an authorized actor.

### 11.2 Automated Actions and Audit

All actions initiated by the Rules Engine — whether triggered automatically or as part of a workflow — must produce audit events attributed to the initiating actor and the automated rule or workflow definition. This ensures full traceability of automated decisions.

---

## 12. API and Backend Enforcement

### 12.1 Backend Is Authoritative

The API gateway may provide RBAC hints (visibility hints for allowed actions) as defined in `docs/API_ARCHITECTURE.md`, but the backend service is always the authoritative enforcer of permissions. A valid gateway token with an RBAC hint does not grant access; the backend must independently verify the caller's permissions before returning data or executing an action.

### 12.2 Permission Discovery API

The Permission Discovery endpoint (`GET /v1/ai/permissions?actor={id}`, per `docs/API_ARCHITECTURE.md`) returns the allowed actions for the authenticated caller. This endpoint must:

- Return only actions and resources the caller is explicitly permitted to access.
- Never return hidden authority levels, permission keys, or role identifiers that must not be visible to the user.
- Be called by AI assistants and dynamic navigation systems to determine visible actions.

### 12.3 Row-Level Security

All member data must be protected by row-level access controls consistent with the tenancy model defined in `docs/DATABASE_ARCHITECTURE.md` (shared schema + row-level security). Member-scoped queries must always include the authenticated member's identity as a filter condition. Cross-member data access is not permitted without explicit operational or compliance authorization.

### 12.4 Token Scopes

OAuth 2.0 token scopes (`docs/API_ARCHITECTURE.md` — Authentication & Authorization) must map to RBAC permission sets. Fine-grained scopes are issued per role type. A member's token must not carry scopes that permit access to operations or iCommand resources.

---

## 13. Session and Device Context

### 13.1 Session Binding

RBAC decisions are evaluated in the context of an authenticated session. Session security rules from the database architecture (`docs/DATABASE_ARCHITECTURE.md` — Session security model) apply:

- Sessions are stored in Redis with session_id and device_id association.
- Maximum of two trusted devices per account.
- Inactivity: UI lock after 2 minutes; full session termination after 5–10 minutes depending on risk profile.
- High-risk actions require fresh authentication (re-authentication with MFA challenge).

### 13.2 Device Trust and Role Enforcement

Device trust is established during authentication. RBAC enforcement must account for device trust state: actions available on a trusted device may differ from actions available in an untrusted session (e.g., high-value transfers may require a trusted device).

### 13.3 Step-Up Authentication

For actions that require step-up authentication (ACH, Wire, Zelle, crypto, card management, security changes, verification management), the RBAC model must ensure:

- The required authentication level is verified before the action is permitted.
- Step-up is enforced in the backend regardless of UI state.
- The AI assistant cannot circumvent step-up requirements on behalf of a user.

---

## 14. Base44 Migration Compatibility

### 14.1 Authorization Model Continuity

The RBAC model defined in this document must remain fully compatible with the Base44 migration. During migration:

- Role assignments and permission mappings from the Base44 export must be mapped to the roles defined in this document.
- Legacy role codes or authority identifiers from Base44 must not be exposed in the migrated platform's user interfaces.
- The migration plan (`docs/MIGRATION_GUIDE.md`, to be created) must include a role and permission mapping table that maps Base44 role structures to VANTORIS RBAC roles.

### 14.2 No Breaking Changes

The roles defined in this document are the target state. Any divergence in the Base44 export must be resolved by mapping to the target roles during migration, not by introducing new roles without governance approval and documentation.

---

## 15. Implementation Guidance

This document is normative documentation only. It does not generate application code, SQL migrations, or infrastructure. Implementation teams must:

1. Implement the Authorization Engine to evaluate permissions on every request per this model.
2. Implement Permission Discovery API to return allowed actions per authenticated caller.
3. Implement row-level security in the database per `docs/DATABASE_ARCHITECTURE.md`.
4. Wire AI action catalogs to the Permission Discovery API so each AI assistant only surfaces permitted actions.
5. Ensure the Rules Engine consults the permission model for task assignment and workflow routing.
6. Produce immutable audit events for all privileged and iCommand actions.
7. Enforce hide-not-disable for all navigation and UI elements.
8. Validate Base44 export role mappings against this model during migration.

---

## Cross-References

| Document | Relationship |
|---|---|
| `docs/AUTHENTICATION.md` | Authentication (identity) — RBAC (authorization) boundary; session management; trusted devices; step-up auth |
| `docs/ARCHITECTURE.md` | Authorization Engine (RBAC/ABAC), Security & Compliance Layer, Zero Trust model, Audit Logger |
| `docs/API_ARCHITECTURE.md` | Permission Discovery API, Action Catalog, gateway RBAC hints, token scopes, audit events |
| `docs/DATABASE_ARCHITECTURE.md` | Row-level security, session model, trusted devices schema, audit_events schema, AI permissions |
| `docs/COMPONENT_ARCHITECTURE.md` | PermissionMatrix component, navigation visibility rules, hide-not-disable UI enforcement |
| `docs/CI_CD.md` | Permission-aware CI tests, authorization integration tests, Evidence requirements |
| `docs/CODING_STANDARDS.md` | Type safety for permission descriptors, RBAC enforcement patterns |
| `docs/REPOSITORY_STANDARDS.md` | Evidence-based reporting, Implementation-First requirements for RBAC features |
| `docs/SECURITY_STANDARDS.md` (to be created) | Encryption, audit retention, PII rules, step-up auth policy |
| `docs/MIGRATION_GUIDE.md` (to be created) | Base44 role mapping table, RBAC migration steps |
| `docs/VERIFICATION_CENTER.md` (to be created) | Member and Operations verification workflows and role-scoped access |

---

## Dependencies and Gaps Discovered

| Dependency / Gap | Status | Owner Document |
|---|---|---|
| `docs/AUTHENTICATION.md` — authentication model, session rules, trusted device flow | Not yet committed | To be created |
| `docs/SECURITY_STANDARDS.md` — PCI, AML, KYC, encryption, step-up auth policy, retention | Not yet committed | To be created |
| `docs/MIGRATION_GUIDE.md` — Base44 role mapping and RBAC migration steps | Not yet created | To be created |
| `docs/VERIFICATION_CENTER.md` — verification workflows and role-based access by verification type | Not yet created | To be created |
| Organization-level intra-role model (Owner, Authorized Signer, Viewer within Business accounts) | Not yet defined | To be addressed in Business Account or RBAC extension document |
| Dual authorization rules for iCommand configuration changes | Policy not yet defined | Requires governance decision |
| Rules Engine workflow definitions referencing RBAC roles | Not yet created | To be defined during Rules Engine implementation |

---

## Remaining Documentation

The following documents remain to be created to complete the VANTORIS documentation set:

| Document | Purpose |
|---|---|
| `docs/AUTHENTICATION.md` | Production-grade authentication architecture, session management, trusted devices, Base44 compatibility |
| `docs/SECURITY_STANDARDS.md` | Zero Trust, encryption, audit logging, PCI DSS, AML/KYC, step-up auth policy, AI security, chat security |
| `docs/VERIFICATION_CENTER.md` | Verification workflows, provider integration, verification status model, role-scoped access |
| `docs/MIGRATION_GUIDE.md` | Base44 export import plan, schema mapping, RBAC role mapping, migration steps |
| `docs/DESIGN_SYSTEM.md` | Design tokens, accessibility standards, component library |
| `docs/TESTING.md` | Testing strategy, test types, CI enforcement, evidence requirements |
| `docs/DOCUMENTATION_STANDARDS.md` | Documentation standards and conventions for the VANTORIS repository |
| `docs/api/*.yaml` | OpenAPI contract skeletons for all banking and platform APIs |

---

## Recommendations Before the Next Document

1. **Create `docs/AUTHENTICATION.md` next** — RBAC depends on authentication establishing identity and session context. The authentication document will define session termination, trusted device approval flows, and step-up auth triggers that RBAC enforces.

2. **Create `docs/SECURITY_STANDARDS.md` before implementation begins** — Step-up authentication policy, encryption requirements for permission data, and audit retention rules are referenced in this document and must be normatively defined before implementation.

3. **Define the organization-level intra-role model** — Business account access requires sub-roles (Owner, Authorized Signer, Viewer). Define these in a dedicated section of this document or in a Business Accounts addendum before the Base44 migration exposes the data.

4. **Define dual-authorization rules for iCommand** — Platform security posture changes and compliance overrides require dual authorization. This policy must be documented before iCommand surfaces are built.

5. **Wire CI to permission-aware tests early** — Per `docs/CI_CD.md`, authorization integration tests must be included in CI. Create test scaffolding that asserts a limited-role account cannot see or call privileged endpoints. Include this as Evidence for RBAC feature completion.

6. **Decide on tenancy strategy before RBAC enforcement** — Per `docs/DATABASE_ARCHITECTURE.md`, the shared schema + row-level security model is recommended. Confirm this decision so the Authorization Engine can be designed against a concrete tenancy model.

---

## Files Created by This Commit

- `docs/RBAC.md`

This is a documentation-only commit. No application code, SQL migrations, or infrastructure artifacts were generated.
