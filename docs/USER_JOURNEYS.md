# USER JOURNEYS — VANTORIS

Status: normative documentation-only. This document is the official workflow reference for all VANTORIS members, operators, AI assistants, the Rules Engine, and VANTORIS iCommand. Every major user workflow is defined from beginning to end. No workflow may deviate from this document without an approved design change.

---

## PURPOSE

Define every major workflow in VANTORIS from beginning to end.

This document is the single source of truth for:

- Every user journey across all platform surfaces
- Every workflow the Rules Engine automates
- Every workflow the AI Assistant executes
- Every workflow operators follow
- Every workflow VANTORIS iCommand governs

This document incorporates all architectural decisions from the following sources:
- `docs/ARCHITECTURE.md` — system architecture and domain boundaries
- `docs/COMPONENT_ARCHITECTURE.md` — UI component flows and onboarding steps
- `docs/REPOSITORY_STANDARDS.md` — AI Command Center, Member Advisor, Verification Center, Trusted Devices, Universal Chat requirements
- `docs/API_ARCHITECTURE.md` — verification states, deep-link standards, AI API endpoints
- `docs/DATABASE_ARCHITECTURE.md` — data models for members, accounts, transactions, verification, devices, audit
- `docs/CODING_STANDARDS.md` — permission gating, personalization, chat, verification standards
- `docs/CI_CD.md` — evidence-based verification requirements
- `docs/REPOSITORY_STRUCTURE.md` — canonical repository layout
- `README.md` — platform module overview

---

## GENERAL PRINCIPLES

The following rules apply to every workflow in this document:

- **One home per feature.** Every feature has exactly one permanent home in the navigation. Features are never duplicated across workspaces.
- **Role-aware rendering.** Every surface shows only what the current user's role, permissions, account type, and verification status allow. Navigation, buttons, and actions are never shown to unauthorized users.
- **Returning members go directly to Sign In.** Onboarding is shown only to new members who have not previously completed registration.
- **Audit everything.** Every state change, action, and decision produces an immutable audit event.
- **No dead-end actions.** Every button, link, and AI action defines a destination, a required permission, a success path, a failure path, a notification, and an audit event.
- **AI is context-aware.** The AI Assistant receives the current user identity, current role, current permissions, current screen context, and available actions before generating any recommendation or executing any action.
- **Rules Engine is always active.** The Rules Engine monitors every event, applies automated rules, routes work, and escalates issues without manual intervention.
- **Personalization.** All greetings and displays use PreferredName when present, falling back to FirstName. Email usernames are never used as display names.
- **Session management.** Sessions lock after 2 minutes of inactivity. Sessions terminate after 5–10 minutes depending on risk profile. High-risk actions require fresh MFA re-authentication.
- **Base44 compatibility.** All workflows remain fully compatible with the imported Base44 application. No workflow may be changed without verifying compatibility with the Base44 implementation.

---

## 1. PUBLIC WEBSITE JOURNEY

### 1.1 Overview

The public website is the external-facing entry point for VANTORIS. It is accessible to visitors without authentication. Its purpose is to present VANTORIS products and services and direct visitors to the appropriate action (Sign In or Open Account).

### 1.2 Navigation Structure

| Section | Purpose |
|---|---|
| Home | Hero section and platform overview |
| Personal Banking | Individual account products and features |
| Business Banking | Business account products and features |
| Wealth & Investments | Investment and wealth management products |
| Credit & Lending | Credit cards, personal loans, mortgage products |
| HeroBox | Community giving and impact banking features |
| Community | NGO portal, community programs |
| Financial Education | Educational resources, guides, calculators |
| Help | Support resources and FAQ |
| Contact | Contact forms and office locations |
| Sign In | Authentication entry point for returning members |
| Open Account | Onboarding entry point for new members |

### 1.3 Visitor Flow

```
Visitor arrives at public website
  │
  ├── Returning Member → clicks Sign In → Member Login Journey (Section 3)
  │
  └── New Visitor
        │
        ├── Browses product pages (Personal Banking, Business Banking, Wealth, Credit, HeroBox)
        │
        ├── Clicks Open Account → Member Onboarding Journey (Section 2)
        │
        └── Clicks Help / Contact → Support entry (no authentication required for public support)
```

### 1.4 Key Rules

- Returning members always see Sign In as the primary call to action on the header.
- New members see Open Account as the primary call to action on the hero section.
- The public website never exposes member data, account information, operations tools, or internal platform features.
- Session state from a previous login is detected: if a valid session exists, the platform redirects to the member dashboard rather than showing the public homepage.

---

## 2. MEMBER ONBOARDING JOURNEY

### 2.1 Overview

The onboarding journey is the process by which a new visitor applies to become a VANTORIS member. It begins after clicking Open Account on the public website and ends with the member receiving access to their dashboard.

This journey is shown only to members who have not previously completed onboarding. Returning members bypass this journey entirely and proceed to Sign In.

### 2.2 Onboarding Steps

