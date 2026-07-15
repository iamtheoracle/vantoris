# VANTORIS Architecture Audit & Consistency Review

**Report Type:** Comprehensive Consistency Review and Architecture Audit  
**Scope:** All committed documentation in `iamtheoracle/vantoris`  
**Status:** Recommendations only — no existing documents modified  
**Branch:** `copilot/review-documentation-for-consistency`

---

## Documents Reviewed

| # | Document | Status | Notes |
|---|----------|--------|-------|
| 1 | `README.md` | ✅ Exists | Root-level overview |
| 2 | `docs/ARCHITECTURE.md` | ✅ Exists | System architecture |
| 3 | `docs/COMPONENT_ARCHITECTURE.md` | ✅ Exists | UI component system |
| 4 | `docs/API_ARCHITECTURE.md` | ✅ Exists | API contract standards |
| 5 | `docs/CI_CD.md` | ✅ Exists | Pipeline specification |
| 6 | `docs/CODING_STANDARDS.md` | ✅ Exists | Engineering standards |
| 7 | `docs/DATABASE_ARCHITECTURE.md` | ✅ Exists | Database design |
| 8 | `docs/REPOSITORY_STANDARDS.md` | ✅ Exists | Repository rules |
| 9 | `docs/REPOSITORY_STRUCTURE.md` | ✅ Exists | Folder layout |
| 10 | `docs/SECURITY_STANDARDS.md` | ❌ Missing | Referenced 9+ times |
| 11 | `docs/AUTHENTICATION.md` | ❌ Missing | Referenced in README |
| 12 | `docs/RBAC.md` | ❌ Missing | Referenced 4+ times |
| 13 | `docs/MIGRATION_GUIDE.md` | ❌ Missing | Referenced 6+ times |
| 14 | `docs/TESTING.md` | ❌ Missing | Referenced in CI_CD |
| 15 | `docs/DESIGN_SYSTEM.md` | ❌ Missing | Referenced in README |
| 16 | `docs/NAVIGATION_ARCHITECTURE.md` | ❌ Missing | No existing reference |
| 17 | `docs/USER_JOURNEYS.md` | ❌ Missing | No existing reference |
| 18 | `docs/DOCUMENTATION_STANDARDS.md` | ❌ Missing | Referenced in README |
| 19 | `docs/VERIFICATION_CENTER.md` | ❌ Missing | Referenced 5+ times |
| 20 | `docs/api/*.yaml` | ❌ Missing | 22 skeleton files required |

---

## 1. Summary of Consistency Review Findings

The repository currently contains 9 of 18+ planned documentation files. The existing documents establish strong foundations for system architecture, component design, API contracts, CI/CD pipelines, coding standards, and database design. However, a cross-cutting review reveals significant issues across three categories:

**Critical Gaps (blocking future implementation):**
- 9 core documents are missing, including `SECURITY_STANDARDS.md`, `RBAC.md`, `AUTHENTICATION.md`, `TESTING.md`, and `MIGRATION_GUIDE.md` — all actively referenced by existing documents.
- `docs/VERIFICATION_CENTER.md` is referenced in 5 documents but does not exist.
- 22 OpenAPI skeleton files in `docs/api/` are specified in `API_ARCHITECTURE.md` but none are present.

**Terminology Conflicts (requiring standardization):**
- Platform workspace names are inconsistent across documents (e.g., "Member Center" vs "Member Portal"; "Executive Administration" vs "VANTORIS iCommand"; "Operations Dashboard" vs "Operations Center").
- WCAG version is inconsistent: `COMPONENT_ARCHITECTURE.md` references WCAG 2.1 AA; `CODING_STANDARDS.md` references WCAG 2.2 AA.
- PostgreSQL version is inconsistent: `ARCHITECTURE.md` says 15+; `DATABASE_ARCHITECTURE.md` says 16+.
- "Automation Engine" in `ARCHITECTURE.md` vs "Rules Engine" in the broader platform vocabulary.
- "AI Command Center" (ACC) appears in 5 documents but is absent from the high-level architecture diagram.

**Structural Conflicts (requiring resolution):**
- Trusted device policy directly conflicts: `REPOSITORY_STANDARDS.md` mandates "single trusted active device per account" while `DATABASE_ARCHITECTURE.md` specifies "maximum of two active trusted devices."
- `ARCHITECTURE.md` still uses "KYC" throughout despite `REPOSITORY_STANDARDS.md` mandating Verification Center replaces KYC.
- Workspaces introduced in later platform conversations (HeroBox, NGO Portal, Public Website, VANTORIS iCommand) are absent from all 9 committed documents.

---

## 2. Duplicate Concepts

| # | Concept | Documents | Finding |
|---|---------|-----------|---------|
| 1 | AI Command Center (ACC) | `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `CI_CD.md`, `API_ARCHITECTURE.md` | Defined and described in 4 documents independently; no canonical single-home definition exists |
| 2 | Member Advisor | `ARCHITECTURE.md`, `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `CI_CD.md`, `DATABASE_ARCHITECTURE.md` | Described differently in each: as an AI component (ARCHITECTURE.md), as a support hub (REPOSITORY_STANDARDS.md), as a chat aggregator (CODING_STANDARDS.md) |
| 3 | Verification Center | `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `API_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md` | Consistently named but described in 4 documents without a canonical VERIFICATION_CENTER.md |
| 4 | Trusted Devices | `ARCHITECTURE.md`, `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `DATABASE_ARCHITECTURE.md` | Conflicting device limits (1 vs 2) across documents |
| 5 | Unified Chat | `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `CI_CD.md`, `API_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md` | Consistent concept but described in 5 documents; no canonical CHAT_ARCHITECTURE.md |
| 6 | Permission descriptors / RBAC | `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `API_ARCHITECTURE.md` | RBAC rules repeated in 3 documents; RBAC.md missing |
| 7 | Evidence requirements | `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `CI_CD.md` | Evidence fields listed in full in all 3 documents with minor wording differences |
| 8 | Design principles (UX/UI) | `ARCHITECTURE.md`, `COMPONENT_ARCHITECTURE.md`, `REPOSITORY_STANDARDS.md` | UX principles stated independently in each; no DESIGN_SYSTEM.md exists |
| 9 | Personalization (PreferredName) | `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `DATABASE_ARCHITECTURE.md`, `API_ARCHITECTURE.md` | Profile model requirements duplicated across 4 documents |
| 10 | Session security model | `DATABASE_ARCHITECTURE.md` (section), `ARCHITECTURE.md` (Security layer) | Session rules split across two documents |

