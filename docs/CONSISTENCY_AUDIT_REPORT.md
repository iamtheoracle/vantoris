# VANTORIS Documentation Consistency Audit Report

**Date:** 2026-07-15
**Scope:** All existing documentation in the `iamtheoracle/vantoris` repository
**Purpose:** Comprehensive consistency review and architecture audit across all documentation
**Status:** Recommendations only — no existing documents have been modified

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Document Inventory](#2-document-inventory)
3. [Duplicate Concepts](#3-duplicate-concepts)
4. [Missing Cross References](#4-missing-cross-references)
5. [Terminology Inconsistencies](#5-terminology-inconsistencies)
6. [Missing Workflows](#6-missing-workflows)
7. [Missing Permissions](#7-missing-permissions)
8. [Missing Navigation Paths](#8-missing-navigation-paths)
9. [Missing AI Integrations](#9-missing-ai-integrations)
10. [Missing Rules Engine Integrations](#10-missing-rules-engine-integrations)
11. [Accessibility Gaps](#11-accessibility-gaps)
12. [Responsive Design Gaps](#12-responsive-design-gaps)
13. [Prioritized Recommendations](#13-prioritized-recommendations)

---

## 1. Executive Summary

### Overview

This audit reviewed all documentation present in the repository as of 2026-07-15. Of the 18 documents listed in the platform documentation plan, **9 exist** and **9 are missing**. The 9 existing documents establish strong foundations for architecture, standards, coding conventions, CI/CD, API design, and database structure. However, the absence of half the planned documents creates significant gaps in security, authentication, role-based access, testing, design, navigation, user journeys, and documentation governance.

### Key Findings

| Category | Finding Count | Severity |
|---|---|---|
| Missing planned documents | 9 | Critical |
| Duplicate or conflicting concepts | 5 | High |
| Missing cross-references | 23 | Medium–High |
| Terminology inconsistencies | 9 | Medium–High |
| Missing documented workflows | 15 | High |
| Missing permission definitions | 8 role types | Critical |
| Missing navigation path definitions | All portals | Critical |
| Missing AI integration specifications | 7 | High |
| Missing Rules Engine definitions | 8 | High |
| Accessibility gaps | 7 | High |
| Responsive design gaps | 6 | Medium |

### Immediate Impact

The most critical gap is the absence of RBAC.md, AUTHENTICATION.md, SECURITY_STANDARDS.md, NAVIGATION_ARCHITECTURE.md, and USER_JOURNEYS.md. These five documents are prerequisites for implementation and are referenced extensively in the existing nine documents. Without them, the Base44 migration cannot proceed safely and the platform cannot be implemented consistently.

A secondary concern is the **direct contradiction** between REPOSITORY_STANDARDS.md / CODING_STANDARDS.md (single trusted device per account) and DATABASE_ARCHITECTURE.md (maximum two active trusted devices). This must be resolved before any implementation begins.

The **WCAG version mismatch** (2.1 AA in COMPONENT_ARCHITECTURE vs 2.2 AA in CODING_STANDARDS) is also a conflict that must be resolved; CODING_STANDARDS is the more recent and normative document.

---

## 2. Document Inventory

### Documents That Exist

| # | File | Status | Core Content |
|---|---|---|---|
| 1 | `README.md` | ✅ Exists | Platform overview, module list, documentation index |
| 2 | `docs/ARCHITECTURE.md` | ✅ Exists | 5 architectural domains, tech stack, data flows |
| 3 | `docs/COMPONENT_ARCHITECTURE.md` | ✅ Exists | Component hierarchy, patterns, accessibility, responsive |
| 4 | `docs/REPOSITORY_STRUCTURE.md` | ✅ Exists | Monorepo layout, Base44 import guidance |
| 5 | `docs/REPOSITORY_STANDARDS.md` | ✅ Exists | Normative platform rules, AI Command Center, chat, verification |
| 6 | `docs/CODING_STANDARDS.md` | ✅ Exists | TypeScript, testing, design system, AI, permission gating rules |
| 7 | `docs/CI_CD.md` | ✅ Exists | Pipeline stages, security gates, evidence requirements |
| 8 | `docs/API_ARCHITECTURE.md` | ✅ Exists | Contract-first OpenAPI design, banking APIs, AI APIs, deep links |
| 9 | `docs/DATABASE_ARCHITECTURE.md` | ✅ Exists | PostgreSQL 16+, 18 logical schemas, ledger, audit, AI data model |

### Documents That Are Missing (Referenced But Not Yet Created)

| # | File | Referenced In | Urgency |
|---|---|---|---|
| 10 | `docs/SECURITY_STANDARDS.md` | 6 documents | Critical |
| 11 | `docs/AUTHENTICATION.md` | README | Critical |
| 12 | `docs/RBAC.md` | README, CODING_STANDARDS | Critical |
| 13 | `docs/MIGRATION_GUIDE.md` | 5 documents | High |
| 14 | `docs/TESTING.md` | CI_CD | High |
| 15 | `docs/DESIGN_SYSTEM.md` | README | High |
| 16 | `docs/NAVIGATION_ARCHITECTURE.md` | (implied by platform) | Critical |
| 17 | `docs/USER_JOURNEYS.md` | (implied by platform) | High |
| 18 | `docs/DOCUMENTATION_STANDARDS.md` | README | Medium |

**Additional document referenced but not in the 18-document plan:**
- `docs/VERIFICATION_CENTER.md` — referenced in CODING_STANDARDS.md (×1), API_ARCHITECTURE.md (×2), DATABASE_ARCHITECTURE.md (×1), REPOSITORY_STANDARDS.md (×1). This document is needed before implementation.

---

## 3. Duplicate Concepts

The following table identifies concepts that are defined in multiple documents with conflicting or divergent descriptions.

| Concept | Documents Affected | Issue | Recommendation |
|---|---|---|---|
| **Trusted device limit** | REPOSITORY_STANDARDS.md (§ TRUSTED DEVICES), CODING_STANDARDS.md (§ Trusted Devices), DATABASE_ARCHITECTURE.md (§ 11 Trusted Devices) | REPOSITORY_STANDARDS and CODING_STANDARDS state **"single trusted active device"**; DATABASE_ARCHITECTURE states **"maximum of two active trusted devices"** — a direct contradiction | Resolve before implementation. Decide the authoritative rule (1 or 2 devices) and update all three documents to reflect one consistent value |
| **WCAG compliance version** | COMPONENT_ARCHITECTURE.md (§ Design Principles, Accessibility First), CODING_STANDARDS.md (§ General Engineering) | COMPONENT_ARCHITECTURE references **WCAG 2.1 AA**; CODING_STANDARDS mandates **WCAG 2.2 AA** | CODING_STANDARDS is the normative document and the later standard. Update COMPONENT_ARCHITECTURE to reference WCAG 2.2 AA |
| **AI assistant naming** | README.md, ARCHITECTURE.md, COMPONENT_ARCHITECTURE.md, REPOSITORY_STANDARDS.md, CODING_STANDARDS.md, API_ARCHITECTURE.md | "Member Advisor" is used in README, ARCHITECTURE, REPOSITORY_STANDARDS, API_ARCHITECTURE; "AIAssistant" is the component name in COMPONENT_ARCHITECTURE. These are inconsistently applied — sometimes referring to the same feature | Standardize: "Member Advisor" = the product name (the feature); "AIAssistant" = the UI component name. Document this distinction in DOCUMENTATION_STANDARDS.md |
| **PostgreSQL version** | ARCHITECTURE.md (§ Backend technology decisions), DATABASE_ARCHITECTURE.md (§ Platform standards) | ARCHITECTURE.md references **PostgreSQL 15+**; DATABASE_ARCHITECTURE.md declares **PostgreSQL 16+** | DATABASE_ARCHITECTURE.md is the authoritative database document. Update ARCHITECTURE.md to reference PostgreSQL 16+ |
| **Operations portal name** | README.md (§ Core Modules), ARCHITECTURE.md (§ Domain 2) | README calls this module **"Operations Center"**; ARCHITECTURE calls it **"Operations & Administration Layer"** with sub-component **"Operations Dashboard"**; the CI/CD doc references the **"Operations Dashboard"** | Standardize the product-level name to "Operations Center" (README is the product document); use "Operations & Administration Layer" only for technical architecture diagrams |

---

## 4. Missing Cross References

### README.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/REPOSITORY_STANDARDS.md` | README is the entry point; all contributors should see the normative standards document | Add link under "Development Standards" section |
| `docs/CODING_STANDARDS.md` | README already references SECURITY_STANDARDS and DOCUMENTATION_STANDARDS but not this normative coding document | Add link under "Development Standards" section |
| `docs/CI_CD.md` | CI/CD governs all PR merges but is not discoverable from README | Add link under "Development Standards" section |
| `docs/API_ARCHITECTURE.md` | API contracts are central to development; not in the README documentation list | Add link under "Documentation" section |
| `docs/DATABASE_ARCHITECTURE.md` | Database schema is central to development; not in the README documentation list | Add link under "Documentation" section |

### ARCHITECTURE.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/COMPONENT_ARCHITECTURE.md` | Architecture describes Member Experience Layer but does not link to the component breakdown | Add cross-reference in Member Experience Layer section |
| `docs/API_ARCHITECTURE.md` | Architecture describes services but does not reference the API contract document | Add cross-reference in Core Banking Services and data flow sections |
| `docs/DATABASE_ARCHITECTURE.md` | Architecture describes data layer but does not reference the database document | Add cross-reference in Data Layer section |
| `docs/CODING_STANDARDS.md` | Architecture omits normative standards reference | Add cross-reference in Technology Decisions section |
| `docs/CI_CD.md` | Architecture omits CI/CD reference despite describing deployment strategy | Add cross-reference in Deployment Architecture section |
| `docs/REPOSITORY_STANDARDS.md` | Architecture omits standards reference | Add cross-reference at top of document |

### COMPONENT_ARCHITECTURE.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/DESIGN_SYSTEM.md` (when created) | Component architecture depends on design tokens and system | Add cross-reference in "Design Token Integration" section |
| `docs/REPOSITORY_STANDARDS.md` | WCAG 2.2 AA mandate (§ Design Principles) and accessibility rules come from here | Add cross-reference in Accessibility Standards section |
| `docs/CODING_STANDARDS.md` | WCAG 2.2 AA baseline defined here; component architecture should confirm alignment | Add cross-reference in Accessibility Standards section |

### REPOSITORY_STANDARDS.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/API_ARCHITECTURE.md` | Now exists — was listed as "(to be created)" in cross-references | Update cross-references to remove "(to be created)" annotation |
| `docs/DATABASE_ARCHITECTURE.md` | Now exists — not listed in cross-references | Add to cross-references section |
| `docs/CODING_STANDARDS.md` | Normative coding rules extend this document | Add to cross-references section |

### CODING_STANDARDS.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/API_ARCHITECTURE.md` | Now exists — contract-first API design rules apply to coding standards | Add to cross-references; remove "(to be created)" annotation |
| `docs/DATABASE_ARCHITECTURE.md` | Now exists — database domain rules inform coding patterns | Add to cross-references |
| `docs/VERIFICATION_CENTER.md` | Listed as "(to be created)" — should note creation urgency | Keep the annotation but elevate priority in text |

### CI_CD.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/API_ARCHITECTURE.md` | Now exists — contract test guidance referenced in CI | Add to cross-references; remove "(to be created)" annotation |
| `docs/DATABASE_ARCHITECTURE.md` | Now exists — migration testing rules apply to CI pipeline | Add to cross-references |

### API_ARCHITECTURE.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/DATABASE_ARCHITECTURE.md` | Database entity definitions inform API schema design | Add to cross-references |

### DATABASE_ARCHITECTURE.md

| Missing Reference | Reason | Recommendation |
|---|---|---|
| `docs/API_ARCHITECTURE.md` | API contracts govern the read/write interface to database entities | Add to cross-references |
| `docs/CODING_STANDARDS.md` | Coding standards govern how migrations and DB queries are written | Add to cross-references |

---

## 5. Terminology Inconsistencies

The following terms are used inconsistently across documents. A recommended standard name is provided for each.

| Term Variation | Current Usage | Recommended Standard | Documents Affected |
|---|---|---|---|
| **AI assistant (member-facing)** | "Member Advisor" (README, ARCHITECTURE, REPOSITORY_STANDARDS, API_ARCHITECTURE), "AIAssistant" (COMPONENT_ARCHITECTURE component name), "Financial Assistant" (problem statement context) | **Product name: "Member Advisor"**; UI component: `AIAssistant`; these are intentionally distinct and should be documented as such | README, ARCHITECTURE, COMPONENT_ARCHITECTURE, REPOSITORY_STANDARDS, API_ARCHITECTURE |
| **AI assistant (operations-facing)** | "AI Operations Assistant" (API_ARCHITECTURE), not named in other docs | **"Operations Assistant"** | API_ARCHITECTURE |
| **Operations portal** | "Operations Center" (README), "Operations Dashboard" (ARCHITECTURE, CI_CD), "Operations & Administration Layer" (ARCHITECTURE domain name) | **"Operations Center"** = product/portal name; **"Operations & Administration Layer"** = architecture domain name; do not use both for the same concept | README, ARCHITECTURE, CI_CD |
| **Executive portal** | "Executive Administration" (README), "Executive Dashboard" (ARCHITECTURE, CI_CD) | **"Executive Dashboard"** for the UI; **"Executive Administration"** for the functional domain | README, ARCHITECTURE |
| **KYC / Verification Center** | "KYC" still appears in COMPONENT_ARCHITECTURE component names ("KYCForm", "KYC/AML integration"); REPOSITORY_STANDARDS mandates "Verification Center" replaces generic "KYC" | **"Verification Center"** for the product feature; rename component `KYCForm` → `IdentityVerificationForm` (or `VerificationForm`) | COMPONENT_ARCHITECTURE, REPOSITORY_STANDARDS, CODING_STANDARDS |
| **WCAG version** | "WCAG 2.1 AA" (COMPONENT_ARCHITECTURE); "WCAG 2.2 AA" (CODING_STANDARDS) | **WCAG 2.2 AA** — CODING_STANDARDS is normative | COMPONENT_ARCHITECTURE, CODING_STANDARDS |
| **Trusted device limit** | "single trusted active device" (REPOSITORY_STANDARDS, CODING_STANDARDS); "maximum of two active trusted devices" (DATABASE_ARCHITECTURE) | **Must be resolved** — choose one value and standardize | REPOSITORY_STANDARDS, CODING_STANDARDS, DATABASE_ARCHITECTURE |
| **PostgreSQL version** | "PostgreSQL 15+" (ARCHITECTURE); "PostgreSQL 16+" (DATABASE_ARCHITECTURE) | **PostgreSQL 16+** — DATABASE_ARCHITECTURE is the authoritative source | ARCHITECTURE, DATABASE_ARCHITECTURE |
| **AI Command Center** | "AI Command Center (ACC)" (REPOSITORY_STANDARDS, CODING_STANDARDS); not referenced in ARCHITECTURE or COMPONENT_ARCHITECTURE | **"AI Command Center (ACC)"** — include this as a named component in ARCHITECTURE and add its full-screen workspace to COMPONENT_ARCHITECTURE | REPOSITORY_STANDARDS, CODING_STANDARDS, ARCHITECTURE, COMPONENT_ARCHITECTURE |

---

## 6. Missing Workflows

The following workflows are implied by the platform architecture but not fully documented in any existing document. These should be captured in `docs/USER_JOURNEYS.md` when it is created.

| Workflow | Why It Matters | Suggested Location in USER_JOURNEYS |
|---|---|---|
| **Password reset** | Security-critical; must involve MFA, rate limiting, device check; referenced nowhere | Member Journeys → Security Workflows |
| **Account closure** | Regulatory requirement; must handle balance settlement, data retention, audit trail | Member Journeys → Account Lifecycle |
| **Card replacement** | Implied by Card Service in ARCHITECTURE; lost/stolen/damaged card flows differ | Member Journeys → Card Management |
| **Trusted device removal** | Required by REPOSITORY_STANDARDS; removal of a trusted device must be audited and confirmed | Member Journeys → Security Workflows |
| **Trusted device addition (second device)** | Requires explicit approval per REPOSITORY_STANDARDS; exact flow undefined | Member Journeys → Security Workflows |
| **KYC/Verification re-submission** | Member may fail verification and need to re-submit; CODING_STANDARDS defines states but not the re-submission flow | Member Journeys → Verification Center |
| **Dispute and chargeback** | Referenced in ARCHITECTURE Operations Dashboard responsibilities; flow not documented | Operations Journeys → Dispute Management |
| **Wire transfer (domestic and international)** | API_ARCHITECTURE lists wire endpoints; no workflow documented | Member Journeys → Payments |
| **Investment order placement and settlement** | DATABASE_ARCHITECTURE defines investment schema; no workflow documented | Member Journeys → Investments |
| **Crypto trading** | DATABASE_ARCHITECTURE defines crypto schema with multi-step confirmations; no workflow | Member Journeys → Crypto |
| **Bill pay setup and recurring transfers** | Listed in ARCHITECTURE responsibilities; no workflow | Member Journeys → Payments |
| **Operator case assignment and escalation** | DATABASE_ARCHITECTURE defines support schema; CI_CD mentions operations; no workflow | Operations Journeys → Case Management |
| **Member offboarding (GDPR right to erasure)** | ARCHITECTURE references GDPR compliance; no workflow for data deletion requests | Member Journeys → Account Lifecycle |
| **AI-guided onboarding** | Onboarding exists in COMPONENT_ARCHITECTURE but no AI involvement is specified | Member Journeys → Onboarding |
| **Platform policy update via iCommand** | Referenced in problem statement context; no workflow in any document | iCommand Journeys → Governance |

---

## 7. Missing Permissions

The `docs/RBAC.md` document does not yet exist. The following roles and permission groups are implied across the existing documentation but have no formal permission matrix defined. These should be addressed when RBAC.md is created.

| Role / Group | Where Implied | Needed Permissions | Suggested Additions to RBAC |
|---|---|---|---|
| **Member (Personal)** | README, ARCHITECTURE, COMPONENT_ARCHITECTURE | Account read/write, transfers, cards, investment, crypto, chat, support, notifications, profile, verification | Define base member permission scope |
| **Member (Joint Account)** | DATABASE_ARCHITECTURE (Organizations schema) | Shared account read, limited write, no sole closure authority | Define joint-member permission overrides |
| **Member (Business Account)** | DATABASE_ARCHITECTURE (Organizations schema: org + org_memberships) | Business account management, multi-user access, business verification | Define organization-scoped permissions |
| **Operator** | README (Operations Center), ARCHITECTURE (Operations Dashboard) | Member account read, transaction monitoring, dispute management, compliance review, case assignment | Define operator permission scope |
| **Executive / Senior Admin** | README (Executive Administration), ARCHITECTURE (Executive Dashboard) | All reporting, KPI dashboards, system configuration, bulk operations, rate/fee management | Define executive permission scope |
| **Security Admin** | README (Security & Compliance Administration), ARCHITECTURE (Security Dashboard) | Audit log access, threat detection, compliance monitoring, security policy configuration | Define security admin permission scope |
| **AI Permission Descriptors** | REPOSITORY_STANDARDS (§ AI COMMAND CENTER), CODING_STANDARDS (§ Permission Gating) | Machine-readable permission descriptors for every AI action; required before AI implementation | Define AI action permission taxonomy |
| **NGO Portal Access** | Not in any existing doc; implied by problem statement | Portal login, restricted transaction types, NGO-specific reporting | Create NGO role and permissions |

---

## 8. Missing Navigation Paths

`docs/NAVIGATION_ARCHITECTURE.md` does not yet exist. The following features are described in existing documents but have no defined navigation path, canonical route, or UI location.

| Feature | Currently Described In | Navigation Gap | Where Navigation Path Should Be Added |
|---|---|---|---|
| **AI Command Center (full-screen workspace)** | REPOSITORY_STANDARDS (§ AI COMMAND CENTER), CODING_STANDARDS | Canonical route not defined; REPOSITORY_STANDARDS says it is a dedicated full-screen route | NAVIGATION_ARCHITECTURE → Member Portal AI, Operations Center AI, iCommand AI |
| **Draggable AI Launcher** | REPOSITORY_STANDARDS | No navigation specification for the floating UI element's position, z-index, or accessible trigger | NAVIGATION_ARCHITECTURE → AI Navigation |
| **Verification Center** | REPOSITORY_STANDARDS, CODING_STANDARDS, DATABASE_ARCHITECTURE | Navigation home not defined; REPOSITORY_STANDARDS says it must NOT be in the "More" menu | NAVIGATION_ARCHITECTURE → Member Portal |
| **Trusted Device Management** | REPOSITORY_STANDARDS, CODING_STANDARDS, DATABASE_ARCHITECTURE | No navigation path; implied to live under Security/Profile | NAVIGATION_ARCHITECTURE → Member Portal → Security |
| **Operations Center portal** | README, ARCHITECTURE | No navigation map exists for the internal portal | NAVIGATION_ARCHITECTURE → Operations Center |
| **Executive Dashboard** | README, ARCHITECTURE | No navigation map exists | NAVIGATION_ARCHITECTURE → Executive Dashboard |
| **Security Dashboard** | README, ARCHITECTURE | No navigation map exists | NAVIGATION_ARCHITECTURE → Security Dashboard |
| **HeroBox** | Not in any existing doc; implied by problem statement | Entire portal undefined | NAVIGATION_ARCHITECTURE → HeroBox |
| **NGO Portal** | Not in any existing doc; implied by problem statement | Entire portal undefined | NAVIGATION_ARCHITECTURE → NGO Portal |
| **Member Advisor (Support)** | REPOSITORY_STANDARDS, ARCHITECTURE, DATABASE_ARCHITECTURE | Navigation entry point from Member Portal not defined | NAVIGATION_ARCHITECTURE → Member Portal → Support |
| **Deep Link registry** | API_ARCHITECTURE (§ Deep Links) | Format defined but no canonical registry of all deep-linkable resources | NAVIGATION_ARCHITECTURE → Deep Links |

---

## 9. Missing AI Integrations

The following workflows are described in existing documents but do not specify AI involvement. Based on platform architecture, AI assistance would add measurable value at these points.

| Workflow | Why AI Would Help | Suggested AI Integration Point |
|---|---|---|
| **Member onboarding** | AI can guide the member through steps, predict drop-off, pre-fill data from verified sources, and surface errors proactively | COMPONENT_ARCHITECTURE § Onboarding: add `OnboardingAIGuide` component; USER_JOURNEYS: add AI coaching step |
| **Identity verification review** | AI OCR and document classification can pre-screen submissions before operator review, reducing operator workload | API_ARCHITECTURE (verification.yaml): add AI pre-screening step; USER_JOURNEYS: add AI review stage |
| **Transaction classification** | ARCHITECTURE describes this as a service but no UI workflow exists for how members see and correct AI-generated categories | COMPONENT_ARCHITECTURE: add `TransactionInsightCard`; USER_JOURNEYS: add AI categorization review flow |
| **Fraud alert and member response** | Members should be notified by AI-generated alerts and guided through dispute workflow | USER_JOURNEYS: add AI fraud alert workflow; COMPONENT_ARCHITECTURE: add `FraudAlertCard` |
| **Operator case queue prioritization** | AI can rank cases by risk, urgency, and complexity to reduce operator decision fatigue | USER_JOURNEYS (Operations): add AI prioritization; Operations Center navigation should surface AI queue scoring |
| **Support triage (before operator)** | REPOSITORY_STANDARDS defines Member Advisor as the canonical support hub with AI first; no triage workflow exists | USER_JOURNEYS → Support: formalize AI → Operator escalation logic |
| **iCommand platform alerts** | Platform Intelligence should surface anomalies, threshold breaches, and compliance events | NAVIGATION_ARCHITECTURE → iCommand: add Platform Intelligence alert routing |

---

## 10. Missing Rules Engine Integrations

The "Rules Engine" is referenced in the platform vision but is not defined in any existing document. No schema, API, or behavioral specification exists for it. The following workflows should integrate with a Rules Engine once it is defined.

| Workflow | Automation Opportunity | Suggested Rules Engine Integration |
|---|---|---|
| **Verification routing** | Route submitted documents to AI review vs. operator review based on document type, quality score, and member risk profile | Define verification routing rules in RBAC.md or a new RULES_ENGINE.md; add to DATABASE_ARCHITECTURE schema |
| **Payment risk assessment** | Automatically flag transfers above threshold, to new payees, or outside normal patterns | API_ARCHITECTURE (transactions.yaml): add risk_score field; Rules Engine evaluates on submission |
| **Session management (inactivity)** | DATABASE_ARCHITECTURE defines 2-minute UI lock and 5–10 minute session termination; this should be rule-driven per risk profile | DATABASE_ARCHITECTURE § Session security model: formalize as configurable rules |
| **Case assignment** | Assign operator cases based on workload, expertise, and case type | Operations workflow: define case assignment rule schema |
| **Notification routing** | Route notifications to correct channel (push, SMS, email, WhatsApp) based on member preferences and event type | DATABASE_ARCHITECTURE § Notifications: formalize as channel selection rules |
| **AI recommendation gating** | AI actions must be gated by permission descriptors (REPOSITORY_STANDARDS); the enforcement mechanism is undefined | RBAC.md (when created): define rule evaluation pattern for AI action permissions |
| **Trusted device approval flow** | Adding a second trusted device triggers an approval flow; the decision logic is undefined | AUTHENTICATION.md (when created): define trusted device rules; reference Rules Engine |
| **KYC/Verification escalation** | Escalate verification to manual review when AI confidence is below threshold | API_ARCHITECTURE (verification.yaml): add escalation_trigger field; Rules Engine evaluates confidence score |

---

## 11. Accessibility Gaps

The following features or workflows lack explicit WCAG 2.2 AA compliance documentation beyond what appears in COMPONENT_ARCHITECTURE.md and CODING_STANDARDS.md.

| Feature / Workflow | Compliance Requirement | Suggested Documentation |
|---|---|---|
| **WCAG version — COMPONENT_ARCHITECTURE** | COMPONENT_ARCHITECTURE § Design Principles states WCAG 2.1 AA; CODING_STANDARDS mandates WCAG 2.2 AA — these conflict | Update COMPONENT_ARCHITECTURE to reference WCAG 2.2 AA. New success criteria in 2.2 include Focus Appearance (2.4.11), Dragging Movements (2.5.7), Target Size Minimum (2.5.8), and others that affect the draggable AI launcher and bottom navigation |
| **Draggable AI Launcher** | WCAG 2.2 SC 2.5.7 (Dragging Movements): all drag-based functionality must have a single-pointer alternative | REPOSITORY_STANDARDS § AI COMMAND CENTER: add WCAG 2.5.7 note; DESIGN_SYSTEM.md: document keyboard and single-tap alternative |
| **Bottom Navigation** | WCAG 2.2 SC 2.5.8 (Target Size Minimum): interactive targets must be at least 24×24 CSS pixels. COMPONENT_ARCHITECTURE specifies 48px which satisfies this, but the spec should explicitly cite 2.5.8 | COMPONENT_ARCHITECTURE § Bottom Navigation: add explicit WCAG 2.5.8 citation |
| **Focus Appearance** | WCAG 2.2 SC 2.4.11 (Focus Appearance): focus indicators must meet minimum size and contrast; COMPONENT_ARCHITECTURE mentions "focus visible with high contrast outline" but does not specify dimensions | COMPONENT_ARCHITECTURE § Keyboard Navigation: add specific focus indicator size (at least 2px, perimeter ≥ component perimeter) |
| **Reduced Motion** | No document specifies behavior when `prefers-reduced-motion` is enabled; animations in components (transitions, spinners, progress bars) must respect this preference | COMPONENT_ARCHITECTURE § Accessibility Standards: add reduced motion section; DESIGN_SYSTEM.md: add animation token with reduced-motion fallbacks |
| **Chat / Messaging Accessibility** | Chat components (ChatContainer, ChatMessage, ChatInput) lack explicit accessibility requirements for screen readers, live region announcements for new messages, and keyboard-navigable message history | COMPONENT_ARCHITECTURE § Chat Components: add ARIA live region requirements; add keyboard navigation specification for message list |
| **AI Workspace Accessibility** | AI Command Center is described as full-screen with a draggable launcher; no accessibility specification for modal focus trapping, screen reader context, or keyboard control of the workspace | REPOSITORY_STANDARDS § AI COMMAND CENTER: add accessibility requirements; DESIGN_SYSTEM.md: document focus trap pattern for AI workspace |

---

## 12. Responsive Design Gaps

The following features or workflows lack explicit device-specific behavior specifications.

| Feature / Workflow | Device Considerations | Suggested Specifications |
|---|---|---|
| **Foldable device support** | COMPONENT_ARCHITECTURE breakpoints do not include a foldable device breakpoint (~280px–320px inner fold, ~720px unfolded). Foldable devices represent a growing segment | Add foldable breakpoints to COMPONENT_ARCHITECTURE responsive system; specify single-column layout for folded state and adaptive layout for unfolded state |
| **AI Command Center (full-screen)** | Full-screen AI workspace behavior on mobile (should it be full-screen modal or a new route?), tablet (side panel or modal?), and desktop (resizable panel or fixed width?) is undefined | NAVIGATION_ARCHITECTURE (when created): define AI workspace layout per device; DESIGN_SYSTEM.md: add AI workspace responsive specification |
| **Bottom Navigation on tablet** | COMPONENT_ARCHITECTURE specifies Bottom Navigation (5 tabs) for the member app but does not specify whether tablets use bottom navigation or a sidebar | COMPONENT_ARCHITECTURE § Navigation Components: add tablet-specific navigation pattern |
| **Data tables (Operations Center)** | Operations Center dashboards rely on data tables; no specification exists for table behavior on mobile (horizontal scroll? card view? collapse?) | COMPONENT_ARCHITECTURE § Tables: add responsive table behavior specification (card layout on mobile, full table on tablet+) |
| **Forms on mobile** | TransferForm and OnboardingWizard use multi-step forms; no specification for full-screen step behavior, back navigation gesture, or virtual keyboard overlap | COMPONENT_ARCHITECTURE § Transfer Components and Onboarding Components: add mobile form specifications |
| **Chat on mobile vs desktop** | Chat is a central feature; no specification for full-screen chat on mobile, split-view on tablet, or side-panel on desktop | COMPONENT_ARCHITECTURE § Chat Components: add responsive layout specification |

---

## 13. Prioritized Recommendations

### Critical (Must Resolve Before Implementation)

| # | Recommendation | Documents Affected | Reason |
|---|---|---|---|
| C-1 | **Create `docs/SECURITY_STANDARDS.md`** — PII retention, encryption, media redaction, SOPS/Vault rules | DATABASE_ARCHITECTURE (×3 references), API_ARCHITECTURE (×2), CODING_STANDARDS, REPOSITORY_STANDARDS | 6 documents reference this as required; PAN tokenization, media PII redaction, and retention windows cannot be specified without it |
| C-2 | **Create `docs/AUTHENTICATION.md`** — JWT, OAuth2 PKCE, MFA, biometric, trusted device approval flow | README, ARCHITECTURE, API_ARCHITECTURE, DATABASE_ARCHITECTURE | Auth patterns are scattered across 4 documents; no canonical auth document exists; trusted device flow is undefined |
| C-3 | **Create `docs/RBAC.md`** — role definitions, permission matrix, AI action permission descriptors, joint/business/NGO roles | README, CODING_STANDARDS, API_ARCHITECTURE, REPOSITORY_STANDARDS | Permission gating is required for every UI action and API endpoint; without RBAC.md, development cannot proceed safely |
| C-4 | **Resolve trusted device limit contradiction** — REPOSITORY_STANDARDS / CODING_STANDARDS say 1 device; DATABASE_ARCHITECTURE says max 2 | REPOSITORY_STANDARDS, CODING_STANDARDS, DATABASE_ARCHITECTURE | A direct factual contradiction in normative documents; whichever value is correct, all three documents must agree before implementation |
| C-5 | **Create `docs/NAVIGATION_ARCHITECTURE.md`** — single source of truth for all pages, menus, routes, deep links | All documents | Without navigation architecture, Base44 import cannot be mapped to routes; AI deep links cannot be built; permissions cannot be applied to navigation |
| C-6 | **Create `docs/VERIFICATION_CENTER.md`** — vendor integration, verification states, re-submission flow, operator handoff | CODING_STANDARDS, API_ARCHITECTURE, DATABASE_ARCHITECTURE, REPOSITORY_STANDARDS | 5 documents reference this document; Verification Center is a core feature that replaces KYC |

### High (Should Resolve Before or During Base44 Import)

| # | Recommendation | Documents Affected | Reason |
|---|---|---|---|
| H-1 | **Update COMPONENT_ARCHITECTURE — WCAG 2.1 AA → WCAG 2.2 AA** | COMPONENT_ARCHITECTURE | Directly conflicts with normative CODING_STANDARDS; misaligned accessibility targets can cause compliance failures |
| H-2 | **Rename `KYCForm` → `IdentityVerificationForm` in COMPONENT_ARCHITECTURE** | COMPONENT_ARCHITECTURE | REPOSITORY_STANDARDS mandates Verification Center replaces KYC; component names must reflect this |
| H-3 | **Create `docs/USER_JOURNEYS.md`** — all workflows from member onboarding to operations to iCommand | All documents | Platform workflows are implied but never fully described; Rules Engine, AI, and audit requirements depend on workflow specifications |
| H-4 | **Create `docs/MIGRATION_GUIDE.md`** — Base44 import steps, table mapping, CI enablement | REPOSITORY_STANDARDS (×2), CI_CD, API_ARCHITECTURE, DATABASE_ARCHITECTURE | Referenced 5 times; Base44 migration cannot be executed without it |
| H-5 | **Create `docs/TESTING.md`** — testing matrix, unit/integration/E2E/contract/accessibility test requirements | CI_CD (references this document) | CI_CD pipeline references TESTING.md; without it, CI cannot enforce correct testing scope |
| H-6 | **Add AI Command Center component to COMPONENT_ARCHITECTURE** | COMPONENT_ARCHITECTURE, REPOSITORY_STANDARDS | ACC is a normative platform requirement (REPOSITORY_STANDARDS) but has no component specification in COMPONENT_ARCHITECTURE |
| H-7 | **Add cross-references to ARCHITECTURE.md** — link to COMPONENT_ARCHITECTURE, API_ARCHITECTURE, DATABASE_ARCHITECTURE, CODING_STANDARDS, CI_CD | ARCHITECTURE | ARCHITECTURE is the entry point for new contributors but links to none of the technical specification documents that now exist |
| H-8 | **Define Rules Engine** — create `docs/RULES_ENGINE.md` or add a Rules Engine section to ARCHITECTURE | ARCHITECTURE, and future USER_JOURNEYS, NAVIGATION_ARCHITECTURE | Verification routing, payment risk, session management, notifications, and AI gating all reference a Rules Engine that is not yet defined anywhere |

### Medium (Resolve During Documentation Phase)

| # | Recommendation | Documents Affected | Reason |
|---|---|---|---|
| M-1 | **Create `docs/DESIGN_SYSTEM.md`** — design tokens, color palette, typography, spacing, icon system | README, COMPONENT_ARCHITECTURE | Referenced in README; COMPONENT_ARCHITECTURE defines tokens but they belong in DESIGN_SYSTEM |
| M-2 | **Update ARCHITECTURE — PostgreSQL 15+ → PostgreSQL 16+** | ARCHITECTURE | DATABASE_ARCHITECTURE is authoritative; ARCHITECTURE has an outdated version |
| M-3 | **Standardize operations portal name** — "Operations Center" everywhere | README, ARCHITECTURE, CI_CD | Reduces confusion for new contributors reading multiple docs |
| M-4 | **Add missing cross-references** — update REPOSITORY_STANDARDS, CODING_STANDARDS, CI_CD, API_ARCHITECTURE, DATABASE_ARCHITECTURE to reference each other | All listed | Reduces navigation friction; ensures contributors can traverse the documentation graph without dead ends |
| M-5 | **Add foldable device breakpoints to COMPONENT_ARCHITECTURE** | COMPONENT_ARCHITECTURE | Growing device segment; inner-fold (~280px) and outer-fold (~720px) should be defined before design implementation |
| M-6 | **Specify responsive behavior for bottom navigation on tablet** | COMPONENT_ARCHITECTURE | Current specification is ambiguous for tablet-width devices |
| M-7 | **Add reduced motion support to COMPONENT_ARCHITECTURE** | COMPONENT_ARCHITECTURE | WCAG 2.2 requirement; not currently specified |
| M-8 | **Add ARIA live regions specification for chat** | COMPONENT_ARCHITECTURE | Screen reader users need live region announcements for incoming messages |
| M-9 | **Create `docs/DOCUMENTATION_STANDARDS.md`** — document structure, naming, change management, versioning | README | Referenced in README; needed before further documentation work |

### Low (Polish and Governance)

| # | Recommendation | Documents Affected | Reason |
|---|---|---|---|
| L-1 | **Define HeroBox and NGO Portal** — add to ARCHITECTURE and README | README, ARCHITECTURE | These portals are part of the platform vision but have no architectural specification |
| L-2 | **Add VANTORIS iCommand to architecture documents** — replace "Executive Administration" or clarify relationship | README, ARCHITECTURE | Problem statement identifies iCommand as the executive/governance portal; existing docs call it "Executive Administration" or "Executive Dashboard" — clarify if these are the same product |
| L-3 | **Add a Change History section to all documents** | All 9 existing documents | Supports auditability and traceability per future DOCUMENTATION_STANDARDS requirements |
| L-4 | **Document AI Workspace responsive layout** | COMPONENT_ARCHITECTURE, future NAVIGATION_ARCHITECTURE | Full-screen AI workspace behavior on mobile vs tablet vs desktop is undefined |
| L-5 | **Specify focus indicator dimensions in COMPONENT_ARCHITECTURE** | COMPONENT_ARCHITECTURE | WCAG 2.2 SC 2.4.11 requires minimum focus indicator dimensions; current spec only says "high contrast outline" |
| L-6 | **Add responsive behavior for Operations Center data tables** | COMPONENT_ARCHITECTURE | DataTable has no mobile specification; operations staff may access dashboards on tablets |

---

## Appendix: Document Reference Map

The following matrix shows which existing documents reference which other documents. An empty cell means no reference exists; ✅ = reference present; ⚠️ = reference present but "(to be created)" annotation; ❌ = should reference but does not.

| Document \ References → | README | ARCH | COMP_ARCH | REPO_STR | REPO_STD | CODING | CI_CD | API_ARCH | DB_ARCH |
|---|---|---|---|---|---|---|---|---|---|
| **README** | — | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| **ARCHITECTURE** | — | — | ❌ | — | ❌ | ❌ | ❌ | ❌ | ❌ |
| **COMPONENT_ARCHITECTURE** | — | — | — | — | ❌ | ❌ | — | — | — |
| **REPOSITORY_STRUCTURE** | — | — | — | — | — | — | — | — | — |
| **REPOSITORY_STANDARDS** | — | ✅ | ✅ | ✅ | — | — | ✅ | ⚠️ | ❌ |
| **CODING_STANDARDS** | — | ✅ | ✅ | ✅ | ✅ | — | ✅ | ❌ | ❌ |
| **CI_CD** | — | — | — | ✅ | — | — | — | ❌ | ❌ |
| **API_ARCHITECTURE** | — | — | — | — | ✅ | ✅ | ✅ | — | ❌ |
| **DATABASE_ARCHITECTURE** | — | — | — | — | ✅ | ✅ | ✅ | ✅ | — |

---

*This report is recommendations only. No existing documents have been modified. All findings require explicit review and approval before any documentation updates are made.*
