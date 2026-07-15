# Navigation Architecture — VANTORIS

Status: normative documentation-only. This document defines the complete navigation architecture for VANTORIS as the single source of truth for every page, menu, button, navigation flow, deep link, and AI action destination. Every feature has exactly one permanent home. No navigation element, page, or feature may be duplicated across workspaces. This document is authoritative and supersedes any navigation definition in any other document wherever a conflict arises.

Source documents incorporated:
`README.md`, `docs/ARCHITECTURE.md`, `docs/COMPONENT_ARCHITECTURE.md`, `docs/REPOSITORY_STRUCTURE.md`, `docs/REPOSITORY_STANDARDS.md`, `docs/CODING_STANDARDS.md`, `docs/CI_CD.md`, `docs/API_ARCHITECTURE.md`, `docs/DATABASE_ARCHITECTURE.md`, `docs/SECURITY_STANDARDS.md`, `docs/AUTHENTICATION.md`, `docs/RBAC.md`, `docs/MIGRATION_GUIDE.md`, `docs/TESTING.md`, `docs/DESIGN_SYSTEM.md`.

Do NOT generate application code from this document.

---

## Table of Contents

1. [Purpose](#1-purpose)
2. [General Navigation Principles](#2-general-navigation-principles)
3. [Platform Surfaces and Workspaces](#3-platform-surfaces-and-workspaces)
4. [Public Website Navigation](#4-public-website-navigation)
5. [Member Portal Navigation](#5-member-portal-navigation)
6. [Operations Center Navigation](#6-operations-center-navigation)
7. [VANTORIS iCommand Navigation](#7-vantoris-icommand-navigation)
8. [AI Navigation](#8-ai-navigation)
9. [Authentication and Onboarding Navigation](#9-authentication-and-onboarding-navigation)
10. [Button Behavior Specification](#10-button-behavior-specification)
11. [Deep Links](#11-deep-links)
12. [Responsive Navigation](#12-responsive-navigation)
13. [Rules Engine Integration](#13-rules-engine-integration)
14. [Verification Center Navigation](#14-verification-center-navigation)
15. [HeroBox and NGO Portal Navigation](#15-herobox-and-ngo-portal-navigation)
16. [Navigation Visibility and RBAC Enforcement](#16-navigation-visibility-and-rbac-enforcement)
17. [Audit and Observability](#17-audit-and-observability)
18. [Base44 Compatibility](#18-base44-compatibility)
19. [Cross-References](#19-cross-references)
20. [Dependencies and Gaps Discovered](#20-dependencies-and-gaps-discovered)
21. [Remaining Documentation](#21-remaining-documentation)
22. [Recommendations Before the Next Document](#22-recommendations-before-the-next-document)

---

## 1. Purpose

This document defines the complete navigation architecture for VANTORIS. It is the single source of truth for:

- Every page, route, and screen the platform exposes
- Every menu, sidebar, bottom navigation bar, and top navigation
- Every button's destination, permission requirement, and behavior on success or failure
- Every deep link format and canonical route identifier
- Every AI action destination and navigation trigger
- Navigation adaptation rules based on role, account type, verification status, and workflow state

### 1.1 Why a Dedicated Navigation Architecture Document

Navigation is the platform's operating contract with its users. Errors in navigation — duplicated destinations, dead buttons, placeholder pages, features exposed to the wrong audience — undermine trust in a financial platform. This document eliminates ambiguity by defining one home for every feature and one rule set for every navigation decision.

### 1.2 Scope

This document covers:

- Public Website (unauthenticated)
- Member Portal (authenticated members — personal, joint, and business)
- Operations Center (authenticated operations and support personnel)
- VANTORIS iCommand (authenticated executive and platform administrators)
- AI workspaces across all three authenticated contexts
- Verification Center (cross-cutting member workflow)
- HeroBox and NGO Portal (purpose-specific surfaces sharing the platform design system)
- Authentication and onboarding flows
- Deep link format, canonical routes, and AI navigation targets

### 1.3 What Is Not in Scope

This document does not describe:

- UI component implementation details (see `docs/COMPONENT_ARCHITECTURE.md` and `docs/DESIGN_SYSTEM.md`)
- API endpoint contracts (see `docs/API_ARCHITECTURE.md` and `docs/api/*.yaml`)
- Authentication implementation (see `docs/AUTHENTICATION.md`)
- RBAC permission enforcement logic (see `docs/RBAC.md`)
- Database schemas (see `docs/DATABASE_ARCHITECTURE.md`)

---

## 2. General Navigation Principles

The following principles are absolute. They apply to every surface, every role, and every navigation element on the platform.

### 2.1 One Home Per Feature

Every feature belongs to exactly one workspace and one location within that workspace. Features are never duplicated across menus, tabs, drawers, or secondary navigation. If the same data appears in two places, one is the canonical location and the other is a link or summary pointing to it.

### 2.2 Show Only What the User Is Allowed to See

Navigation elements that a user is not permitted to access must be hidden entirely. Disabled states that reveal the existence of a restricted function are not permitted. This rule applies to menu items, sidebar items, bottom tabs, buttons, action menus, and AI action lists. See `docs/RBAC.md § 1.5 Visibility Rules`.

### 2.3 Never Expose Hidden Authorities or Internal Identifiers

Role names, permission codes, internal identifiers, audit log references, and platform configuration handles must never appear in any user-facing navigation label, tooltip, URL segment exposed to members, or AI output. See `docs/RBAC.md § 1.6 Unified Operating Experience` and `docs/AUTHENTICATION.md § 11.3 Role Visibility`.

### 2.4 Returning Members Always Enter Their Dashboard

An authenticated returning member who navigates to any entry point of the platform (public website, direct link, notification tap, AI suggestion) is automatically redirected to the Member Portal dashboard. Onboarding flows are shown only to new members who have not completed account creation.

### 2.5 Only New Members See Onboarding

Onboarding navigation (account creation wizard, identity submission prompts, initial setup screens) is shown only to users who have not completed the onboarding workflow. Once a member's account is active, the onboarding flow is permanently replaced by the authenticated Member Portal. Re-entry into onboarding from the Member Portal is not permitted.

### 2.6 Navigation Adapts Automatically

Navigation state — which items are visible, which destinations are available, which AI actions are presented — is computed automatically based on:

- Authenticated identity and role
- Account type (personal, joint, business)
- Verification status (unverified, under review, verified, failed)
- Active workflow (pending onboarding, pending verification, open dispute, active support case)
- Trusted device status

Navigation never requires the user to manually reconfigure or refresh to reflect a permission or status change.

### 2.7 No Dead Buttons

Every button on the platform must have a defined destination, a defined permission requirement, a defined success behavior, and a defined failure behavior. Placeholder destinations, "coming soon" buttons, and buttons that silently do nothing are not permitted.

### 2.8 Navigation Is Role-Scoped

Members never see Operations Center navigation. Operations personnel never see iCommand governance navigation. iCommand personnel never see Member Portal navigation as their primary interface. Each workspace is fully isolated at the navigation level.

### 2.9 AI Navigation Follows the User's Authorization Boundary

The AI assistant in any workspace may only suggest destinations that the current user is authorized to reach. AI may not suggest or navigate to a page the user cannot access. See Section 8.

### 2.10 Every Page Supports Canonical Deep Links

Every page on the platform has a defined canonical route. AI suggestions, notifications, and external links must resolve to the correct page directly. Intermediate redirect pages that require the user to click again are not permitted when a direct deep link is available.

---

## 3. Platform Surfaces and Workspaces

VANTORIS comprises the following independent workspaces. Each workspace has its own navigation root and its own primary navigation structure.

| Workspace | Entry Point | Audience | Navigation Root |
|---|---|---|---|
| Public Website | `https://vantoris.com` | Unauthenticated visitors, prospective members | Top navigation bar |
| Member Portal | `https://app.vantoris.com/member` | Authenticated members (personal, joint, business) | Sidebar (desktop) / Bottom nav (mobile) |
| Operations Center | `https://app.vantoris.com/operations` | Operations, support, and member services personnel | Sidebar |
| VANTORIS iCommand | `https://app.vantoris.com/icommand` | Platform governance and executive administration | Sidebar |
| HeroBox | `https://app.vantoris.com/herobox` | Members (HeroBox feature context) | Integrated within Member Portal |
| NGO Portal | `https://app.vantoris.com/ngo` | NGO organization administrators | Purpose-specific sidebar |
| Verification Center | `https://app.vantoris.com/member/verification` | Members in active verification workflows | Integrated within Member Portal |

### 3.1 Workspace Isolation Rules

- Authenticated members cannot access Operations Center, iCommand, or NGO Portal URLs.
- Operations personnel cannot access iCommand URLs without explicit iCommand role assignment.
- iCommand personnel access the iCommand workspace and may review the Member Portal in a read-only support context only when explicitly granted.
- Every cross-workspace link from AI, notifications, or external sources resolves to the correct workspace for the authenticated user. A link designed for the Operations Center that is followed by a member resolves to a permission error or to the nearest equivalent member-appropriate destination.

---

## 4. Public Website Navigation

The public website is the unauthenticated entry point for prospective members, returning members initiating sign-in, and community visitors. No authenticated features, account data, or internal pages are accessible from the public website.

### 4.1 Top Navigation Bar

The public website top navigation bar contains the following items, always displayed in this order:

| Position | Label | Destination | Behavior |
|---|---|---|---|
| 1 | Logo / VANTORIS | `/` | Returns to homepage |
| 2 | Personal Banking | `/personal` | Personal banking landing page |
| 3 | Business Banking | `/business` | Business banking landing page |
| 4 | Wealth & Investments | `/wealth` | Wealth and investments landing page |
| 5 | Credit & Lending | `/credit` | Credit and lending landing page |
| 6 | HeroBox | `/herobox` | HeroBox feature page |
| 7 | Community | `/community` | Community and social impact page |
| 8 | Financial Education | `/education` | Financial education hub |
| 9 | Help | `/help` | Public help center |
| 10 | Sign In | `/auth/sign-in` | Sign-in page |
| 11 | Open Account | `/auth/register` | New account registration / onboarding |

Rules:
- "Sign In" and "Open Account" are always visible regardless of scroll position or page.
- "Open Account" is the primary call-to-action button (accent color, right-justified).
- Authenticated users who reach the public website are automatically redirected to the Member Portal dashboard. The "Sign In" and "Open Account" buttons do not appear for authenticated sessions.
- No member account data, balance information, or personal identifiers are shown on any public website page.

### 4.2 Homepage Sections

The homepage (`/`) contains the following sections in order:

| Section | Purpose | Primary CTA |
|---|---|---|
| Hero | Primary value proposition and entry point | "Open Account" → `/auth/register` |
| Personal Banking | Personal account feature highlights | "Learn More" → `/personal` |
| Business Banking | Business account feature highlights | "Learn More" → `/business` |
| Wealth & Investments | Investment and wealth management highlights | "Learn More" → `/wealth` |
| Credit & Lending | Credit products and lending highlights | "Learn More" → `/credit` |
| HeroBox | Social impact and premium benefits highlights | "Learn More" → `/herobox` |
| Community | Community and social programs | "Learn More" → `/community` |
| Financial Education | Educational resources | "Learn More" → `/education` |
| Contact | Contact options and hours | "Contact Us" → `/contact` |
| Footer | Legal, privacy, accessibility, sitemap | Static links |

### 4.3 Public Landing Pages

Each landing page follows the same structural pattern: feature explanation, key benefits, eligibility information, and a single primary CTA directing visitors to start an account (`/auth/register`) or sign in (`/auth/sign-in`).

| Route | Page | Primary CTA |
|---|---|---|
| `/personal` | Personal Banking | Open Personal Account |
| `/business` | Business Banking | Open Business Account |
| `/wealth` | Wealth & Investments | Open Wealth Account |
| `/credit` | Credit & Lending | Apply for Credit |
| `/herobox` | HeroBox | Learn More / Enroll |
| `/community` | Community | Get Involved |
| `/education` | Financial Education | Explore Resources |
| `/help` | Help Center | Search / Browse Topics |
| `/contact` | Contact Us | Start Conversation |

### 4.4 Footer Navigation

The public website footer contains:

- Legal: Terms of Service, Privacy Policy, Cookie Policy, Accessibility Statement
- Regulatory: FDIC insured notice, licensing disclosures
- Navigation: Links to all primary landing pages
- Social: Social media links (no external authentication)
- Contact: Address, phone, email

---

## 5. Member Portal Navigation

The Member Portal is the authenticated workspace for all members: personal, joint, and business. Navigation within the Member Portal adapts based on account type, verification status, and active workflows. All navigation items listed in this section are subject to permission-based visibility rules.

### 5.1 Primary Navigation Items

The Member Portal primary navigation contains the following items. Items are listed in display order. Each item is shown only when the member has the required permission.

| Position | Label | Route | Required Permission | Notes |
|---|---|---|---|---|
| 1 | Home | `/member/home` | `member.portal.access` | Always first; the dashboard |
| 2 | Accounts | `/member/accounts` | `member.accounts.read` | All account types |
| 3 | Payments | `/member/payments` | `member.payments.access` | Transfers, bill pay, ACH, wire, Zelle |
| 4 | Cards | `/member/cards` | `member.cards.read` | Debit and credit cards |
| 5 | Wealth | `/member/wealth` | `member.wealth.read` | Investments and portfolio |
| 6 | Credit | `/member/credit` | `member.credit.read` | Credit products and loans |
| 7 | Verification Center | `/member/verification` | `member.verification.access` | KYC and identity verification |
| 8 | Security | `/member/security` | `member.security.access` | Trusted devices, MFA, passkeys, sessions |
| 9 | Support | `/member/support` | `member.support.access` | Help, chat, tickets, advisor |
| 10 | Profile | `/member/profile` | `member.profile.read` | Account settings and personal information |

Rules:
- Items are never reordered. Home is always first.
- Items for features the member does not have access to (e.g., Wealth for a basic personal account with no investment product) are hidden entirely.
- The Verification Center item is shown when the member has a pending or incomplete verification workflow. It is also permanently accessible once the member's account is active to allow re-verification.

### 5.2 Home Dashboard

Route: `/member/home`

The Member Portal home dashboard contains the following sections. Each section respects the member's account type and permissions.

| Section | Content | Route for "View All" |
|---|---|---|
| Account Summary | Balance summary for all accounts | `/member/accounts` |
| Recent Transactions | Last 5 transactions across all accounts | `/member/accounts/transactions` |
| Payments Due | Upcoming scheduled payments | `/member/payments/scheduled` |
| Cards | Active card status summary | `/member/cards` |
| Wealth Summary | Portfolio summary (if applicable) | `/member/wealth` |
| Credit Summary | Credit utilization and score (if applicable) | `/member/credit` |
| Notifications | Recent unread notifications | `/member/notifications` |
| Financial Assistant | AI entry point | `/member/ai` |

### 5.3 Accounts Section

Route: `/member/accounts`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/accounts` | All accounts overview | `member.accounts.read` |
| `/member/accounts/:id` | Individual account detail | `member.accounts.read` |
| `/member/accounts/:id/transactions` | Account transaction history | `member.accounts.transactions.read` |
| `/member/accounts/:id/statements` | Account statements | `member.accounts.statements.read` |
| `/member/accounts/:id/details` | Account details and settings | `member.accounts.read` |
| `/member/accounts/new` | Open new account (if eligible) | `member.accounts.create` |

### 5.4 Payments Section

Route: `/member/payments`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/payments` | Payments hub | `member.payments.access` |
| `/member/payments/transfer` | Internal transfer between own accounts | `member.payments.transfer` |
| `/member/payments/ach` | ACH transfer | `member.payments.ach` |
| `/member/payments/wire` | Wire transfer (domestic and international) | `member.payments.wire` |
| `/member/payments/zelle` | Zelle payment | `member.payments.zelle` |
| `/member/payments/billpay` | Bill payment | `member.payments.billpay` |
| `/member/payments/scheduled` | Scheduled and recurring payments | `member.payments.scheduled` |
| `/member/payments/history` | Payment history | `member.payments.history.read` |
| `/member/payments/recipients` | Saved recipients | `member.payments.recipients.manage` |

### 5.5 Cards Section

Route: `/member/cards`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/cards` | All cards overview | `member.cards.read` |
| `/member/cards/:id` | Card detail | `member.cards.read` |
| `/member/cards/:id/transactions` | Card transaction history | `member.cards.transactions.read` |
| `/member/cards/:id/controls` | Card controls (freeze, limits, online payments) | `member.cards.controls` |
| `/member/cards/:id/virtual` | Virtual card management | `member.cards.virtual` |
| `/member/cards/:id/pin` | PIN management | `member.cards.pin` |
| `/member/cards/apply` | Apply for a new card | `member.cards.apply` |

### 5.6 Wealth Section

Route: `/member/wealth`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/wealth` | Wealth and investments overview | `member.wealth.read` |
| `/member/wealth/portfolio` | Portfolio holdings | `member.wealth.portfolio.read` |
| `/member/wealth/performance` | Portfolio performance | `member.wealth.performance.read` |
| `/member/wealth/trade` | Trade (buy/sell securities) | `member.wealth.trade` |
| `/member/wealth/crypto` | Cryptocurrency holdings and trading | `member.wealth.crypto` |
| `/member/wealth/documents` | Investment documents and tax forms | `member.wealth.documents.read` |
| `/member/wealth/advisor` | Wealth advisor contact | `member.wealth.advisor.access` |

### 5.7 Credit Section

Route: `/member/credit`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/credit` | Credit overview | `member.credit.read` |
| `/member/credit/score` | Credit score and report | `member.credit.score.read` |
| `/member/credit/cards` | Credit card accounts | `member.credit.cards.read` |
| `/member/credit/loans` | Personal and auto loans | `member.credit.loans.read` |
| `/member/credit/mortgage` | Mortgage accounts | `member.credit.mortgage.read` |
| `/member/credit/apply` | Apply for credit product | `member.credit.apply` |
| `/member/credit/payments` | Credit payments | `member.credit.payments` |

### 5.8 Verification Center Section

Route: `/member/verification`

The Verification Center is the canonical location for all KYC and identity verification workflows. Generic "KYC" labels must not appear in navigation or page titles. See `docs/REPOSITORY_STANDARDS.md § VERIFICATION CENTER`.

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/verification` | Verification status overview | `member.verification.access` |
| `/member/verification/identity` | Identity document submission | `member.verification.identity.submit` |
| `/member/verification/address` | Address verification | `member.verification.address.submit` |
| `/member/verification/status` | Verification status and history | `member.verification.status.read` |
| `/member/verification/resubmit` | Resubmit rejected documents | `member.verification.resubmit` |

### 5.9 Security Section

Route: `/member/security`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/security` | Security overview | `member.security.access` |
| `/member/security/devices` | Trusted devices management | `member.security.devices.manage` |
| `/member/security/mfa` | MFA settings | `member.security.mfa.manage` |
| `/member/security/passkeys` | Passkey management | `member.security.passkeys.manage` |
| `/member/security/sessions` | Active sessions | `member.security.sessions.read` |
| `/member/security/password` | Password change | `member.security.password.change` |
| `/member/security/recovery` | Recovery codes | `member.security.recovery.manage` |

### 5.10 Support Section

Route: `/member/support`

The Support section is the Member Portal's unified support hub. All support channels are aggregated here. There must be no duplicate support entry point anywhere else in the Member Portal. See `docs/REPOSITORY_STANDARDS.md § MEMBER ADVISOR`.

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/support` | Support hub | `member.support.access` |
| `/member/support/chat` | Live chat with support | `member.support.chat` |
| `/member/support/ai` | Financial Assistant | `member.ai.access` |
| `/member/support/tickets` | Support tickets | `member.support.tickets.read` |
| `/member/support/tickets/new` | Create new ticket | `member.support.tickets.create` |
| `/member/support/tickets/:id` | Ticket detail | `member.support.tickets.read` |
| `/member/support/appointments` | Schedule an appointment | `member.support.appointments` |
| `/member/support/help` | Help center and guides | `member.support.help.read` |
| `/member/support/whatsapp` | WhatsApp Business channel | `member.support.whatsapp` |

### 5.11 Profile Section

Route: `/member/profile`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/member/profile` | Profile overview | `member.profile.read` |
| `/member/profile/personal` | Personal information (FirstName, LastName, PreferredName, DOB, etc.) | `member.profile.personal.read` |
| `/member/profile/contact` | Contact information (email, phone, address) | `member.profile.contact.read` |
| `/member/profile/documents` | Member documents | `member.profile.documents.read` |
| `/member/profile/preferences` | Notification and communication preferences | `member.profile.preferences.manage` |
| `/member/profile/statements` | Statements and tax documents | `member.profile.statements.read` |

### 5.12 Notifications

Route: `/member/notifications`

Notifications are accessible from the persistent notification bell icon in the navigation bar. The notification panel displays unread alerts and links to relevant destinations. Clicking a notification navigates directly to the relevant page (deep link behavior).

### 5.13 Financial Assistant (AI)

Route: `/member/ai`

The Financial Assistant is a full-screen workspace, not a popup or overlay. It is accessible:

- From the Support section (`/member/support/ai`)
- From the persistent AI launcher (draggable floating button — position persisted per user)
- From the Home dashboard notification widget

The Financial Assistant must not appear as a navigation item in the primary sidebar. It is a workspace reached from the Support section or via the AI launcher. See Section 8.

### 5.14 What Members Must Never See

The following items must never appear anywhere in the Member Portal navigation, page content, or AI output for members:

- Other members' account data, names, or records
- Operations Center navigation or pages
- iCommand navigation, governance pages, or configuration pages
- Internal support cases, internal chat threads, or agent notes not intended for members
- Audit logs
- Platform configuration
- Internal reports or analytics
- Role names, permission codes, or internal identifiers
- Staff or administrator contact information beyond the member-facing support channels

---

## 6. Operations Center Navigation

The Operations Center is the authenticated workspace for operations, support, and member services personnel. Navigation is structured around operational workflows, not member experiences.

### 6.1 Primary Navigation Items

| Position | Label | Route | Required Permission | Notes |
|---|---|---|---|---|
| 1 | Dashboard | `/operations/dashboard` | `operations.dashboard.access` | Always first |
| 2 | Members | `/operations/members` | `operations.members.read` | Member search and management |
| 3 | Banking | `/operations/banking` | `operations.banking.access` | Transaction monitoring and settlement |
| 4 | Verification | `/operations/verification` | `operations.verification.access` | Verification queue and review |
| 5 | Operations | `/operations/ops` | `operations.ops.access` | Cases, workflows, escalations |
| 6 | Communications | `/operations/communications` | `operations.communications.access` | Member communications and chat |
| 7 | Reports | `/operations/reports` | `operations.reports.read` | Operational reports |
| 8 | AI Operations Assistant | `/operations/ai` | `operations.ai.access` | Full-screen AI workspace |

### 6.2 Dashboard

Route: `/operations/dashboard`

| Section | Content | Route for Detail |
|---|---|---|
| Operations KPIs | Volume, throughput, open cases, SLA status | `/operations/reports/kpis` |
| Pending Verifications | Count of members awaiting review | `/operations/verification` |
| Open Cases | Active cases and escalations | `/operations/ops/cases` |
| Recent Alerts | System and compliance alerts | `/operations/ops/alerts` |
| Chat Queue | Unassigned member chat sessions | `/operations/communications/queue` |
| My Queue | Items assigned to the signed-in operator | `/operations/ops/my-queue` |

### 6.3 Members Section

Route: `/operations/members`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/operations/members` | Member search | `operations.members.read` |
| `/operations/members/:id` | Member profile (read-only view) | `operations.members.read` |
| `/operations/members/:id/accounts` | Member accounts (operational view) | `operations.members.accounts.read` |
| `/operations/members/:id/transactions` | Member transaction history | `operations.members.transactions.read` |
| `/operations/members/:id/verification` | Member verification status | `operations.verification.read` |
| `/operations/members/:id/cards` | Member cards overview | `operations.members.cards.read` |
| `/operations/members/:id/cases` | Member-related cases | `operations.ops.cases.read` |
| `/operations/members/:id/communications` | Member communications log | `operations.communications.read` |
| `/operations/members/:id/flags` | Risk and compliance flags | `operations.banking.flags.read` |

### 6.4 Banking Section

Route: `/operations/banking`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/operations/banking` | Banking operations overview | `operations.banking.access` |
| `/operations/banking/transactions` | Transaction monitoring | `operations.banking.transactions.read` |
| `/operations/banking/transactions/:id` | Transaction detail | `operations.banking.transactions.read` |
| `/operations/banking/disputes` | Dispute queue | `operations.banking.disputes.read` |
| `/operations/banking/disputes/:id` | Dispute detail | `operations.banking.disputes.read` |
| `/operations/banking/settlement` | Settlement monitoring | `operations.banking.settlement.read` |
| `/operations/banking/ach` | ACH operations | `operations.banking.ach.read` |
| `/operations/banking/wire` | Wire operations | `operations.banking.wire.read` |
| `/operations/banking/fraud` | Fraud flags and alerts | `operations.banking.fraud.read` |

### 6.5 Verification Section

Route: `/operations/verification`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/operations/verification` | Verification queue | `operations.verification.access` |
| `/operations/verification/:id` | Verification case detail | `operations.verification.review` |
| `/operations/verification/:id/documents` | Submitted documents | `operations.verification.documents.read` |
| `/operations/verification/:id/approve` | Approve verification | `operations.verification.approve` |
| `/operations/verification/:id/reject` | Reject verification | `operations.verification.reject` |
| `/operations/verification/:id/request-more` | Request additional information from member | `operations.verification.request` |

### 6.6 Operations Section

Route: `/operations/ops`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/operations/ops` | Operations overview | `operations.ops.access` |
| `/operations/ops/cases` | Case management | `operations.ops.cases.read` |
| `/operations/ops/cases/new` | Create new case | `operations.ops.cases.create` |
| `/operations/ops/cases/:id` | Case detail | `operations.ops.cases.read` |
| `/operations/ops/my-queue` | Assigned items | `operations.ops.access` |
| `/operations/ops/escalations` | Escalation queue | `operations.ops.escalations.read` |
| `/operations/ops/alerts` | System alerts | `operations.ops.alerts.read` |
| `/operations/ops/workflows` | Active workflows | `operations.ops.workflows.read` |

### 6.7 Communications Section

Route: `/operations/communications`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/operations/communications` | Communications hub | `operations.communications.access` |
| `/operations/communications/queue` | Unassigned chat queue | `operations.communications.queue.read` |
| `/operations/communications/active` | Active chat sessions | `operations.communications.active.read` |
| `/operations/communications/chat/:id` | Chat thread with a member | `operations.communications.chat` |
| `/operations/communications/messages` | Message history | `operations.communications.messages.read` |
| `/operations/communications/templates` | Message templates | `operations.communications.templates.manage` |
| `/operations/communications/notifications` | Member notification management | `operations.communications.notifications.manage` |

### 6.8 Reports Section

Route: `/operations/reports`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/operations/reports` | Reports overview | `operations.reports.read` |
| `/operations/reports/transactions` | Transaction reports | `operations.reports.transactions.read` |
| `/operations/reports/members` | Member reports | `operations.reports.members.read` |
| `/operations/reports/verification` | Verification reports | `operations.reports.verification.read` |
| `/operations/reports/operations` | Operational performance reports | `operations.reports.ops.read` |
| `/operations/reports/compliance` | Compliance reports (operations-level) | `operations.reports.compliance.read` |
| `/operations/reports/kpis` | KPI dashboard | `operations.reports.kpis.read` |

### 6.9 AI Operations Assistant

Route: `/operations/ai`

The AI Operations Assistant is a full-screen workspace. It is accessible from the primary navigation and from the persistent AI launcher. See Section 8.

### 6.10 What Operations Personnel Must Never See

Operations personnel must never have access to:

- VANTORIS iCommand navigation or pages
- Platform configuration and security policy settings
- Hidden authority identifiers or iCommand-level permission scopes
- Executive governance reports accessible only to iCommand
- Any member portal personal navigation as their primary interface

---

## 7. VANTORIS iCommand Navigation

VANTORIS iCommand is the highest operational authority on the platform. It provides governance, platform configuration, security policy management, AI governance, compliance oversight, and executive reporting. All iCommand actions are subject to immutable audit logging. See `docs/RBAC.md § 9`.

### 7.1 Primary Navigation Items

| Position | Label | Route | Required Permission | Notes |
|---|---|---|---|---|
| 1 | Governance | `/icommand/governance` | `icommand.governance.access` | Always first |
| 2 | Platform Health | `/icommand/health` | `icommand.health.access` | System and service status |
| 3 | Analytics | `/icommand/analytics` | `icommand.analytics.access` | Executive reporting and business intelligence |
| 4 | Security | `/icommand/security` | `icommand.security.access` | Security policies and incident review |
| 5 | AI Governance | `/icommand/ai-governance` | `icommand.ai.governance.access` | AI policy, audit, and oversight |
| 6 | Configuration | `/icommand/configuration` | `icommand.configuration.access` | Platform configuration |
| 7 | Monitoring | `/icommand/monitoring` | `icommand.monitoring.access` | Real-time system monitoring |

### 7.2 Governance Section

Route: `/icommand/governance`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/icommand/governance` | Governance overview | `icommand.governance.access` |
| `/icommand/governance/policies` | Platform governance policies | `icommand.governance.policies.manage` |
| `/icommand/governance/roles` | Role and permission management | `icommand.governance.roles.manage` |
| `/icommand/governance/compliance` | Compliance overview and filings | `icommand.governance.compliance.read` |
| `/icommand/governance/audit` | Immutable audit log review | `icommand.governance.audit.read` |
| `/icommand/governance/reports` | Executive governance reports | `icommand.governance.reports.read` |

### 7.3 Platform Health Section

Route: `/icommand/health`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/icommand/health` | Platform health dashboard | `icommand.health.access` |
| `/icommand/health/services` | Service status and uptime | `icommand.health.services.read` |
| `/icommand/health/incidents` | Incident history | `icommand.health.incidents.read` |
| `/icommand/health/performance` | Performance metrics | `icommand.health.performance.read` |
| `/icommand/health/capacity` | Capacity planning | `icommand.health.capacity.read` |

### 7.4 Analytics Section

Route: `/icommand/analytics`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/icommand/analytics` | Executive analytics overview | `icommand.analytics.access` |
| `/icommand/analytics/business` | Business intelligence reports | `icommand.analytics.business.read` |
| `/icommand/analytics/members` | Member growth and retention | `icommand.analytics.members.read` |
| `/icommand/analytics/financial` | Financial performance | `icommand.analytics.financial.read` |
| `/icommand/analytics/operations` | Operational efficiency | `icommand.analytics.operations.read` |
| `/icommand/analytics/ai` | AI usage and performance | `icommand.analytics.ai.read` |

### 7.5 Security Section

Route: `/icommand/security`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/icommand/security` | Security overview | `icommand.security.access` |
| `/icommand/security/policies` | Security policy management | `icommand.security.policies.manage` |
| `/icommand/security/incidents` | Security incident management | `icommand.security.incidents.manage` |
| `/icommand/security/threats` | Threat detection dashboard | `icommand.security.threats.read` |
| `/icommand/security/compliance` | Regulatory compliance status | `icommand.security.compliance.read` |
| `/icommand/security/audit` | Security audit log | `icommand.governance.audit.read` |

### 7.6 AI Governance Section

Route: `/icommand/ai-governance`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/icommand/ai-governance` | AI governance overview | `icommand.ai.governance.access` |
| `/icommand/ai-governance/policies` | AI usage and ethics policies | `icommand.ai.policies.manage` |
| `/icommand/ai-governance/audit` | AI action audit log | `icommand.ai.audit.read` |
| `/icommand/ai-governance/models` | AI model registry and versioning | `icommand.ai.models.manage` |
| `/icommand/ai-governance/workflows` | AI workflow definitions | `icommand.ai.workflows.manage` |
| `/icommand/ai-governance/permissions` | AI permission descriptors | `icommand.ai.permissions.manage` |

### 7.7 Configuration Section

Route: `/icommand/configuration`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/icommand/configuration` | Platform configuration overview | `icommand.configuration.access` |
| `/icommand/configuration/platform` | Core platform settings | `icommand.configuration.platform.manage` |
| `/icommand/configuration/features` | Feature flags and entitlements | `icommand.configuration.features.manage` |
| `/icommand/configuration/integrations` | External integrations management | `icommand.configuration.integrations.manage` |
| `/icommand/configuration/notifications` | System notification configuration | `icommand.configuration.notifications.manage` |
| `/icommand/configuration/rules` | Rules Engine configuration | `icommand.configuration.rules.manage` |

### 7.8 Monitoring Section

Route: `/icommand/monitoring`

| Sub-route | Page | Required Permission |
|---|---|---|
| `/icommand/monitoring` | Real-time monitoring dashboard | `icommand.monitoring.access` |
| `/icommand/monitoring/logs` | System logs | `icommand.monitoring.logs.read` |
| `/icommand/monitoring/alerts` | Active system alerts | `icommand.monitoring.alerts.read` |
| `/icommand/monitoring/jobs` | Background jobs and queues | `icommand.monitoring.jobs.read` |
| `/icommand/monitoring/database` | Database health | `icommand.monitoring.database.read` |

### 7.9 Hidden Authority Rules for iCommand Navigation

- Hidden authority identifiers (internal role codes, token scope strings, database permission IDs) must never appear in any iCommand navigation label, page title, URL displayed to users, or AI output.
- The label "VANTORIS iCommand" or "iCommand" is the permitted workspace name. Underlying permission scope identifiers are never exposed.
- iCommand navigation items and routes are never included in any response, suggestion, or output visible to members or operations personnel.

---

## 8. AI Navigation

Each workspace has one AI assistant. AI assistants are full-screen workspaces, not popups or overlays. AI navigation is permission-aware: the AI never suggests, links to, or executes actions the signed-in user is not authorized to perform.

### 8.1 AI Workspace Assignment

| Workspace | AI Workspace Name | Route | Required Permission |
|---|---|---|---|
| Member Portal | Financial Assistant | `/member/ai` | `member.ai.access` |
| Operations Center | Operations Assistant | `/operations/ai` | `operations.ai.access` |
| VANTORIS iCommand | Platform Intelligence | `/icommand/ai` | `icommand.ai.access` |

### 8.2 AI Navigation Rules

1. AI assistants must only present action buttons, suggestions, and links for destinations the current user is authorized to reach.
2. AI must never suggest iCommand pages to members or operations personnel.
3. AI must never suggest Operations Center pages to members.
4. AI must never surface another member's data in a response, suggestion, or AI action.
5. AI navigation suggestions must use canonical deep links (see Section 11).
6. AI action execution must produce an immutable audit event.
7. AI workspaces are accessible from the primary navigation and from the persistent AI launcher (draggable floating button with persisted position per user).
8. AI workspace context is isolated per session and per user. Memory from one user's session must not influence another user's session. See `docs/SECURITY_STANDARDS.md § 7.3`.

### 8.3 Financial Assistant (Member Portal)

Route: `/member/ai`

The Financial Assistant is the member-facing AI workspace. It is also accessible from `/member/support/ai`.

Permitted actions:

- Answer questions about the member's own accounts, transactions, cards, credit, and investments
- Suggest navigation to the member's own permitted pages
- Initiate permitted member workflows (e.g., initiate a transfer with user confirmation, apply for a credit product)
- Summarize member documents and statements
- Provide financial education responses
- Surface contextual recommendations based on account activity

Prohibited actions:

- Reference or suggest other members' data
- Navigate to or suggest Operations Center or iCommand pages
- Execute actions requiring permissions the member does not hold
- Display internal role names, permission codes, or internal identifiers

### 8.4 Operations Assistant (Operations Center)

Route: `/operations/ai`

The Operations Assistant is the operations-facing AI workspace.

Permitted actions:

- Surface member information within the operator's permitted scope
- Suggest navigation within the Operations Center
- Assist with case management, verification review, and communication drafts
- Summarize member verification documents (within permissions)
- Recommend workflow actions based on case context

Prohibited actions:

- Navigate to or suggest iCommand pages
- Execute actions beyond the operator's permission scope
- Display hidden authority identifiers

### 8.5 Platform Intelligence (VANTORIS iCommand)

Route: `/icommand/ai`

Platform Intelligence is the iCommand-level AI workspace.

Permitted actions:

- Answer questions about platform health, analytics, and governance
- Assist with configuration and policy management workflows
- Summarize audit logs and compliance reports
- Navigate within the iCommand workspace
- Identify anomalies in operations, security, and AI activity data

Prohibited actions:

- Display hidden authority identifiers
- Execute irreversible configuration changes without explicit confirmation and audit event

### 8.6 AI Launcher (Persistent Floating Button)

Every authenticated workspace provides a persistent AI launcher: a small floating button the user can drag to any position. The last position is persisted per user. The launcher is keyboard-accessible.

- In the Member Portal, the launcher opens the Financial Assistant (`/member/ai`).
- In the Operations Center, the launcher opens the Operations Assistant (`/operations/ai`).
- In the iCommand workspace, the launcher opens Platform Intelligence (`/icommand/ai`).

---

## 9. Authentication and Onboarding Navigation

Authentication and onboarding flows are independent navigation stacks. They are never mixed with authenticated portal navigation.

### 9.1 Authentication Routes

| Route | Page | Notes |
|---|---|---|
| `/auth/sign-in` | Sign-in page | Entry point for returning members |
| `/auth/mfa` | MFA challenge | Redirected from sign-in if MFA required |
| `/auth/passkey` | Passkey authentication | Alternative to password flow |
| `/auth/biometric` | Biometric prompt | Mobile biometric authentication |
| `/auth/trusted-device` | Trusted device prompt | Verification of trusted device on sign-in |
| `/auth/step-up` | Step-up re-authentication | High-risk action confirmation |
| `/auth/forgot-password` | Password recovery | Email/phone-initiated reset |
| `/auth/recovery` | Recovery code entry | Fallback if primary method unavailable |
| `/auth/sign-out` | Sign-out | Terminates session; redirects to `/auth/sign-in` |

### 9.2 Onboarding Routes

| Route | Page | Notes |
|---|---|---|
| `/auth/register` | Account type selection | Entry point for new members |
| `/auth/register/personal` | Personal account creation | Personal member onboarding |
| `/auth/register/business` | Business account creation | Business member onboarding |
| `/auth/register/verify-email` | Email verification | Confirm email during onboarding |
| `/auth/register/verify-phone` | Phone verification | Confirm phone during onboarding |
| `/auth/register/identity` | Identity submission | Initial KYC document upload |
| `/auth/register/complete` | Onboarding completion | Transition to Member Portal |

Rules:

- Once a member completes onboarding (`/auth/register/complete`), navigating to any `/auth/register/*` route redirects to the Member Portal dashboard.
- Onboarding routes must never be accessible from within an authenticated Member Portal session.
- Step-up re-authentication (`/auth/step-up`) is triggered inline from the operation requiring it. After successful step-up, the user returns to the original destination. See `docs/AUTHENTICATION.md § 12` and `docs/SECURITY_STANDARDS.md § 6.5`.

### 9.3 Post-Authentication Routing

| Scenario | Destination |
|---|---|
| New member, completed registration | `/member/home` |
| Returning member with active session | `/member/home` |
| Returning member, first sign-in after registration | `/member/home` |
| Returning member following a notification deep link | Deep link destination (if authorized) |
| Operations personnel sign-in | `/operations/dashboard` |
| iCommand personnel sign-in | `/icommand/governance` |
| Unauthenticated user accessing `/member/*` | `/auth/sign-in` (with redirect back after auth) |
| Unauthenticated user accessing `/operations/*` | `/auth/sign-in` (with redirect back after auth) |
| Unauthenticated user accessing `/icommand/*` | `/auth/sign-in` (with redirect back after auth) |
| Authenticated member accessing `/operations/*` | Permission error page |
| Authenticated member accessing `/icommand/*` | Permission error page |

---

## 10. Button Behavior Specification

Every interactive button on the platform must satisfy the following specification. No placeholder buttons, disabled-but-visible buttons for restricted features, or buttons with undefined destinations are permitted.

### 10.1 Button Specification Fields

Every button definition must include:

| Field | Description |
|---|---|
| Label | User-visible button text |
| Route/Destination | The canonical route the button navigates to or the action it triggers |
| Required Permission | The permission descriptor that must be present in the user's token for the button to appear |
| Visibility Rule | When the button is shown (always, conditional on status, etc.) |
| Success Action | What happens after the action succeeds (navigation, notification, state update) |
| Failure Action | What happens if the action fails (error message, retry, redirect) |
| Notification | Whether a notification is sent (to whom, what trigger) |
| Audit Event | Whether an audit event is emitted (event type, fields captured) |
| Step-Up Required | Whether the action requires fresh authentication (`docs/AUTHENTICATION.md § 12`) |

### 10.2 Primary Call-to-Action Buttons

| Button | Workspace | Destination | Permission | Audit |
|---|---|---|---|---|
| Open Account | Public Website | `/auth/register` | None (public) | No |
| Sign In | Public Website | `/auth/sign-in` | None (public) | No |
| Transfer Money | Member Portal | `/member/payments/transfer` | `member.payments.transfer` | Yes |
| Pay a Bill | Member Portal | `/member/payments/billpay` | `member.payments.billpay` | Yes |
| Send via Zelle | Member Portal | `/member/payments/zelle` | `member.payments.zelle` | Yes |
| Freeze Card | Member Portal | `/member/cards/:id/controls` | `member.cards.controls` | Yes |
| Apply for Credit | Member Portal | `/member/credit/apply` | `member.credit.apply` | Yes |
| Contact Support | Member Portal | `/member/support` | `member.support.access` | No |
| Approve Verification | Operations Center | `/operations/verification/:id/approve` | `operations.verification.approve` | Yes (required) |
| Reject Verification | Operations Center | `/operations/verification/:id/reject` | `operations.verification.reject` | Yes (required) |
| Create Case | Operations Center | `/operations/ops/cases/new` | `operations.ops.cases.create` | Yes |
| Start Chat | Operations Center | `/operations/communications/chat/:id` | `operations.communications.chat` | Yes |
| Update Policy | iCommand | `/icommand/governance/policies` | `icommand.governance.policies.manage` | Yes (required, with before/after state) |
| Configure Feature Flag | iCommand | `/icommand/configuration/features` | `icommand.configuration.features.manage` | Yes (required, with before/after state) |

### 10.3 Destructive and High-Risk Buttons

Buttons that trigger irreversible or high-risk actions (wire transfers, account closures, permission changes, security policy updates) must:

1. Require explicit user confirmation (confirmation dialog with action description)
2. Require step-up re-authentication when the risk level warrants it (see `docs/AUTHENTICATION.md § 12`)
3. Emit an immutable audit event on both initiation and completion
4. Display a clear success state (confirmation message with reference ID) or clear failure state (specific error with retry guidance)

---

## 11. Deep Links

Every page on the platform has a canonical deep link. Deep links are used by AI suggestions, notifications, email links, and external system integrations to navigate users directly to the correct page.

### 11.1 Deep Link Format

Web:
```
https://app.vantoris.com/{route}?dl_id={id}&source={source}
```

Mobile:
```
vantoris://{route}?dl_id={id}&source={source}
```

Parameters:

| Parameter | Description |
|---|---|
| `route` | The canonical route path (e.g., `member/accounts/acct_123`) |
| `dl_id` | Unique deep link identifier for audit and tracking |
| `source` | Origin of the deep link (`ai`, `notification`, `email`, `sms`, `external`) |

### 11.2 Deep Link Resolution Rules

1. A deep link resolves to the correct page only if the authenticated user has permission to access that page.
2. If the user is unauthenticated, the deep link is preserved and the user is redirected to sign-in. After successful authentication, the deep link is resolved.
3. If the authenticated user does not have permission to access the deep link destination, they are shown a permission error page (not a 404). The error page explains that access is not available and provides a link to the appropriate home destination.
4. Deep links to another member's data resolve to a permission error for any authenticated member who is not that member.
5. Deep links to Operations Center pages resolve to a permission error for members.
6. Deep links to iCommand pages resolve to a permission error for members and operations personnel without iCommand access.

### 11.3 AI Deep Links

When the AI assistant in any workspace navigates a user to a destination, it must:

1. Emit a navigation audit event with: user identity, AI workspace, destination route, deep link ID, and timestamp
2. Verify that the destination is within the user's permission scope before presenting the link
3. Never present a link that the user cannot access
4. Use the canonical deep link format to ensure the page loads directly without requiring intermediate clicks

### 11.4 Notification Deep Links

Every notification that references a specific resource (an account, a transaction, a case, a verification submission) must include a deep link to that resource. The notification deep link must resolve to the correct page directly.

### 11.5 Canonical Route Registry

The following table defines canonical routes for the most frequently deep-linked destinations:

| Destination | Canonical Route | Notes |
|---|---|---|
| Member Portal Home | `/member/home` | |
| Account Detail | `/member/accounts/:accountId` | |
| Transaction Detail | `/member/accounts/:accountId/transactions/:txId` | |
| Payment Transfer | `/member/payments/transfer` | |
| Card Detail | `/member/cards/:cardId` | |
| Verification Status | `/member/verification/status` | |
| Security Settings | `/member/security` | |
| Support Hub | `/member/support` | |
| Financial Assistant | `/member/ai` | |
| Operations Dashboard | `/operations/dashboard` | |
| Member Profile (Ops) | `/operations/members/:memberId` | |
| Verification Case | `/operations/verification/:caseId` | |
| Support Case | `/operations/ops/cases/:caseId` | |
| Operations Assistant | `/operations/ai` | |
| iCommand Governance | `/icommand/governance` | |
| Audit Log | `/icommand/governance/audit` | |
| Platform Health | `/icommand/health` | |
| Platform Intelligence | `/icommand/ai` | |

Deep link contracts must be documented in `docs/api/deeplinks.yaml` and included in the AI Action Catalog entries. See `docs/API_ARCHITECTURE.md`.

---

## 12. Responsive Navigation

Navigation adapts to the user's device and screen size automatically. Users must never need to manually zoom or reconfigure to use the platform. Navigation structure is defined per breakpoint. See `docs/DESIGN_SYSTEM.md § Responsive Design`.

### 12.1 Breakpoints

| Breakpoint | Name | Width Range | Navigation Mode |
|---|---|---|---|
| XS | Mobile | 0 – 639 px | Bottom Navigation |
| SM | Large Mobile / Foldable (folded) | 640 – 767 px | Bottom Navigation |
| MD | Tablet (portrait) | 768 – 1023 px | Adaptive Navigation (collapsible sidebar or bottom nav) |
| LG | Tablet (landscape) / Small Laptop | 1024 – 1279 px | Persistent Sidebar (icons + labels) |
| XL | Desktop | 1280 – 1535 px | Persistent Sidebar (full labels) |
| 2XL | Large / Ultra-wide Display | 1536 px and above | Persistent Sidebar + Multi-panel Navigation |

### 12.2 Mobile Navigation (XS, SM)

Primary navigation: Bottom Navigation Bar.

Rules:
- Bottom navigation bar displays exactly 5 tabs for the Member Portal.
- Tab order (Member Portal): Home, Accounts, Payments, Cards, More
- "More" opens a drawer showing all remaining navigation items (Wealth, Credit, Verification Center, Security, Support, Profile).
- Operations Center mobile navigation: Dashboard, Members, Ops, Communications, More
- iCommand mobile navigation: Dashboard, Governance, Analytics, More
- Navigation labels are visible beneath each icon.
- Touch targets are minimum 44 × 44 points.
- The persistent AI launcher appears above the bottom navigation bar and does not overlap tab labels.
- Full-screen forms, verification flows, and AI workspaces open as full-screen overlays on mobile.

### 12.3 Tablet Navigation (MD)

Primary navigation: Adaptive (collapsible sidebar in landscape; bottom navigation in portrait).

Rules:
- In portrait orientation, tablet navigation mirrors mobile bottom navigation behavior.
- In landscape orientation, a collapsed sidebar (icons only) appears on the left. Expanding the sidebar reveals full labels.
- Split-screen is supported where useful (e.g., member list + member detail on the Operations Center Members page).

### 12.4 Desktop Navigation (LG, XL)

Primary navigation: Persistent Sidebar (left-anchored).

Rules:
- Sidebar displays all primary navigation items with icons and labels.
- Sidebar does not collapse by default but may be user-toggleable between expanded (icon + label) and narrow (icon only) states.
- Sidebar state (expanded or narrow) is persisted per user.
- Top navigation bar provides: workspace logo/name, search (if applicable), notifications, and user profile.
- AI workspace docks to the right side of the screen when open and does not cover the primary content area.

### 12.5 Large Display Navigation (2XL)

Primary navigation: Persistent Sidebar + Multi-panel Content Area.

Rules:
- Content area supports multi-panel layouts (e.g., member list on the left, member detail in the center, case detail on the right in the Operations Center).
- Content never stretches edge to edge. Maximum content width is defined in the design system.
- Readable line lengths are preserved.
- Whitespace is used to improve readability, not to fill empty space with stretched elements.
- The AI workspace may appear as a persistent panel when sufficient screen width is available.

### 12.6 Foldable Phones

Foldable phones in folded state behave as large mobile (SM breakpoint). Foldable phones in unfolded state behave as tablet (MD breakpoint). Navigation adapts automatically to fold state changes without page reload.

### 12.7 Zoom Accessibility

Navigation must remain fully functional at 100%, 125%, 150%, and 200% browser zoom. At increased zoom levels:
- Bottom navigation tabs may reduce to icon-only if labels no longer fit.
- Sidebar may auto-collapse to icon-only if labels no longer fit.
- No navigation element becomes unreachable or hidden due to overflow.

---

## 13. Rules Engine Integration

The platform's Rules Engine automatically modifies navigation visibility and workflow state based on the current user's context. Navigation adapts without requiring page reload or manual action. See `docs/RBAC.md § 11`.

### 13.1 Navigation Adaptation Triggers

The Rules Engine evaluates the following conditions and updates navigation accordingly:

| Condition | Navigation Effect |
|---|---|
| Account type changes (personal → business) | Business-specific navigation items become visible |
| Verification status changes to Verified | Verification Center item may show resolved state; restricted features unlock |
| Verification status changes to Under Review | Navigation items requiring full verification show a pending indicator |
| Verification status changes to Failed | Verification Center item shows action required indicator |
| Active onboarding workflow exists | Relevant onboarding step surfaces in the member dashboard |
| Active support case exists | Open case summary visible in Support section |
| Active dispute exists | Dispute status visible in relevant account or payments section |
| MFA not enrolled | Security section shows a prominent action required indicator |
| Trusted device not registered | Security section shows a recommendation |
| Wealth products not enrolled | Wealth navigation item is hidden |
| Credit products not available | Credit navigation item is hidden |
| HeroBox enrolled | HeroBox summary visible in Member Portal home |
| Assigned verification case (Operations) | Case appears in operator's My Queue |
| Escalation assigned (Operations) | Escalation appears in operator's My Queue |

### 13.2 Automatic Navigation Changes Without Reload

Navigation changes triggered by the Rules Engine are applied to the active session in real time via WebSocket or Server-Sent Events. Users do not need to refresh the page to see navigation updates resulting from permission changes, verification status updates, or workflow state transitions.

### 13.3 Permission Discovery API

The frontend navigation system queries the Permission Discovery API to determine which navigation items, action buttons, and AI suggestions are available for the current session. This API returns the set of authorized actions and destinations for the signed-in user, reflecting the current state of all Rules Engine conditions. See `docs/RBAC.md § 12.2`.

---

## 14. Verification Center Navigation

The Verification Center is the canonical location for all identity and KYC workflows. It is a section within the Member Portal and is also linked from the Operations Center (for review). "KYC" must not appear as a navigation label or page title. See `docs/REPOSITORY_STANDARDS.md § VERIFICATION CENTER`.

### 14.1 Member-Facing Verification Center

Location: `/member/verification` (within Member Portal navigation, Section 5.8)

Verification states visible to members:

| State | Label Shown to Member | Action Available |
|---|---|---|
| Unverified | "Complete your verification" | Navigate to `/member/verification/identity` |
| Identity Submitted | "Verification in progress" | View status at `/member/verification/status` |
| Under Review | "Your documents are under review" | View status at `/member/verification/status` |
| Verified | "Verified" | View verification history |
| Failed | "Action required — please resubmit" | Navigate to `/member/verification/resubmit` |

### 14.2 Operations-Facing Verification Center

Location: `/operations/verification` (within Operations Center, Section 6.5)

Operations personnel see the verification queue and review pages. They do not see member-facing status labels; they see operational case status and workflow actions.

---

## 15. HeroBox and NGO Portal Navigation

### 15.1 HeroBox

HeroBox is a feature within the Member Portal and a landing page on the Public Website. It does not have its own separate authenticated workspace; it is accessed through the Member Portal.

- Public Website HeroBox landing: `/herobox` (Section 4.3)
- Member Portal HeroBox access: Members enrolled in HeroBox see a HeroBox summary card on their home dashboard linking to `/member/herobox` (a sub-section within the Member Portal accounts/benefits area)
- HeroBox does not duplicate navigation items from the Member Portal. It is a feature context within the existing Member Portal navigation, not a separate top-level item.

### 15.2 NGO Portal

The NGO Portal is a purpose-specific surface for NGO organization administrators. It shares the VANTORIS design system and navigation model but has its own navigation root.

| Route | Page | Required Permission |
|---|---|---|
| `/ngo/dashboard` | NGO dashboard | `ngo.dashboard.access` |
| `/ngo/members` | Organization member management | `ngo.members.manage` |
| `/ngo/accounts` | Organization account management | `ngo.accounts.read` |
| `/ngo/programs` | Program and benefit management | `ngo.programs.manage` |
| `/ngo/reports` | NGO reports | `ngo.reports.read` |
| `/ngo/settings` | NGO organization settings | `ngo.settings.manage` |

The NGO Portal uses the same design system, authentication flow, and RBAC model as the rest of the platform. It does not introduce a separate navigation architecture.

---

## 16. Navigation Visibility and RBAC Enforcement

Navigation visibility is enforced at two levels: the frontend (UI visibility) and the backend (API authorization). Both levels must enforce the same rules independently. See `docs/RBAC.md § 12`.

### 16.1 Frontend Enforcement

- The frontend navigation system queries the Permission Discovery API on session initialization and whenever the session state changes.
- Navigation items, action buttons, and AI suggestions are rendered only for items returned as authorized by the Permission Discovery API.
- Navigation items for unauthorized destinations are never rendered (not hidden with CSS, not disabled — entirely absent from the DOM).

### 16.2 Backend Enforcement

- Every API endpoint enforces RBAC independently of the frontend.
- Removing a navigation item from the frontend is not sufficient authorization enforcement.
- Backend authorization errors return a 403 Forbidden response. The frontend handles 403 responses by showing an appropriate error page (not a 404).

### 16.3 URL Direct Access

- A member who manually types an Operations Center or iCommand URL receives a 403 response that redirects to a permission error page, not a 404.
- A member who manually types another member's account URL receives a 403 response.
- The error page confirms that the resource exists but is not accessible to the current user, and provides a link to the appropriate home destination.

### 16.4 Token Scope and Navigation Scope

Navigation scope is derived from JWT token scopes. The token includes only the scopes the current user is authorized for. Navigation items that require a scope not present in the token are not shown. See `docs/AUTHENTICATION.md § 7.4` and `docs/RBAC.md § 12.4`.

---

## 17. Audit and Observability

### 17.1 Navigation Events That Must Be Audited

| Event | Audit Required | Fields Required |
|---|---|---|
| Successful page navigation | No (high volume, logged by observability layer) | — |
| AI navigation suggestion followed | Yes | User, AI workspace, destination, deep link ID, timestamp |
| AI action executed from navigation | Yes | User, AI workspace, action, destination, timestamp |
| Deep link resolution (authorized) | No | — |
| Deep link resolution (permission error) | Yes | User, deep link destination, resolved permission error |
| Step-up authentication triggered by navigation | Yes | User, destination, trigger reason, outcome |
| High-risk button pressed | Yes | User, button action, destination, confirmation state |
| Verification status change triggering navigation update | Yes | Member, previous state, new state, triggering event |

### 17.2 Audit Event Fields

Every navigation audit event must include: `actor_id`, `session_id`, `device_id`, `source_workspace`, `destination_route`, `permission_scope`, `correlation_id`, `timestamp`. See `docs/SECURITY_STANDARDS.md § 4.2`.

---

## 18. Base44 Compatibility

Navigation architecture must remain compatible with the Base44 application imported into this repository. See `docs/MIGRATION_GUIDE.md`.

### 18.1 Compatibility Requirements

1. Base44 routes that map to Member Portal features must be redirected to the canonical routes defined in this document (Section 5) using HTTP 301 permanent redirects.
2. Base44 routes that map to Operations Center features must be redirected to canonical Operations Center routes (Section 6).
3. Deep links issued before the migration that target Base44 routes must resolve correctly after the migration via redirect.
4. Navigation items in the Base44 application that conflict with this document's single-home principle must be consolidated. The canonical home defined in this document takes precedence.
5. Base44 navigation patterns (e.g., bottom navigation tab structure, sidebar structure) must be preserved where they are consistent with this document. Deviations must be resolved in favor of this document.

### 18.2 Post-Migration Navigation Verification

After the Base44 import, every navigation item in this document must be verified as follows:

| Status | Meaning |
|---|---|
| Verified | Route exists, loads correctly, and RBAC enforcement is confirmed |
| Needs Refactoring | Route exists but navigation behavior or RBAC does not match this document |
| Missing | Route is defined in this document but not yet implemented |
| Deprecated | Route exists in Base44 but is superseded by a canonical route in this document |

See `docs/MIGRATION_GUIDE.md § Feature Parity Classification` and `docs/TESTING.md § 4`.

---

## 19. Cross-References

| Document | Relevant Sections |
|---|---|
| `docs/ARCHITECTURE.md` | Platform architectural domains, Member Experience Layer, Operations Layer, AI Layer |
| `docs/COMPONENT_ARCHITECTURE.md` | Navigation components, Bottom Navigation, Top Navigation, Responsive Behavior, Breakpoints |
| `docs/DESIGN_SYSTEM.md` | Navigation Model, Responsive Design, Color System, AI Experience Standards |
| `docs/AUTHENTICATION.md` | Session lifecycle, Post-authentication routing, Step-up authentication, Token scopes |
| `docs/RBAC.md` | Role definitions, Visibility rules, Hide-not-disable principle, Permission Discovery API, Navigation sections per role |
| `docs/SECURITY_STANDARDS.md` | Session security, Audit logging required fields, AI security, Deep link security |
| `docs/API_ARCHITECTURE.md` | Permission-aware API responses, Deep link contract (`docs/api/deeplinks.yaml`), AI Action Catalog |
| `docs/DATABASE_ARCHITECTURE.md` | Session security model, Row-level security, Trusted device state |
| `docs/REPOSITORY_STANDARDS.md` | AI Command Center as full-screen workspace, AI launcher, Member Advisor, Verification Center, Trusted Devices |
| `docs/CODING_STANDARDS.md` | TypeScript typing for navigation definitions, Permission descriptor patterns |
| `docs/MIGRATION_GUIDE.md` | Route redirect strategy, Feature parity classification, Post-migration navigation verification |
| `docs/TESTING.md` | Navigation functional testing, RBAC navigation testing, Deep link testing, Responsive navigation testing |

---

## 20. Dependencies and Gaps Discovered

1. **`docs/api/deeplinks.yaml` does not yet exist.** Deep link format is defined in this document and in `docs/API_ARCHITECTURE.md`. The OpenAPI contract for deep links must be created as part of the API implementation phase.

2. **Permission Discovery API contract is not yet specified.** This document defines the behavior of the Permission Discovery API but the OpenAPI contract (`docs/api/permissions.yaml`) has not been created. This is a dependency for dynamic navigation visibility.

3. **Rules Engine route specification.** This document references Rules Engine navigation adaptation triggers (Section 13). The specific Rules Engine event schema and the WebSocket/SSE payload format for real-time navigation updates are not yet documented. A `docs/RULES_ENGINE.md` document is recommended.

4. **HeroBox Member Portal integration routes.** Section 15.1 references `/member/herobox` as a sub-section within the Member Portal, but the specific page structure and sub-routes for HeroBox within the Member Portal have not been fully specified. These should be defined when the HeroBox feature is implemented.

5. **NGO Portal full navigation specification.** Section 15.2 provides a high-level NGO Portal navigation. A dedicated NGO Portal navigation specification may be needed depending on the complexity of NGO workflows.

6. **Notification deep link payload schema.** Section 11.4 defines the behavior of notification deep links but the notification payload schema (including the `deep_link` field) is not yet specified in the notifications API contract (`docs/api/notifications.yaml`).

7. **`docs/VERIFICATION_CENTER.md` referenced in REPOSITORY_STANDARDS but not yet created.** `docs/REPOSITORY_STANDARDS.md` references this document. It should be created to fully specify Verification Center routes, states, and workflows.

---

## 21. Remaining Documentation

Documentation to be created after this document (in recommended order):

1. **`docs/VERIFICATION_CENTER.md`** — Full specification of Verification Center routes, states, workflows, member experience, and operations review process.
2. **`docs/RULES_ENGINE.md`** — Rules Engine event schema, workflow definitions, navigation adaptation triggers, and escalation path specifications.
3. **`docs/api/deeplinks.yaml`** — OpenAPI contract for deep link format and resolution.
4. **`docs/api/permissions.yaml`** — OpenAPI contract for the Permission Discovery API.
5. **`docs/api/notifications.yaml`** — OpenAPI contract including notification deep link payload schema.
6. **`docs/HEROBOX.md`** — HeroBox feature specification including Member Portal integration and navigation.
7. **`docs/NGO_PORTAL.md`** — Full NGO Portal navigation and workflow specification.
8. **`docs/DOCUMENTATION_STANDARDS.md`** — Referenced in `docs/REPOSITORY_STANDARDS.md` as a planned document.

---

## 22. Recommendations Before the Next Document

1. **Create `docs/VERIFICATION_CENTER.md` next.** The Verification Center is referenced in multiple documents (RBAC, AUTHENTICATION, REPOSITORY_STANDARDS, TESTING, DESIGN_SYSTEM, this document) without a dedicated specification. It is a critical member-facing workflow.

2. **Define the Permission Discovery API contract.** Before implementing dynamic navigation visibility, the Permission Discovery API OpenAPI contract (`docs/api/permissions.yaml`) should be drafted. This unblocks frontend navigation implementation.

3. **Review Base44 navigation for conflicts.** When the Base44 export is imported, the first navigation task should be a route audit comparing Base44 routes against the canonical routes defined in this document. Routes that conflict should be marked for refactoring before new navigation work begins.

4. **Establish navigation testing standards in CI.** `docs/TESTING.md` covers navigation testing but does not define automated checks for the single-home principle. CI should include checks that verify no navigation item appears in more than one location in the navigation definition files.

5. **Specify the real-time navigation update mechanism.** This document requires navigation to update in real time (Section 13.2). The WebSocket or SSE mechanism for delivering Rules Engine events to the frontend should be specified before implementing adaptive navigation.

6. **Define the AI launcher position persistence schema.** The AI launcher position is persisted per user (Section 8.6). The user preference storage schema for this and related personalization preferences should be defined in `docs/DATABASE_ARCHITECTURE.md` or a dedicated preferences document.

---

## Files Created

- `docs/NAVIGATION_ARCHITECTURE.md` — this document

## Summary of Changes

This document establishes the complete navigation architecture for VANTORIS as a single normative source of truth. It defines:

- One permanent home for every feature across all five workspaces
- Complete route tables for Public Website, Member Portal, Operations Center, VANTORIS iCommand, NGO Portal, and Authentication/Onboarding flows
- Complete AI workspace navigation specifications for all three authenticated contexts
- Button behavior specification fields required for every interactive element
- Deep link format, resolution rules, and canonical route registry
- Responsive navigation rules for all breakpoints from mobile to ultra-wide
- Rules Engine navigation adaptation triggers and real-time update requirements
- Base44 compatibility requirements and post-migration verification process
- Navigation visibility and RBAC enforcement rules
- Audit requirements for navigation events