```
Step 1: Application
  │  Member selects account type (Personal, Business, Joint)
  │  Member provides: first name, last name, preferred name, email, phone
  │  Member accepts terms and privacy policy
  │  System creates a pending application record
  │  Rules Engine: validates inputs, checks eligibility, assigns application to review queue
  │
Step 2: Identity Verification (Verification Center)
  │  Member submits identity documents (government-issued ID, passport, or equivalent)
  │  Member completes liveness check
  │  Member provides address proof
  │  Member provides phone verification (SMS OTP)
  │  Member provides email verification (email link)
  │  Verification state transitions: Unverified → IdentitySubmitted
  │  Rules Engine: routes submission to AI review queue
  │
Step 3: AI Review
  │  AI Assistant reviews submitted documents for completeness and consistency
  │  AI flags issues or approves for operator review
  │  If AI cannot reach a decision → escalates to Operator Review
  │  Verification state: IdentitySubmitted → UnderReview
  │
Step 4: Operator Review (if required)
  │  Operator reviews the application in the Operations Center → Verification queue
  │  Operator makes one of three decisions: Approve, Request More Information, Deny
  │  System notifies member of decision
  │  Verification state: UnderReview → Verified | Failed
  │
Step 5: Approval
  │  Application is approved (Verified state confirmed)
  │  System issues member ID
  │  Member is notified of approval by email and SMS
  │  Audit event: application_approved
  │
Step 6: Profile Creation
  │  Member creates password and sets up MFA (authenticator app, SMS, or passkey)
  │  Member completes profile: preferred name, timezone, notification preferences
  │  Trusted device is registered (first device is automatically trusted)
  │  Profile state: active
  │
Step 7: Opening Contribution (if applicable)
  │  For deposit accounts: member funds the account (ACH transfer, wire, or debit card)
  │  For investment accounts: member may fund or skip
  │  For credit accounts: no initial funding required
  │
Step 8: Account Issued
  │  Account record is provisioned (status: active)
  │  Account number and routing number assigned
  │  Cards issued (if applicable): virtual card issued immediately, physical card mailed
  │  Audit event: account_created
  │
Step 9: Dashboard
  │  Member is redirected to their personalized dashboard
  │  AI Assistant presents a welcome message and recommended first steps
  │  Onboarding completion status recorded
  └── Journey Complete
```

### 2.3 Verification States

| State | Meaning |
|---|---|
| Unverified | Application submitted; documents not yet provided |
| IdentitySubmitted | Documents submitted; awaiting review |
| UnderReview | Documents under AI and/or operator review |
| Verified | Identity confirmed; account issuance authorized |
| Failed | Identity could not be verified; member notified |

### 2.4 Rules Engine — Onboarding Automations

- Validates application inputs on submission
- Routes identity submissions to AI review queue automatically
- Escalates to operator queue when AI cannot reach a decision
- Sends status notifications to the member at each verification state change
- Assigns operator cases with priority based on application type and wait time
- Flags high-risk applications (sanctions match, duplicate identity) for senior operator review
- Locks applications that receive three failed document submissions

### 2.5 AI Role in Onboarding

- Reviews document completeness, consistency, and legibility
- Detects mismatches between stated information and submitted documents
- Presents a recommended action to the operator when escalating
- Generates a welcome experience for the member on dashboard entry
- AI operates only within permissions defined for the onboarding context

---

## 3. MEMBER LOGIN JOURNEY

### 3.1 Overview

The login journey is followed by every returning member accessing the platform. It is initiated from the public website (Sign In) or from a direct URL. It ends with the member on their dashboard.

### 3.2 Login Steps

```
Step 1: Login Entry
  │  Member visits Sign In page
  │  Member enters email and password
  │  System validates credentials
  │  On invalid credentials: error message shown, attempt logged, lockout after excessive failures
  │
Step 2: Authentication
  │  Credentials validated against member_credentials record
  │  Session created: session_id, device_id, actor_id recorded
  │  Audit event: login_attempt (success or failure)
  │
Step 3: Trusted Device Check
  │  System checks if current device is registered as a trusted device
  │  ├── Trusted device found and valid → proceed to Step 5 (MFA may be skipped for low-risk actions)
  │  └── Device not recognized → proceed to Step 4 (MFA required)
  │
Step 4: MFA (if required)
  │  MFA challenge presented based on enrolled methods:
  │    • Authenticator app (TOTP)
  │    • SMS OTP
  │    • Passkey / WebAuthn biometric
  │  Member completes MFA challenge
  │  On failure: retry allowed (limited); lockout after excessive failures
  │  On success: device may be offered for trust registration
  │
Step 4a: New Device Trust Registration (optional)
  │  System presents option to register the current device as trusted
  │  Member accepts or declines
  │  If accepted: trusted device record created; previous trusted device may be replaced (single active device rule enforced)
  │  Audit event: trusted_device_registered
  │
Step 5: Dashboard
  │  Member session established
  │  Member redirected to personalized dashboard
  │  AI Assistant context loaded (current role, permissions, last session state)
  └── Journey Complete
```

### 3.3 Session Security Rules

- Sessions are stored in Redis with session_id and device_id association.
- Inactivity lock: UI locks after 2 minutes of inactivity; full session termination after 5–10 minutes depending on risk profile.
- High-risk actions (transfers above threshold, security changes) require fresh MFA re-authentication regardless of session state.
- A maximum of two active trusted devices are permitted per account. Adding a new device when two are registered requires removing one or completing an approval flow.

### 3.4 Rules Engine — Login Automations

- Detects login from unrecognized device or location
- Detects velocity anomalies (multiple failed logins, rapid geographic changes)
- Triggers MFA challenge for unrecognized devices
- Locks account after threshold of failed login attempts
- Sends login notifications to member for new device logins
- Escalates suspicious login attempts to the Operations Center

---

## 4. ACCOUNT OPENING JOURNEY

### 4.1 Overview