---

## 3. Missing Cross-References

| # | Document | Missing Reference | Location | Reason |
|---|----------|------------------|----------|--------|
| 1 | `ARCHITECTURE.md` | `docs/COMPONENT_ARCHITECTURE.md` | — | Architecture document does not link to component architecture |
| 2 | `ARCHITECTURE.md` | `docs/API_ARCHITECTURE.md` | — | No cross-reference to API contracts |
| 3 | `ARCHITECTURE.md` | `docs/DATABASE_ARCHITECTURE.md` | — | No cross-reference to database design |
| 4 | `ARCHITECTURE.md` | `docs/CI_CD.md` | — | No cross-reference to pipeline |
| 5 | `ARCHITECTURE.md` | `docs/CODING_STANDARDS.md` | — | No cross-reference to engineering standards |
| 6 | `COMPONENT_ARCHITECTURE.md` | `docs/API_ARCHITECTURE.md` | — | Component patterns not linked to API contracts |
| 7 | `COMPONENT_ARCHITECTURE.md` | `docs/DATABASE_ARCHITECTURE.md` | — | No link to data model |
| 8 | `COMPONENT_ARCHITECTURE.md` | `docs/REPOSITORY_STANDARDS.md` | — | Design principles diverge without shared reference |
| 9 | `CI_CD.md` | `docs/TESTING.md` | Cross-references section | Referenced as "to be created" but TESTING.md still missing |
| 10 | `DATABASE_ARCHITECTURE.md` | `docs/SECURITY_STANDARDS.md` | Multiple sections | PCI, PII, retention rules reference missing doc |
| 11 | `DATABASE_ARCHITECTURE.md` | `docs/MIGRATION_GUIDE.md` | "Schema migration" section | Migration steps reference missing doc |
| 12 | `DATABASE_ARCHITECTURE.md` | `docs/VERIFICATION_CENTER.md` | Section 10 | Verification domain references missing doc |
| 13 | `API_ARCHITECTURE.md` | `docs/SECURITY_STANDARDS.md` | "Security & Compliance notes" | PII and retention rules reference missing doc |
| 14 | `API_ARCHITECTURE.md` | `docs/VERIFICATION_CENTER.md` | "Verification Center APIs" | Detailed vendor integration references missing doc |
| 15 | `CODING_STANDARDS.md` | `docs/RBAC.md` | "Permission Gating" section | "see docs/RBAC.md" — doc missing |
| 16 | `CODING_STANDARDS.md` | `docs/VERIFICATION_CENTER.md` | "Verification Center" section | Workflow details reference missing doc |
| 17 | `CODING_STANDARDS.md` | `docs/SECURITY_STANDARDS.md` | "Chat" section, "Trusted Devices" | Retention/PII rules reference missing doc |
| 18 | `README.md` | `docs/DESIGN_SYSTEM.md` | Documentation table | Link points to missing doc |
| 19 | `README.md` | `docs/AUTHENTICATION.md` | Documentation table | Link points to missing doc |
| 20 | `README.md` | `docs/RBAC.md` | Documentation table | Link points to missing doc |
| 21 | `README.md` | `docs/TESTING.md` | Documentation table | Link points to missing doc |
| 22 | `README.md` | `docs/MIGRATION_GUIDE.md` | Documentation table | Link points to missing doc |
| 23 | `README.md` | `docs/SECURITY_STANDARDS.md` | Development Standards section | Link points to missing doc |
| 24 | `README.md` | `docs/DOCUMENTATION_STANDARDS.md` | Development Standards section | Link points to missing doc |
| 25 | All docs | `docs/NAVIGATION_ARCHITECTURE.md` | — | Navigation architecture referenced nowhere; doc missing |
| 26 | All docs | `docs/USER_JOURNEYS.md` | — | User journeys not referenced anywhere; doc missing |

---

## 4. Inconsistent Terminology