The Account Opening journey is followed when an existing verified member opens an additional account. It may also be triggered during onboarding for the first account. It ends with the account provisioned and accessible in the member's dashboard.

### 4.2 Account Types

- Personal Checking
- Personal Savings
- Joint Account
- Business Checking
- Business Savings
- Investment / Brokerage Account
- Crypto Wallet
- Credit Card
- Personal Loan / Credit Line

### 4.3 Account Opening Steps

```
Step 1: Select Account Type
  │  Member navigates to Accounts → Open New Account
  │  Member selects account type
  │  System displays product terms, rates, and eligibility requirements
  │
Step 2: Eligibility Check
  │  System checks member's verification status (must be Verified)
  │  System checks existing account holdings and limits
  │  System checks credit eligibility for credit products
  │  Rules Engine: applies eligibility rules automatically
  │  ├── Eligible → proceed to Step 3
  │  └── Not eligible → member presented with explanation and alternative options
  │
Step 3: Verification (additional, if required)
  │  For business accounts: business verification documents requested
  │  For investment accounts: suitability questionnaire presented
  │  For credit products: income verification and credit check initiated
  │  Documents submitted to Verification Center
  │  AI reviews documents; escalates to operator if required
  │
Step 4: Approval
  │  System evaluates eligibility and verification results
  │  For standard accounts: automatic approval upon verified identity
  │  For credit products: underwriting decision made (automated or operator-assisted)
  │  Member notified of decision
  │  Audit event: account_application_decision
  │
Step 5: Account Created
  │  Account provisioned in system (status: active)
  │  Account visible in member dashboard immediately
  │  Funding instructions provided where applicable
  │  Cards issued if applicable (virtual card immediate, physical card mailed)
  │  Audit event: account_created
  └── Journey Complete
```

### 4.4 Rules Engine — Account Opening Automations

- Checks eligibility rules automatically based on account type and member profile
- Routes applications requiring additional review to the Operations Center queue
- Assigns operator cases for manual review of credit and business applications
- Sends approval or denial notifications to the member
- Triggers card issuance upon account approval

---

## 5. PAYMENTS JOURNEY

### 5.1 Overview

The Payments journey covers all fund movement initiated by a member: transfers between own accounts, transfers to other members, ACH, domestic wire, international wire, Zelle, and bill payment. Every payment is processed through the Rules Engine before execution.

### 5.2 Payment Types

| Type | Description |
|---|---|
| Internal Transfer | Between member's own VANTORIS accounts |
| ACH | Automated Clearing House (domestic) |
| Domestic Wire | Same-day wire within the United States |
| International Wire | SWIFT wire to international recipients |
| Zelle | Real-time person-to-person payment |
| Bill Pay | Scheduled bill payment to payees |
| Recurring Transfer | Automated scheduled transfers |

### 5.3 Payment Steps

```
Step 1: Transfer Initiation
  │  Member navigates to Payments → Transfer or Move Money
  │  Member selects: from account, to account or recipient, amount, date, memo
  │  For new recipients: recipient details validated and added to address book
  │
Step 2: Rules Engine — Pre-Execution Checks
  │  Rules Engine evaluates the payment against:
  │    • Transaction limits (daily, per-transaction)
  │    • Account balance and available funds
  │    • Recipient sanctions screening (OFAC/AML)
  │    • Fraud detection rules (velocity, pattern, behavioral)
  │    • Regulatory compliance rules
  │  ├── All checks pass → proceed to Step 3
  │  └── Any check fails → payment blocked; member notified with reason; audit event recorded
  │
Step 3: Risk Check Result
  │  ├── Low risk → automatic approval; proceed to Step 5
  │  └── Elevated risk → proceed to Step 4 (Approval required)
  │
Step 4: Approval (if required)
  │  ├── Member approval: high-value transfers require MFA re-authentication
  │  └── Operator approval: flagged payments assigned to Operations Center queue
  │        Operator reviews and makes decision (Approve / Decline)
  │        Member notified of decision
  │
Step 5: Processing
  │  Payment instruction created and routed to appropriate payment rail (ACH/Wire/Zelle/Internal)
  │  Transaction record created (status: Pending)
  │  Ledger entries created (double-entry: debit source, credit destination)
  │  Idempotency key enforced to prevent duplicate processing
  │
Step 6: Settlement
  │  Payment rail processes and settles
  │  Transaction status updated: Pending → Posted → Settled
  │  Ledger entries updated to reflect final settlement
  │  Balance snapshot updated
  │
Step 7: Audit
  │  Immutable audit event recorded: actor_id, device_id, session_id, amount, recipient, timestamp, before/after balance state
  │
Step 8: Notification
  │  Member receives confirmation notification (in-app, email, SMS per preferences)
  │  Recipient notified if applicable (Zelle, internal transfer)
  └── Journey Complete
```

### 5.4 Rules Engine — Payment Automations

- Applies transaction limit rules automatically per account and payment type
- Screens recipients against sanctions lists before payment is submitted
- Detects velocity anomalies and blocks suspicious payments
- Routes high-value or flagged payments to operator approval queue
- Sends payment status notifications at each state transition
- Generates audit events for every payment state change
- Handles payment failures and reversals with compensating ledger entries

### 5.5 Payment Failure Handling

```
Payment Fails
  │
  ├── Insufficient funds → member notified; payment cancelled; audit event recorded
  ├── Recipient not found → member notified; payment cancelled
  ├── Sanctions match → payment blocked; escalated to Operations Center; member notified
  ├── Network failure → retry with exponential backoff; member notified if unresolved
  └── Manual hold by operator → member notified with instructions
```