| # | Term A | Term B | Appears In | Recommendation |
|---|--------|--------|-----------|----------------|
| 1 | "Member Center" | "Member Portal" | README.md uses "Member Center"; problem statement and product context uses "Member Portal" | Standardize to **Member Portal** |
| 2 | "Executive Administration" | "VANTORIS iCommand" | README.md uses "Executive Administration"; product context uses "VANTORIS iCommand" | Standardize to **VANTORIS iCommand** |
| 3 | "Operations Dashboard" | "Operations Center" | ARCHITECTURE.md uses "Operations Dashboard"; product context uses "Operations Center" | Standardize to **Operations Center** |
| 4 | "Security Dashboard" | (merged into Operations Center or iCommand) | ARCHITECTURE.md lists as separate; product context does not have separate Security Dashboard workspace | Clarify which workspace owns security monitoring |
| 5 | "KYC" | "Verification Center" | ARCHITECTURE.md uses "KYC" in 8+ places; REPOSITORY_STANDARDS.md mandates Verification Center replaces KYC | Replace **KYC** with **Verification Center** in ARCHITECTURE.md |
| 6 | "Automation Engine" | "Rules Engine" | ARCHITECTURE.md AI layer; broader platform vocabulary | Standardize to **Rules Engine** |
| 7 | "Member Advisor" (AI component) | "Member Advisor" (support hub) | ARCHITECTURE.md section 4 vs REPOSITORY_STANDARDS.md | Clarify: Member Advisor = AI-powered support hub; "Financial Assistant" = member-facing AI persona name |
| 8 | WCAG 2.1 AA | WCAG 2.2 AA | COMPONENT_ARCHITECTURE.md vs CODING_STANDARDS.md | Standardize to **WCAG 2.2 AA** (more current) |
| 9 | PostgreSQL 15+ | PostgreSQL 16+ | ARCHITECTURE.md vs DATABASE_ARCHITECTURE.md | Standardize to **PostgreSQL 16+** (DATABASE_ARCHITECTURE.md is more recent and authoritative) |
| 10 | Node.js 18+ | Node.js LTS | ARCHITECTURE.md backend section vs REPOSITORY_STANDARDS.md, CODING_STANDARDS.md | Standardize to **Node.js LTS** (version-agnostic, always current) |
| 11 | "Redux Toolkit or Zustand" | "Redux Toolkit" + "React Context" | ARCHITECTURE.md technology decisions vs architecture section | Align to one definitive state management choice |
| 12 | "AI Command Center" | "ACC" | All documents use both without formal introduction of the abbreviation | Introduce full name first use, then abbreviation consistently |
| 13 | "Keycloak, Auth0, or custom JWT" | "OAuth2 Authorization Code with PKCE" | ARCHITECTURE.md vs API_ARCHITECTURE.md | API_ARCHITECTURE.md is more specific and normative; ARCHITECTURE.md should align |
| 14 | Single trusted device | Two trusted devices | REPOSITORY_STANDARDS.md vs DATABASE_ARCHITECTURE.md | **Resolve directly**: choose one limit and update both documents |
| 15 | "Admin Console" | "Operations Center" | ARCHITECTURE.md uses "Admin Console" as a component | Clarify that Admin Console is within Operations Center; standardize naming |
| 16 | "Financial Assistant" | "Member Advisor" | Problem statement AI navigation vs COMPONENT_ARCHITECTURE.md AIAssistant component | Define: "Member Advisor" = the feature; "Financial Assistant" = the AI persona displayed to members |

---

## 5. Missing Workflows

| # | Workflow | Where Needed | Reason |
|---|----------|-------------|--------|
| 1 | Member Onboarding (end-to-end) | USER_JOURNEYS.md (missing) | No document traces Application → Identity Verification → Approval → Dashboard |
| 2 | Payment Authorization | USER_JOURNEYS.md (missing) | Transfer flow with Rules Engine, risk checks, approval not documented |
| 3 | Verification Center routing | USER_JOURNEYS.md (missing) | How documents flow through AI review and then operator review not defined |
| 4 | Trusted Device approval | AUTHENTICATION.md (missing), DATABASE_ARCHITECTURE.md | Device replacement/addition approval workflow not fully defined |
| 5 | Session lifecycle | AUTHENTICATION.md (missing) | Inactivity lock → termination → re-authentication steps not formalized |
| 6 | Operator case assignment | USER_JOURNEYS.md (missing) | Work queue → assignment → decision → audit → notification chain missing |
| 7 | AI recommendation execution | USER_JOURNEYS.md (missing) | Context → permissions → recommendations → execution → audit chain missing |
| 8 | Card issuance and lifecycle | USER_JOURNEYS.md (missing) | Issuance → activation → suspend → revoke workflow not documented |
| 9 | Rules Engine trigger points | (no document) | When the Rules Engine fires, what it evaluates, and what it changes is undefined |
| 10 | VANTORIS iCommand policy update flow | USER_JOURNEYS.md (missing) | Alert → Review → Decision → Policy Update → Rules Engine → Platform Updated not documented |
| 11 | HeroBox workflow | (no document) | HeroBox as a product is entirely absent from all existing documents |
| 12 | NGO Portal workflow | (no document) | NGO Portal is entirely absent from all existing documents |
| 13 | Multi-factor authentication flow | AUTHENTICATION.md (missing) | MFA challenge, trusted device check, fallback paths not formalized |
| 14 | Account closure workflow | USER_JOURNEYS.md (missing) | Account status transitions through closure not documented |
| 15 | Dispute / chargeback workflow | USER_JOURNEYS.md (missing) | ARCHITECTURE.md mentions dispute handling; no workflow defined |
| 16 | Support escalation (AI → Operator) | USER_JOURNEYS.md (missing) | Escalation path from AI Assistant to live operator to resolution not defined |
| 17 | Notification delivery pipeline | (no document) | Notification queue → delivery channels → fallback logic not formalized |
| 18 | Report generation workflow | (no document) | Report definitions → scheduled runs → S3 storage → access control not formalized |

---

## 6. Missing Permissions

| # | Permission Area | Where Needed | Finding |
|---|----------------|-------------|---------|
| 1 | Role hierarchy definition | `docs/RBAC.md` (missing) | No document defines role names, hierarchy, or inheritance |
| 2 | Member Portal permissions | `docs/RBAC.md` (missing) | What members can and cannot do is not formally listed |
| 3 | Operations Center permissions | `docs/RBAC.md` (missing) | Operator roles and permission boundaries undefined |
| 4 | VANTORIS iCommand permissions | `docs/RBAC.md` (missing) | Executive/platform owner capabilities undefined |
| 5 | AI action permission descriptors | `libs/ai/permissions/*.yaml` (missing) | CODING_STANDARDS.md mandates these files but none exist or are specified |
| 6 | HeroBox permissions | (no document) | HeroBox is unmentioned; its role in RBAC is undefined |
| 7 | NGO Portal permissions | (no document) | NGO Portal is unmentioned; its role in RBAC is undefined |
| 8 | Public Website anonymous vs authenticated | (no document) | Navigation and access differences for visitors vs returning members not defined |
| 9 | Cross-workspace permissions | `docs/RBAC.md` (missing) | No document defines if operators can be promoted to iCommand, etc. |
| 10 | Verification Center submission permissions | `docs/RBAC.md` (missing) | Who can submit, review, approve, or reject verification requests |
| 11 | Bulk operations permissions | (no document) | ARCHITECTURE.md mentions bulk operations; no permission defined |
| 12 | Audit log access permissions | `docs/RBAC.md` (missing) | Who can read audit logs vs write is undefined |
| 13 | Report generation permissions | `docs/RBAC.md` (missing) | Who can define, run, and export reports |
| 14 | Configuration change permissions | `docs/RBAC.md` (missing) | Who can change platform configuration |
| 15 | AI governance permissions | (no document) | No document defines who governs AI behavior, prompt templates, or workflows |

---

## 7. Missing Navigation Paths

| # | Navigation Path | Workspace | Finding |
|---|----------------|-----------|---------|
| 1 | All Public Website top-level pages | Public Website | No document defines Public Website navigation structure |
| 2 | Member Portal primary navigation items | Member Portal | Only inferred from COMPONENT_ARCHITECTURE.md bottom nav example (5 tabs: Home, Accounts, Move Money, Investments, More) — inconsistent with platform product intent |
| 3 | Operations Center primary navigation | Operations Center | Not defined in any existing document |
| 4 | VANTORIS iCommand navigation | VANTORIS iCommand | Not defined in any existing document |
| 5 | HeroBox navigation | HeroBox | HeroBox absent from all documents |
| 6 | NGO Portal navigation | NGO Portal | NGO Portal absent from all documents |
| 7 | Deep link canonical format | All workspaces | `API_ARCHITECTURE.md` provides examples but no canonical registry |
| 8 | AI navigation (Financial Assistant → page) | Member Portal | How AI navigates to specific pages is undefined |
| 9 | AI navigation (Operations Assistant → page) | Operations Center | Undefined |
| 10 | AI navigation (Platform Intelligence → page) | VANTORIS iCommand | Undefined |
| 11 | Responsive navigation behavior per breakpoint | All workspaces | No document defines how navigation changes at mobile/tablet/desktop |
| 12 | Rules Engine-driven navigation changes | All workspaces | No document defines dynamic navigation triggered by account type, role, or verification status |
| 13 | Post-login redirect logic | All workspaces | Returning member → dashboard path not formalized |
| 14 | Onboarding → dashboard transition | Member Portal | End of onboarding navigation not defined |
| 15 | Permission-denied navigation behavior | All workspaces | What happens when a user navigates to a restricted route is undefined |
| 16 | Verification Center sub-navigation | Member Portal | Verification Center inner pages not defined |

---

## 8. Missing AI Integrations

| # | Missing Integration | Document | Finding |
|---|--------------------|----|---------|
| 1 | Rules Engine ↔ AI recommendations | (no document) | AI recommendations are supposed to be informed by Rules Engine state; integration undefined |
| 2 | AI integration in Operations Center workflows | (no document) | "Operations Assistant" described in product context; ARCHITECTURE.md only mentions AI in member-facing context |
| 3 | Platform Intelligence (iCommand AI) | (no document) | "Platform Intelligence" workspace described in product context; no technical definition exists |
| 4 | AI integration in HeroBox | (no document) | HeroBox absent from all documents |
| 5 | AI integration in NGO Portal | (no document) | NGO Portal absent from all documents |
| 6 | AI-driven navigation (deep links from AI suggestions) | `docs/NAVIGATION_ARCHITECTURE.md` (missing) | API_ARCHITECTURE.md defines the contract skeleton but integration into navigation is undefined |
| 7 | AI context shape per workspace | `REPOSITORY_STANDARDS.md` mentions context but no schema is defined | No document defines the context object sent to ACC from each workspace |
| 8 | AI memory cross-workspace portability | (no document) | Whether AI memory is workspace-scoped or member-scoped is undefined |
| 9 | AI-generated summaries for support tickets | `DATABASE_ARCHITECTURE.md` defines schema; no integration workflow | The trigger and delivery of AI summaries for support is undefined |
| 10 | AI moderation of chat media | `CODING_STANDARDS.md`, `API_ARCHITECTURE.md` mention PII detection; no AI integration defined | Moderation pipeline and AI role in flagging/approving content is undefined |
| 11 | AI-powered fraud detection integration | `ARCHITECTURE.md` mentions ML fraud detection; no integration with transaction workflow | How AI fraud scores influence the Rules Engine or operator workflows is undefined |
| 12 | AI Governance controls | (no document) | Who sets guardrails, monitors AI behavior, and updates prompt templates is undefined |

---

## 9. Missing Rules Engine Integrations

| # | Missing Integration | Finding |
|---|---------------------|---------|
| 1 | Rules Engine definition | No document defines the Rules Engine as a first-class platform component; `ARCHITECTURE.md` calls it "Automation Engine" without specification |
| 2 | Rules Engine ↔ Payment authorization | Payment workflow references "risk checks" but no Rules Engine integration is defined |
| 3 | Rules Engine ↔ Verification routing | How documents are routed through Rules Engine to AI review or operator review is undefined |
| 4 | Rules Engine ↔ Case assignment | Operator work queue population by Rules Engine is undefined |
| 5 | Rules Engine ↔ Session management | Session timeout, lock, and high-risk re-auth triggers are mentioned in DATABASE_ARCHITECTURE.md but not connected to Rules Engine |
| 6 | Rules Engine ↔ Notification dispatch | Notification triggers based on rules are undefined |
| 7 | Rules Engine ↔ Navigation | Dynamic navigation changes based on account type, role, verification status are referenced in product context but not defined |
| 8 | Rules Engine ↔ AI recommendations | Rules Engine state influencing AI recommendation context is undefined |
| 9 | Rules Engine ↔ Escalation | Automatic escalation triggers from Rules Engine to operators are undefined |
| 10 | Rules Engine ↔ Risk scoring | How risk scores from ML/AI update Rules Engine evaluation is undefined |
| 11 | Rules Engine rule storage | Where Rules Engine rules are stored (DB table, YAML files, config service) is undefined |
| 12 | Rules Engine audit trail | Whether Rules Engine actions produce audit events is undefined |