---

## 6. VERIFICATION CENTER JOURNEY

### 6.1 Overview

The Verification Center is the single surface for all identity and document verification in VANTORIS. It replaces any generic KYC page. Members access it from their dashboard. Operators review submissions from the Operations Center.

### 6.2 Verification Types

| Type | Description |
|---|---|
| Email Verification | Confirm ownership of email address |
| Phone Verification | Confirm ownership of phone number via SMS OTP |
| Identity Verification | Government-issued ID, passport, liveness check |
| Address Verification | Utility bill, bank statement, or third-party proof |
| Income Verification | Pay stubs, bank statements, tax documents |
| Business Verification | Business registration, UBO, business documents |
| Trusted Device Verification | Device binding and approval flow |

### 6.3 Verification Journey Steps

```
Step 1: Submit Documents
  │  Member navigates to Verification Center (from dashboard navigation or prompted by system)
  │  Member selects the verification type required or prompted
  │  Member uploads required documents or completes real-time verification steps
  │  Document metadata recorded; binary content stored in secure object storage
  │  Verification state: Unverified → IdentitySubmitted
  │  Audit event: verification_submitted
  │
Step 2: Rules Engine Routing
  │  Rules Engine evaluates submission:
  │    • Document completeness check
  │    • Document format validation
  │    • Automated fraud indicator checks
  │  Rules Engine routes to AI review automatically
  │
Step 3: AI Review
  │  AI reviews documents for:
  │    • Legibility and completeness
  │    • Consistency between submitted information and application data
  │    • Forgery and tampering indicators
  │    • Liveness check validation
  │  AI decision:
  │    ├── Approved by AI → verification state advances (UnderReview → Verified)
  │    │     Operator notification of AI decision for audit
  │    └── AI cannot decide or flags for review → escalate to Operator Review
  │          Verification state: IdentitySubmitted → UnderReview
  │
Step 4: Operator Review (if required)
  │  Verification case appears in Operations Center → Verification queue
  │  Operator assigned to case by Rules Engine (based on workload and expertise)
  │  Operator reviews documents, AI recommendation, and member application data
  │  Operator makes decision:
  │    ├── Approve → Verified
  │    ├── Request More Information → member notified; state returns to Unverified with notes
  │    └── Deny → Failed; member notified with reason; appeal process explained
  │
Step 5: Decision
  │  Final verification state recorded: Verified | Failed
  │  Audit event: verification_decision (includes operator_id, decision, timestamp, notes)
  │
Step 6: Member Notification
  │  Member notified of decision via in-app notification, email, and SMS
  │  If Verified: member gains access to features gated behind verification
  │  If Request More Information: member presented with specific instructions
  │  If Failed: member presented with reason and instructions for appeal or re-submission
  └── Journey Complete
```

### 6.4 Rules Engine — Verification Automations

- Routes all new submissions to AI review automatically
- Prioritizes operator queue based on submission age, account type, and risk flags
- Assigns cases to available operators based on workload balancing
- Escalates cases that exceed response time thresholds
- Sends notifications to members at every verification state change
- Locks re-submission after three consecutive failures (requires operator intervention to unlock)

---

## 7. SUPPORT JOURNEY

### 7.1 Overview

The Support journey describes how a member receives help. Member Advisor is the canonical support hub. No duplicate support interfaces exist outside of Member Advisor. All support channels are aggregated within Member Advisor.

### 7.2 Support Channels (aggregated in Member Advisor)

- AI Financial Assistant (primary)
- Live Chat with a VANTORIS operator
- WhatsApp Business
- Voice Support
- Video Support
- Support Tickets
- Help Center and Guides

### 7.3 Support Journey Steps

```
Step 1: Member Initiates Support
  │  Member navigates to Support in the member navigation
  │  Member Advisor opens (dedicated workspace, not a popup)
  │  AI Financial Assistant is the first point of contact
  │
Step 2: AI Assistant Handles Request
  │  AI receives: current user identity, role, permissions, current screen context, account data
  │  AI attempts to resolve the issue:
  │    • Answers questions using financial knowledge and account context
  │    • Performs permitted actions (balance inquiry, transaction lookup, document retrieval)
  │    • Guides member through self-service workflows
  │  AI Resolution:
  │    ├── Issue resolved → member confirms resolution → satisfaction survey presented
  │    └── Issue requires human assistance → proceed to Step 3
  │
Step 3: Operator Escalation
  │  Member requests operator or AI determines operator escalation is required
  │  Ticket created automatically by AI with:
  │    • Issue summary
  │    • Conversation transcript
  │    • Relevant account context
  │    • Suggested resolution (AI recommendation to operator)
  │  Ticket routed to available operator by Rules Engine
  │  Member shown estimated wait time
  │
Step 4: Operator Handles Case
  │  Operator receives ticket in Operations Center → Communications queue
  │  Operator reviews AI summary, conversation history, and account context
  │  Operator resolves issue or escalates to specialist
  │  Operator communicates with member via Live Chat, email, phone, or video
  │
Step 5: Resolution
  │  Issue resolved by operator
  │  Ticket closed with resolution notes
  │  Audit event: support_case_resolved (includes operator_id, resolution, timestamp)
  │  Member notified of resolution
  │
Step 6: Satisfaction Survey
  │  Member receives short satisfaction survey (optional)
  │  Survey results recorded for quality monitoring
  └── Journey Complete
```