---

## 10. Missing Accessibility Requirements

| # | Gap | Affected Document | Finding |
|---|-----|-----------------|---------|
| 1 | WCAG version conflict | `COMPONENT_ARCHITECTURE.md` (2.1) vs `CODING_STANDARDS.md` (2.2) | Must be resolved to WCAG 2.2 AA as the authoritative baseline |
| 2 | Focus management specification | None | No document defines focus management after modal open/close, navigation, or dynamic content updates |
| 3 | Skip navigation links | None | No document requires or defines skip-to-main-content links |
| 4 | Screen reader announcement patterns | `COMPONENT_ARCHITECTURE.md` has examples; no normative requirement | Live region usage requirements not formally mandated |
| 5 | Keyboard shortcuts policy | None | No document defines global keyboard shortcuts or prohibits conflicting shortcuts |
| 6 | High contrast mode support | `COMPONENT_ARCHITECTURE.md` mentions it; no formal requirement | Formal requirement and test criteria missing |
| 7 | Reduced motion support | None | No document addresses `prefers-reduced-motion` |
| 8 | Color contrast minimum values | `COMPONENT_ARCHITECTURE.md` specifies 4.5:1 and 3:1 ratios | These are specified in one document but not formalized as a cross-cutting platform requirement |
| 9 | Accessibility testing requirements | `CODING_STANDARDS.md` mentions jsx-a11y; no formal test requirements | No document defines required automated and manual accessibility test coverage |
| 10 | Accessibility in AI workspaces | None | AI workspaces (ACC, Financial Assistant, Operations Assistant) have no accessibility requirements defined |
| 11 | Accessible form error handling | None | Error message association, announcement, and recovery patterns not formally defined |
| 12 | Mobile accessibility (touch targets) | `COMPONENT_ARCHITECTURE.md` mentions 48px; no normative requirement | Touch target size requirements are mentioned but not formally mandated |
| 13 | Browser zoom compatibility | None | WCAG 2.2 requires reflow at 320px width; no document defines zoom compatibility requirements |
| 14 | Operations Center accessibility | None | Administrative interfaces must meet the same WCAG baseline; no explicit requirement exists |

---

## 11. Missing Responsive Requirements

| # | Gap | Affected Document | Finding |
|---|-----|-----------------|---------|
| 1 | Foldable phone support | None | No document addresses foldable phone viewports or hinge/fold behavior |
| 2 | Breakpoint definitions (normative) | `COMPONENT_ARCHITECTURE.md` defines breakpoints as code; no DESIGN_SYSTEM.md | Breakpoints exist in one document as code examples, not as a normative platform specification |
| 3 | Navigation behavior per breakpoint | None | Mobile → bottom nav, tablet → adaptive, desktop → sidebar: not formally required in any document |
| 4 | AI workspace responsive behavior | None | How ACC and AI panels adapt to mobile/tablet/desktop is undefined |
| 5 | Table responsive patterns | None | How large data tables reflow on mobile is undefined |
| 6 | Dialog/modal responsive behavior | None | Full-screen dialogs on mobile vs centered modals on desktop not specified |
| 7 | Responsive typography scale | `COMPONENT_ARCHITECTURE.md` has examples; no normative scale | Font size scaling across breakpoints not formalized |
| 8 | Responsive spacing scale | None | Spacing adjustments across breakpoints not formally defined |
| 9 | Large display (2560px+) behavior | None | Ultra-wide and large monitor behavior (max-width, multiple panels) undefined |
| 10 | Responsive charts | None | How financial charts reflow on narrow viewports is undefined |
| 11 | Operations Center responsive behavior | None | Whether the Operations Center is required to be responsive is undefined |
| 12 | Print styles | None | Print layout requirements for statements, reports, and receipts undefined |
| 13 | Zoom compatibility (100%–200%) | None | Layout stability at common browser zoom levels not required in any document |
| 14 | Layout changes without page reload | None | Performance requirement that responsive changes occur without reload not formalized |

---

## 12. Comprehensive Recommendations for Follow-Up Improvements

### 12.1 Priority 1 — Resolve Direct Conflicts (Required Before Implementation)

---

**REC-001**  
**Document:** `docs/DATABASE_ARCHITECTURE.md`  
**Section:** Section 11 — Trusted Devices  
**Reason:** Directly contradicts `docs/REPOSITORY_STANDARDS.md` which mandates "single trusted active device per account." DATABASE_ARCHITECTURE.md specifies "maximum of two active trusted devices."  
**Recommended Update:** Align to one definitive rule. The recommended resolution is to adopt the DATABASE_ARCHITECTURE.md specification of maximum two trusted devices (which allows for planned device replacement without locking out users during transition), and update REPOSITORY_STANDARDS.md accordingly. Document the rationale.

---

**REC-002**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** All sections  
**Reason:** Uses "KYC" extensively (7+ occurrences) despite `REPOSITORY_STANDARDS.md` normatively mandating that "Verification Center replaces any generic KYC page or placeholder" and that "KYC must NOT appear in the More menu."  
**Recommended Update:** Replace all instances of "KYC" with "Verification Center" except where referring to the regulatory compliance concept (AML/KYC laws). Add a note distinguishing the regulatory concept from the product feature name.

---