### 7.4 Rules Engine — Support Automations

- Routes new tickets to available operators based on queue and expertise
- Escalates unresponded tickets after defined wait time thresholds
- Notifies member of estimated wait time and any delays
- Assigns specialist cases when standard operators cannot resolve
- Closes stale tickets after member inactivity period with member notification

---

## 8. AI WORKFLOWS

### 8.1 Overview

AI is not a popup in VANTORIS. AI is a full workspace. AI is available to all platform users in a role-appropriate form:

| User Type | AI Name |
|---|---|
| Members | Financial Assistant |
| Operators | Operations Assistant |
| VANTORIS iCommand | Platform Intelligence |

AI operates exclusively within the permissions of the signed-in user. AI never exposes unauthorized data, never suggests unauthorized actions, and never executes actions that require permissions the current user does not hold.

### 8.2 Standard AI Workflow

```
Step 1: Current User Identity Received
  │  AI receives: actor_id, session_id, device_id
  │
Step 2: Current Role Loaded
  │  AI loads: role definition, role-specific permissions
  │
Step 3: Permissions Evaluated
  │  AI queries permission descriptors for the current user
  │  Available actions determined (from AI Action Catalog)
  │  Unauthorized actions excluded from all recommendations and displays
  │
Step 4: Current Screen Context Received
  │  AI receives: current route, selected record id, active filters, workflow state
  │
Step 5: Available Actions Displayed
  │  AI presents only actions the user is authorized to execute
  │  Actions are displayed as an Action Catalog within the AI workspace
  │
Step 6: Recommendations Generated
  │  AI generates context-aware recommendations based on:
  │    • Current screen and record context
  │    • Member account state and history (for Financial Assistant)
  │    • Operator work queue and case state (for Operations Assistant)
  │    • Platform health and analytics (for Platform Intelligence)
  │
Step 7: Execution
  │  Member or operator selects an AI recommendation or action
  │  AI requests confirmation for consequential actions
  │  AI executes action via platform APIs (subject to permission check at API layer)
  │  Actions that require MFA re-authentication prompt the user before execution
  │
Step 8: Audit
  │  AI records: action executed, inputs, outputs, permissions verified, actor, timestamp
  │  Audit event written to immutable audit log: ai_action_executed
  └── Workflow Complete
```

### 8.3 AI Conversation Isolation

- Each AI conversation is isolated per session. AI does not carry context between separate sessions unless explicitly using the persistent memory model.
- AI memory is scoped to the authorized owner. AI may not access another member's memory or conversation history.
- Uploaded documents are scoped to the conversation and stored with PII classification and retention rules applied.

### 8.4 AI Deep Links

- AI suggestions that reference platform workflows open the correct destination directly using canonical deep links.
- Deep-link format: `https://app.vantoris.com/{route}?deep_link_from=ai&dl_id={id}` (web) or `vantoris://{route}?dl_id={id}&source=ai` (mobile).
- AI may not generate deep links to destinations the current user is not authorized to access.

### 8.5 AI Guided Workflows

- Multi-step guided workflows are defined declaratively (YAML/JSON) in `libs/ai/workflows/`.
- AI executes guided workflows step-by-step, presenting progress to the user.
- Guided workflows may be paused and resumed within the same session.
- Workflow definitions are versioned; changes require a design review.

### 8.6 AI Recommendation Types

| Context | Recommendation Examples |
|---|---|
| Member Dashboard | Review spending patterns, schedule transfer, complete verification |
| Member Payments | Suggest optimal payment rail, flag unusual transfer, confirm recipient |
| Member Accounts | Suggest account consolidation, flag low balance, recommend savings product |
| Member Verification Center | Guide through required document submission steps |
| Operations Dashboard | Summarize pending work queue, highlight overdue cases |
| Operations Verification | Recommend decision based on document analysis |
| Operations Members | Surface risk signals, suggest case actions |
| Platform Intelligence | Summarize platform health, flag policy violations, recommend configuration changes |

---

## 9. OPERATIONS JOURNEY

### 9.1 Overview

The Operations Center is the administrative workspace for VANTORIS operators. Operators access the Operations Center through a dedicated authenticated route. Operators never see the Member Portal and members never see the Operations Center.

### 9.2 Operations Center Navigation

| Section | Purpose |
|---|---|
| Dashboard | Real-time platform overview, KPIs, alerts |
| Members | Member account management and lifecycle |
| Banking | Transaction monitoring, settlement, dispute management |
| Verification | Verification case review and decision |
| Operations | Work queue management, case assignment, escalations |
| Communications | Support tickets, live chat, member communications |
| Reports | Compliance reports, analytics, audit exports |
| AI Operations Assistant | AI workspace for operators |

### 9.3 Operations Work Queue Journey

```
Step 1: Work Queue
  │  Operator logs into Operations Center
  │  Dashboard displays: assigned cases, pending queue, alerts, KPIs
  │  Rules Engine has pre-populated and prioritized the work queue
  │
Step 2: Assigned Case
  │  Operator selects a case from the work queue
  │  Case may be: verification review, payment approval, dispute, support ticket, risk flag
  │  Case details loaded: member context, AI summary, recommended action, supporting documents
  │  AI Operations Assistant available in the same workspace for reference
  │
Step 3: Review
  │  Operator reviews all case details
  │  Operator may request additional information from AI Operations Assistant
  │  Operator may view member account history, previous cases, and verification records
  │  Operator may communicate with member via the Communications module
  │
Step 4: Decision
  │  Operator selects one of the available decision options (specific to case type):
  │    • Approve / Deny / Request More Information / Escalate / Hold / Close
  │  Decision recorded with required notes
  │  System enforces decision authority: operators may only make decisions within their permission scope
  │
Step 5: Audit
  │  Immutable audit event recorded: operator_id, case_id, decision, notes, timestamp
  │  Audit includes before/after state for the affected record
  │
Step 6: Member Notification
  │  System sends member notification based on decision (automated by Rules Engine)
  │  Notification channel: in-app, email, SMS (per member preferences)
  └── Journey Complete
```

### 9.4 Rules Engine — Operations Automations

- Pre-populates operator work queues with cases requiring human review
- Prioritizes cases by age, account type, risk score, and case type
- Assigns cases to operators based on expertise and workload
- Escalates cases not actioned within defined time thresholds
- Sends automated notifications to members when operator decisions are recorded
- Generates compliance and operational reports on schedule

---

## 10. VANTORIS iCOMMAND JOURNEY

### 10.1 Overview

VANTORIS iCommand is the executive governance workspace. It is accessible only to users with iCommand-level authority. iCommand governs the platform: it reviews platform intelligence, sets policy, updates the Rules Engine, and monitors AI governance.

Hidden authority identifiers are never exposed in iCommand navigation, labels, or audit trails.

### 10.2 iCommand Navigation

| Section | Purpose |
|---|---|
| Governance | Platform policies, rule definitions, policy approvals |
| Platform Health | System health monitoring, uptime, service status |
| Analytics | Platform-wide analytics, KPIs, financial reporting |
| Security | Security alerts, audit logs, threat intelligence |
| AI Governance | AI behavior monitoring, model performance, AI policy |
| Configuration | Platform-level configuration, feature flags, system settings |
| Monitoring | Real-time operational monitoring, alerts |

### 10.3 iCommand Workflow

```
Step 1: Alert
  │  Platform Intelligence (AI) or monitoring system surfaces an alert
  │  Alert types: security anomaly, rules engine trigger, policy breach, performance degradation, AI behavior flag
  │  Alert appears in iCommand Monitoring dashboard
  │
Step 2: Review
  │  iCommand user reviews the alert with full platform context
  │  Platform Intelligence AI provides summary, root cause analysis, and recommended action
  │  Historical data, audit logs, and related events presented in workspace
  │
Step 3: Decision
  │  iCommand user makes a governance decision:
  │    • Update platform policy
  │    • Modify Rules Engine configuration
  │    • Adjust AI governance settings
  │    • Approve or reject a policy change
  │    • Escalate to external authority if required
  │    • Dismiss alert with documented reason
  │
Step 4: Policy Update
  │  Approved policy changes are submitted through the governance workflow
  │  Changes require documented justification and approval chain (per governance policy)
  │  Audit event: policy_change_submitted (actor, change, justification, timestamp)
  │
Step 5: Rules Engine Update
  │  Approved policy changes are applied to the Rules Engine
  │  Rules Engine validates new rules for conflicts and consistency
  │  Rules Engine tests updated configuration before activation
  │  Audit event: rules_engine_updated (policy_id, rules affected, timestamp)
  │
Step 6: Platform Updated
  │  Configuration change is deployed (subject to CI/CD deployment pipeline)
  │  Platform behavior updated to reflect new policy
  │  Post-deployment monitoring confirms expected behavior
  │  Audit event: platform_configuration_updated (deployed_by, change_id, timestamp)
  └── Journey Complete
```

### 10.4 AI Governance Workflow

```
Platform Intelligence monitors AI behavior continuously
  │
  ├── Detects anomalous AI behavior → alert raised in AI Governance section
  ├── Monitors AI action execution rates and error rates
  ├── Reviews AI recommendation accuracy and member outcomes
  ├── Flags AI actions that approached permission boundaries
  └── Provides periodic AI behavior reports to iCommand users
```

---

## 11. RULES ENGINE WORKFLOWS

### 11.1 Overview

The Rules Engine is always active. It monitors all platform events and applies automated rules to route work, enforce policies, detect risks, send notifications, and progress workflows without manual intervention.

### 11.2 Verification Routing

```
New verification submission received
  → Rules Engine validates document completeness
  → Routes to AI review queue automatically
  → If AI approves: advances verification state (→ Verified)
  → If AI flags: assigns to operator queue with AI recommendation
  → If operator queue threshold exceeded: escalates priority
  → Sends state-change notification to member at each transition
```

### 11.3 Case Assignment

```
New case created (verification, payment, support, dispute)
  → Rules Engine evaluates case type and priority
  → Identifies available operators with matching expertise
  → Assigns case to operator with lowest current workload and highest expertise match
  → Notifies operator of new assignment
  → If no available operator: places in queue and alerts supervisor
  → If case unactioned after threshold: escalates priority and reassigns
```

### 11.4 Risk Detection

```
Every financial transaction
  → Rules Engine checks: limits, balance, sanctions, velocity, behavioral pattern
  → Low risk: automatic approval
  → Medium risk: MFA re-authentication required from member
  → High risk: operator approval required; payment held
  → Critical risk: payment blocked; case opened; member and operator notified

Every login event
  → Rules Engine checks: device, location, velocity, time-of-day pattern
  → Recognized device: standard flow
  → New device or anomalous location: MFA required; notification sent
  → Suspicious velocity: account locked; member notified; case opened in Operations
```