**REC-003**  
**Document:** `docs/COMPONENT_ARCHITECTURE.md`  
**Section:** Design Principles → 3. Accessibility First  
**Reason:** References WCAG 2.1 AA, but `docs/CODING_STANDARDS.md` normatively requires WCAG 2.2 AA. WCAG 2.2 is the more recent and more stringent standard.  
**Recommended Update:** Update all accessibility references in COMPONENT_ARCHITECTURE.md from WCAG 2.1 AA to WCAG 2.2 AA.

---

**REC-004**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** Core Banking Services — Technology Stack  
**Reason:** Specifies "PostgreSQL 15+" while DATABASE_ARCHITECTURE.md (the authoritative database document, committed later) specifies PostgreSQL 16+.  
**Recommended Update:** Update ARCHITECTURE.md to reference PostgreSQL 16+ to match DATABASE_ARCHITECTURE.md.

---

### 12.2 Priority 2 — Standardize Terminology Across All Documents

---

**REC-005**  
**Document:** `README.md`, `docs/ARCHITECTURE.md`  
**Section:** Core Modules table (README.md); Client Applications diagram (ARCHITECTURE.md)  
**Reason:** "Member Center" is used in README.md. The product context consistently uses "Member Portal" as the canonical name.  
**Recommended Update:** Replace "Member Center" with "Member Portal" everywhere.

---

**REC-006**  
**Document:** `README.md`, `docs/ARCHITECTURE.md`  
**Section:** Core Modules (README: "Executive Administration"); Architecture diagram (ARCHITECTURE.md: "Executive Dashboard")  
**Reason:** "Executive Administration" (README) and "Executive Dashboard" (ARCHITECTURE) both refer to what the product context consistently calls "VANTORIS iCommand."  
**Recommended Update:** Replace with "VANTORIS iCommand" and add a note that it may be displayed to non-administrative users simply as the "Administration" workspace.

---

**REC-007**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** Operations & Administration Layer  
**Reason:** "Operations Dashboard" is the old name. "Operations Center" is the current canonical name per product context.  
**Recommended Update:** Update all references from "Operations Dashboard" to "Operations Center."

---

**REC-008**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** AI & Intelligence Layer — Automation Engine  
**Reason:** "Automation Engine" conflicts with the established "Rules Engine" terminology used in the broader product context.  
**Recommended Update:** Rename to "Rules Engine" and update the description to clarify it handles both rule-based and ML-based workflow automation.

---

**REC-009**  
**Document:** All documents  
**Section:** Any reference to "AI Command Center" or "ACC"  
**Reason:** The abbreviation "ACC" is introduced without formal definition in each document.  
**Recommended Update:** On first use in each document, write "AI Command Center (ACC)" and use ACC thereafter. When DESIGN_SYSTEM.md is authored, establish the canonical name as the single source.

---

### 12.3 Priority 3 — Create Missing Documents

---

**REC-010**  
**Document:** `docs/SECURITY_STANDARDS.md` (create new)  
**Reason:** Referenced as required by `DATABASE_ARCHITECTURE.md` (PCI, PII, retention), `API_ARCHITECTURE.md` (redaction rules), `CODING_STANDARDS.md` (chat media PII), and `CI_CD.md` (security gates). 9+ active cross-references with no target.  
**Recommended Content:** PII classification, encryption standards, retention windows per data type, redaction rules, media handling policies, secrets management, penetration testing requirements, incident response procedures.

---

**REC-011**  
**Document:** `docs/AUTHENTICATION.md` (create new)  
**Reason:** Referenced in README.md. Authentication flows are partially described in ARCHITECTURE.md and API_ARCHITECTURE.md but not in a canonical document.  
**Recommended Content:** OAuth2 + PKCE flow, JWT lifecycle, refresh token rotation, MFA methods, biometric authentication, session lifecycle, inactivity lock timings, re-authentication requirements for high-risk operations.

---

**REC-012**  
**Document:** `docs/RBAC.md` (create new)  
**Reason:** Referenced in `CODING_STANDARDS.md` ("see docs/RBAC.md"), `API_ARCHITECTURE.md`, and `README.md`. Permission gating is defined as a platform requirement but no RBAC document exists.  
**Recommended Content:** Role definitions (Member, Operator, Supervisor, Executive/iCommand Owner, NGO User, HeroBox User), permission hierarchy, AI action permission descriptors, cross-workspace access rules, audit log access, configuration change permissions.

---

**REC-013**  
**Document:** `docs/TESTING.md` (create new)  
**Reason:** Referenced in `CI_CD.md` cross-references ("docs/TESTING.md — testing matrix and where to put e2e tests"). Testing requirements are partially defined in CODING_STANDARDS.md but without a dedicated strategy document.  
**Recommended Content:** Testing pyramid, unit/integration/E2E coverage thresholds, contract testing methodology, AI feature testing requirements, Playwright configuration, test data management, performance testing requirements.

---

**REC-014**  
**Document:** `docs/MIGRATION_GUIDE.md` (create new)  
**Reason:** Referenced in `REPOSITORY_STANDARDS.md`, `CI_CD.md`, `DATABASE_ARCHITECTURE.md`, `API_ARCHITECTURE.md`, and `CODING_STANDARDS.md` (6+ references). Base44 import is the current phase of the platform.  
**Recommended Content:** Pre-import checklist, Base44 service-to-workspace mapping, commit history preservation strategy, pnpm workspace setup, CI enablement steps, post-import smoke test plan, evidence artifacts.

---

**REC-015**  
**Document:** `docs/DESIGN_SYSTEM.md` (create new)  
**Reason:** Referenced in `README.md`. Design principles are currently distributed across `ARCHITECTURE.md`, `COMPONENT_ARCHITECTURE.md`, and `REPOSITORY_STANDARDS.md` without a single canonical design document.  
**Recommended Content:** Design principles (warm, trustworthy, premium), color palette with specific tokens, typography scale, spacing system, breakpoints (normative), component design tokens, workspace-specific design adaptations, accessibility design requirements, responsive design specifications.