### 11.5 Session Management

```
Active session monitoring
  → Rules Engine monitors session activity
  → 2-minute inactivity: UI lock applied
  → 5–10 minutes inactivity (risk-dependent): full session termination
  → High-risk action attempted: fresh MFA challenge required
  → Session token near expiry: silent rotation attempted
  → Refresh token rotation failure: session terminated; member redirected to Sign In
```

### 11.6 Notification Routing

```
Platform event occurs (verification state change, payment status, security alert, etc.)
  → Rules Engine determines recipient (member, operator, iCommand)
  → Rules Engine selects notification channel (in-app, email, SMS, WhatsApp per preferences)
  → Notification queued with priority
  → Notification delivered; delivery status recorded
  → Failed delivery: retry with backoff; fallback channel used if primary fails
```

### 11.7 AI Recommendation Triggers

```
Member accesses platform screen
  → Rules Engine evaluates current screen context
  → Passes context to AI (current route, selected record, member state)
  → AI generates ranked recommendations
  → Rules Engine filters recommendations against current user permissions
  → Authorized recommendations presented in AI workspace
```

### 11.8 Escalation Rules

| Trigger | Escalation Action |
|---|---|
| Verification case unactioned > 4 hours | Priority raised; supervisor notified |
| Support ticket unresponded > 2 hours | Reassigned to available operator |
| Payment flagged as high risk | Routed to senior operator queue |
| Failed login attempts > 5 | Account locked; member notified; case opened |
| Document submission failures > 3 | Account restricted; manual operator unlock required |
| AI action error rate spike | AI governance alert raised in iCommand |
| Trusted device anomaly | Session terminated; MFA required on next login |

### 11.9 Onboarding Workflow Automations

```
Application submitted
  → Rules Engine validates inputs
  → Sends application confirmation to member
  → Routes to identity verification queue
  → Tracks progress through all onboarding steps
  → Sends step-completion notifications
  → Issues account upon final approval
  → Triggers card issuance
  → Triggers welcome AI message on first dashboard load
```

### 11.10 Compliance Automations

```
Scheduled compliance runs
  → Rules Engine generates required regulatory reports on schedule
  → Routes reports to appropriate iCommand or operations user
  → Flags transactions meeting BSA/AML reporting thresholds
  → Generates SAR (Suspicious Activity Report) drafts for operator review
  → Archives audit logs per retention policy
```

---

## 12. MEMBER PORTAL — FEATURE MAP

Every feature listed here has exactly one permanent home in the Member Portal. Features are never duplicated. Members see only features relevant to their account type, verification status, and active permissions.

| Navigation | Features |
|---|---|
| Home | Personalized dashboard, account summary, AI recommendations, recent activity, alerts |
| Accounts | All accounts, balance details, transaction history, statements, account settings |
| Payments | Transfer, ACH, wire, Zelle, bill pay, recurring transfers, payment history |
| Cards | Virtual cards, physical cards, card controls, spend limits, freeze/unfreeze |
| Wealth | Investment portfolios, positions, orders, market data, crypto wallet |
| Credit | Credit cards, credit line, loan balances, repayment schedules |
| Verification Center | Identity verification, document submission, verification status |
| Security | Trusted devices, MFA settings, password, login history, session management |
| Support | Member Advisor (AI Financial Assistant, Live Chat, WhatsApp, Voice, Video, Tickets, Help Center) |
| Profile | Personal information, preferred name, notification preferences, localization settings |

Members must never see: other members' data, operations workflows, audit logs, operator tools, internal reports, platform configuration, or iCommand features.

---

## 13. OPERATIONS CENTER — FEATURE MAP

Every feature listed here has exactly one permanent home in the Operations Center. Operators see only features within their assigned role and permissions.

| Navigation | Features |
|---|---|
| Dashboard | Real-time KPIs, alerts, queue summary, system health snapshot |
| Members | Member search, profile management, account lifecycle, account freezing/closing |
| Banking | Transaction monitoring, payment approvals, dispute management, settlement review |
| Verification | Verification queue, document review, AI recommendations, decision workflows |
| Operations | Work queue, case management, escalation management, SLA monitoring |
| Communications | Support tickets, live chat, member communications, outbound notifications |
| Reports | Compliance reports, audit exports, performance reports, risk summaries |
| AI Operations Assistant | Full AI workspace for operators with Operations Assistant |

---

## 14. VANTORIS iCOMMAND — FEATURE MAP

Every feature listed here is accessible only to iCommand-authorized users. Hidden authority identifiers are never displayed in navigation, labels, or audit records.

| Navigation | Features |
|---|---|
| Governance | Policy management, rules definitions, approval workflows, policy library |
| Platform Health | Service health, uptime monitoring, infrastructure alerts, deployment status |
| Analytics | Platform-wide analytics, member growth, transaction volume, revenue reporting |
| Security | Threat intelligence, audit log review, security policy management, incident response |
| AI Governance | AI behavior monitoring, model performance, AI action audit, AI policy configuration |
| Configuration | Feature flags, system parameters, integration settings, environment configuration |
| Monitoring | Real-time operational alerts, event stream, compliance monitoring |

---

## 15. CROSS-REFERENCES