---

**REC-016**  
**Document:** `docs/NAVIGATION_ARCHITECTURE.md` (create new)  
**Reason:** No existing document defines navigation structure for any workspace. Navigation is the single most critical missing piece for implementation readiness.  
**Recommended Content:** Single-home principle, Public Website navigation, Member Portal navigation (per-permission), Operations Center navigation, VANTORIS iCommand navigation, HeroBox navigation, NGO Portal navigation, AI navigation, button behavior specification, deep link registry, responsive navigation, Rules Engine-driven dynamic navigation.

---

**REC-017**  
**Document:** `docs/USER_JOURNEYS.md` (create new)  
**Reason:** No existing document defines end-to-end workflows. Without journeys, implementation cannot be verified.  
**Recommended Content:** Public Website journey, member onboarding, member login, account opening, payments (with Rules Engine), Verification Center, support (AI → operator), AI workflow, operations, VANTORIS iCommand, Rules Engine automatic workflows.

---

**REC-018**  
**Document:** `docs/DOCUMENTATION_STANDARDS.md` (create new)  
**Reason:** Referenced in `README.md`. All future documentation needs a standard template to ensure consistency, traceability, and AI readability.  
**Recommended Content:** Document structure requirements (Purpose, Scope, Responsibilities, Definitions, Requirements, Rules, Security Considerations, Dependencies, Cross References, Change History), change management, naming conventions, Mermaid diagram standards, versioning, quality criteria.

---

**REC-019**  
**Document:** `docs/VERIFICATION_CENTER.md` (create new)  
**Reason:** Referenced in `REPOSITORY_STANDARDS.md`, `CODING_STANDARDS.md`, `API_ARCHITECTURE.md`, `DATABASE_ARCHITECTURE.md` (5 documents). REPOSITORY_STANDARDS.md normatively mandates it: "Routes and UI for verification must be documented in docs/VERIFICATION_CENTER.md."  
**Recommended Content:** Verification types, status enums, verification routing workflow, AI review integration, operator review workflow, third-party KYC provider integration, test doubles for CI.

---

### 12.4 Priority 4 — Add Missing Platform Components to Existing Documents

---

**REC-020**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** High-Level Architecture diagram and Architectural Domains  
**Reason:** The following platform components are absent from all committed documents: Public Website, HeroBox, NGO Portal, VANTORIS iCommand (named as such), Rules Engine (as first-class component). These are part of the approved platform.  
**Recommended Update:** Add Public Website, HeroBox, and NGO Portal as client applications in the architecture diagram. Add Rules Engine as a component of the Operations & AI Services layer. Rename Executive Dashboard to VANTORIS iCommand.

---

**REC-021**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** AI & Intelligence Layer  
**Reason:** The AI Command Center (ACC) is defined as a "first-class product surface" in REPOSITORY_STANDARDS.md but does not appear in the high-level ARCHITECTURE.md diagram.  
**Recommended Update:** Add AI Command Center (ACC) to the Architecture diagram. Note it is accessible from all administrative workspaces.

---

**REC-022**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** AI & Intelligence Layer — Components  
**Reason:** "Automation Engine" should be renamed to Rules Engine and its description should reflect its role: evaluating rules that affect verification routing, payment authorization, session management, navigation, and notification dispatch.  
**Recommended Update:** Rename and expand the component description to reflect all Rules Engine responsibilities.

---

**REC-023**  
**Document:** `docs/COMPONENT_ARCHITECTURE.md`  
**Section:** Navigation Layer — Bottom Navigation  
**Reason:** The BottomNav example shows tabs: Home, Accounts, Move Money, Investments, More. The product specification defines Member Portal navigation as: Home, Accounts, Payments, Cards, Wealth, Credit, Verification Center, Security, Support, Profile. These are inconsistent.  
**Recommended Update:** Update bottom navigation tabs to reflect product specification. Note that the "More" tab pattern may still be appropriate for mobile if all items cannot fit.

---

**REC-024**  
**Document:** `docs/COMPONENT_ARCHITECTURE.md`  
**Section:** Onboarding Components  
**Reason:** The KYCForm component name violates the REPOSITORY_STANDARDS.md mandate that Verification Center replaces KYC.  
**Recommended Update:** Rename `KYCForm` to `VerificationForm` or `IdentityVerificationForm` to align with Verification Center terminology.

---

**REC-025**  
**Document:** `docs/REPOSITORY_STANDARDS.md`  
**Section:** DESIGN PRINCIPLES (UX & UI)  
**Reason:** WCAG 2.1 AA is referenced as the baseline. CODING_STANDARDS.md mandates WCAG 2.2 AA.  
**Recommended Update:** Update to WCAG 2.2 AA.

---

**REC-026**  
**Document:** `docs/REPOSITORY_STRUCTURE.md`  
**Section:** Top-level layout  
**Reason:** The repository structure does not include `libs/ai/` (which is mandated by CODING_STANDARDS.md and REPOSITORY_STANDARDS.md), `libs/authz/`, or the `infra/` subdirectory breakdown. Also missing are HeroBox, NGO Portal, and Public Website app directories.  
**Recommended Update:** Add `apps/public-website/`, `apps/herobox/`, `apps/ngo-portal/`, `libs/ai/` (with subdirectories), and `libs/authz/` to the repository structure. Add `infra/` subdirectory examples.

---

**REC-027**  
**Document:** `docs/CODING_STANDARDS.md`  
**Section:** Cross-references  
**Reason:** CODING_STANDARDS.md references RBAC.md ("see docs/RBAC.md" in Permission Gating section) but RBAC.md does not yet exist. This creates a broken reference in an authoritative document.  
**Recommended Update:** Add a note marking RBAC.md as "pending authoring" until the document is committed.

---

### 12.5 Priority 5 — Improve Auditability and Traceability

---

**REC-028**  
**Document:** `docs/API_ARCHITECTURE.md`  
**Section:** Audit & Observability  
**Reason:** Audit events are defined for sensitive endpoints but no document defines the complete list of actions that must produce audit events.  
**Recommended Update:** Add an Audit Event Catalog section or create a linked document listing every action type with its required audit fields.

---

**REC-029**  
**Document:** `docs/DATABASE_ARCHITECTURE.md`  
**Section:** Section 15 — Audit Logs  
**Reason:** The audit_events schema is defined but there is no normative requirement for which services must write to it.  
**Recommended Update:** Add a requirement table listing each service and its required audit event types.

---

**REC-030**  
**Document:** `docs/CI_CD.md`  
**Section:** Evidence & verification section  
**Reason:** Evidence requirements are described in CI_CD.md, REPOSITORY_STANDARDS.md, and CODING_STANDARDS.md independently. The definitions are slightly different in each document (e.g., field names and ordering vary).  
**Recommended Update:** Consolidate the canonical Evidence field definition into one document (recommend REPOSITORY_STANDARDS.md) and have the other documents reference it.

---

### 12.6 Priority 6 — Documentation Quality Improvements

---

**REC-031**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** All  
**Reason:** ARCHITECTURE.md does not include a Cross-References section, making it difficult to navigate to related documents.  
**Recommended Update:** Add a Cross-References section at the bottom of ARCHITECTURE.md linking to COMPONENT_ARCHITECTURE.md, API_ARCHITECTURE.md, DATABASE_ARCHITECTURE.md, CI_CD.md, CODING_STANDARDS.md, and future documents.

---

**REC-032**  
**Document:** All documents  
**Section:** Change History  
**Reason:** No committed document includes a Change History section. This makes it impossible to audit documentation changes or understand when and why decisions were made.  
**Recommended Update:** When DOCUMENTATION_STANDARDS.md is authored, mandate a Change History section for all documents. Apply retroactively when documents are next updated.

---

**REC-033**  
**Document:** `README.md`  
**Section:** Documentation links table  
**Reason:** 7 of 10 links in the Documentation table point to files that do not yet exist, and 2 links in the Development Standards section point to missing files. Broken links in README.md damage developer experience and onboarding.  
**Recommended Update:** Mark missing documents with `(pending)` notation until they are committed. Alternatively, comment out broken links and add them only when documents are ready.

---

**REC-034**  
**Document:** `docs/ARCHITECTURE.md`  
**Section:** Technology Decisions — Frontend  
**Reason:** Testing stack (Vitest, React Testing Library, Playwright) is mentioned but with no reference to TESTING.md (when it exists). This creates a future orphan reference.  
**Recommended Update:** Add a note that the full testing strategy is defined in docs/TESTING.md and reference it when that document is committed.

---

**REC-035**  
**Document:** All documents  
**Section:** Any section referencing HeroBox or NGO Portal  
**Reason:** HeroBox and NGO Portal are entirely absent from all 9 committed documents despite being part of the approved platform architecture.  
**Recommended Update:** Add HeroBox and NGO Portal as platform components to ARCHITECTURE.md, REPOSITORY_STRUCTURE.md, and any future DESIGN_SYSTEM.md, NAVIGATION_ARCHITECTURE.md, USER_JOURNEYS.md, and RBAC.md.

---

## Appendix A — Recommended Document Authoring Sequence

Based on dependency analysis, the following authoring sequence minimizes broken references:

| Priority | Document | Unblocks |
|----------|----------|---------|
| 1 | `docs/SECURITY_STANDARDS.md` | DATABASE_ARCHITECTURE.md, API_ARCHITECTURE.md, CODING_STANDARDS.md |
| 1 | `docs/RBAC.md` | CODING_STANDARDS.md Permission Gating, AUTHENTICATION.md |
| 2 | `docs/AUTHENTICATION.md` | README.md, Security layer in ARCHITECTURE.md |
| 2 | `docs/MIGRATION_GUIDE.md` | CI_CD.md, DATABASE_ARCHITECTURE.md, Base44 import |
| 3 | `docs/TESTING.md` | CI_CD.md cross-reference, CODING_STANDARDS.md |
| 3 | `docs/VERIFICATION_CENTER.md` | REPOSITORY_STANDARDS.md, CODING_STANDARDS.md, API_ARCHITECTURE.md |
| 4 | `docs/DESIGN_SYSTEM.md` | README.md, COMPONENT_ARCHITECTURE.md consolidation |
| 5 | `docs/NAVIGATION_ARCHITECTURE.md` | All workspace implementations |
| 5 | `docs/USER_JOURNEYS.md` | All workflow implementations |
| 6 | `docs/DOCUMENTATION_STANDARDS.md` | Future document quality |
| 7 | `docs/api/*.yaml` (22 files) | Contract tests, API clients |

---

## Appendix B — Terminology Standardization Reference

| Canonical Term | Replace / Retire |
|---------------|-----------------|
| Member Portal | Member Center, Member Web Application (UI context) |
| Operations Center | Operations Dashboard, Admin Console (when used as workspace name) |
| VANTORIS iCommand | Executive Administration, Executive Dashboard |
| Verification Center | KYC (as product feature name) |
| Rules Engine | Automation Engine |
| Financial Assistant | (AI persona name for Members; not a product/feature name) |
| Operations Assistant | (AI persona name for Operators; not a product/feature name) |
| Platform Intelligence | (AI persona name for iCommand users; not a product/feature name) |
| WCAG 2.2 AA | WCAG 2.1 AA |
| PostgreSQL 16+ | PostgreSQL 15+ |
| Node.js LTS | Node.js 18+ |
| AI Command Center (ACC) | (must be introduced with full name on first use) |

---

*Report generated: 2026-07-15. All items are recommendations only. No committed documents were modified.*