| Topic | Document |
|---|---|
| System architecture and domains | `docs/ARCHITECTURE.md` |
| UI component structure and patterns | `docs/COMPONENT_ARCHITECTURE.md` |
| Repository layout and workspace rules | `docs/REPOSITORY_STRUCTURE.md` |
| Repository standards and implementation rules | `docs/REPOSITORY_STANDARDS.md` |
| API contracts and deep-link standards | `docs/API_ARCHITECTURE.md` |
| Data models for all entities | `docs/DATABASE_ARCHITECTURE.md` |
| Engineering and coding standards | `docs/CODING_STANDARDS.md` |
| CI/CD pipeline and evidence requirements | `docs/CI_CD.md` |
| Authentication flows and MFA | `docs/AUTHENTICATION.md` (to be created) |
| RBAC and permission model | `docs/RBAC.md` (to be created) |
| Security standards and data retention | `docs/SECURITY_STANDARDS.md` (to be created) |
| Migration plan from Base44 | `docs/MIGRATION_GUIDE.md` (to be created) |
| Testing strategy and coverage | `docs/TESTING.md` (to be created) |
| Design system and visual standards | `docs/DESIGN_SYSTEM.md` (to be created) |
| Navigation architecture | `docs/NAVIGATION_ARCHITECTURE.md` (to be created) |
| Verification Center vendor integration | `docs/VERIFICATION_CENTER.md` (to be created) |

---

## 16. DEPENDENCIES AND GAPS DISCOVERED

The following dependencies and gaps were identified during the creation of this document:

### 16.1 Missing Documents Referenced

The following documents are referenced in this workflow document and in existing architecture documents but do not yet exist in the repository:

| Document | Required For |
|---|---|
| `docs/AUTHENTICATION.md` | Detailed MFA flows, passkey setup, refresh token rotation, session schema |
| `docs/RBAC.md` | Permission model, role definitions, operator permission scopes, iCommand authority levels |
| `docs/SECURITY_STANDARDS.md` | PII retention, encryption policies, audit retention, redaction rules |
| `docs/MIGRATION_GUIDE.md` | Base44 import steps, feature parity checklist, rollback procedures |
| `docs/TESTING.md` | Test strategy for each journey, AI testing, Rules Engine testing |
| `docs/DESIGN_SYSTEM.md` | Visual design for each journey surface, responsive behavior |
| `docs/NAVIGATION_ARCHITECTURE.md` | Canonical deep links, button behavior, permission-gated navigation |
| `docs/VERIFICATION_CENTER.md` | Third-party KYC vendor integration, document type matrix, liveness check configuration |

### 16.2 Implementation Gaps

- No application code exists yet. All workflows are defined at the documentation level pending the Base44 import.
- Rules Engine configuration rules are not yet defined as machine-readable artifacts. These must be created in `libs/ai/workflows/` after Base44 import.
- AI permission descriptors for each workflow are not yet committed to `libs/ai/permissions/`.
- Canonical deep-link registry (`docs/api/deeplinks.yaml`) is not yet created.
- OpenAPI contracts for most banking APIs (`docs/api/*.yaml`) are not yet created.

### 16.3 Base44 Compatibility

This document has been written to remain fully compatible with the imported Base44 application. All workflow definitions describe intended behavior. After Base44 import:
- Each workflow step must be verified against the actual Base44 implementation.
- Deviations must be documented and resolved through the design change process.
- This document remains authoritative; the Base44 implementation is refactored to match, not the other way around.

---

## 17. REMAINING DOCUMENTATION

The following documents are recommended to complete the VANTORIS documentation suite, in priority order:

1. `docs/AUTHENTICATION.md` — MFA flows, passkey, trusted device binding, session schema
2. `docs/RBAC.md` — Role definitions, permission catalog, operator scopes, iCommand authority
3. `docs/SECURITY_STANDARDS.md` — Encryption, PII retention, audit retention, redaction
4. `docs/NAVIGATION_ARCHITECTURE.md` — Canonical navigation, deep links, button behavior, permission-gated nav
5. `docs/DESIGN_SYSTEM.md` — Visual design, responsive design, component tokens, surface standards
6. `docs/TESTING.md` — Testing strategy per journey, AI testing, Rules Engine testing, release criteria
7. `docs/MIGRATION_GUIDE.md` — Base44 import checklist, feature parity verification, rollback plan
8. `docs/VERIFICATION_CENTER.md` — KYC vendor integration, document type matrix, liveness check setup
9. `docs/api/` — OpenAPI contract skeletons for all banking, AI, chat, and verification APIs
10. `docs/api/deeplinks.yaml` — Canonical deep-link registry

---

## FILES CREATED BY THIS COMMIT

- Created: `docs/USER_JOURNEYS.md`

## SUMMARY OF CHANGES

This document establishes the complete normative user workflow reference for VANTORIS, covering:

- Public website visitor journey and navigation structure
- Member onboarding from application through dashboard access
- Member login with trusted device and MFA flows
- Account opening eligibility and provisioning
- Payments processing through the Rules Engine, risk checks, and audit
- Verification Center document submission, AI review, operator review, and decision
- Support journey through Member Advisor, operator escalation, and resolution
- AI workflows including permission loading, context detection, execution, and audit
- Operations Center work queue, case review, decision, and member notification
- VANTORIS iCommand alert, policy review, Rules Engine update, and platform governance
- Rules Engine automations for verification routing, case assignment, risk detection, session management, notifications, escalations, and compliance
- Complete feature maps for Member Portal, Operations Center, and VANTORIS iCommand
- Cross-references to all related architecture documents
- Dependencies and gaps for the remaining documentation suite

This is a documentation-only commit. No application code generated.
