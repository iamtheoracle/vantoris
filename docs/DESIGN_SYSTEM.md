# VANTORIS Design System

Status: normative documentation-only. This document defines the canonical VANTORIS design system for all current and future product surfaces. It translates the repository architecture, component architecture, repository standards, coding standards, API architecture, database architecture, and CI/CD rules into one visual and interaction system that remains compatible with the future Base44 implementation.

## 1. Purpose

The VANTORIS Design System exists to ensure that every VANTORIS experience feels like one premium financial platform, regardless of which product surface a user is using.

It applies to:
- Public Website
- Member Portal
- Operations Center
- VANTORIS iCommand
- HeroBox
- NGO Portal
- AI workspaces and guided workflows
- Shared chat, verification, support, reporting, and document interfaces

The design goal is clear and non-negotiable:
- premium
- warm
- trustworthy
- modern
- clean
- spacious
- human
- professional
- intelligent

VANTORIS must never feel aggressive, militarized, hacker-styled, cyberpunk, coldly clinical, or overly dark. The platform must inspire confidence without intimidation.

## 2. Source of Truth and Compatibility

- This document is the normative design reference for all UI tokens, components, layouts, and navigation decisions.
- All applications must implement this system through the shared design-system library defined in `docs/REPOSITORY_STRUCTURE.md` and `docs/COMPONENT_ARCHITECTURE.md`.
- All visual properties must come from centralized tokens. No application may introduce its own unapproved colors, spacing scales, typography scales, shadows, or component variants.
- This document must remain compatible with the future Base44 import. Existing business logic may be migrated into this system, but the intended member and operator experience must be preserved while visual consistency is improved.
- The design system must support the repository standards for AI Command Center, Member Advisor, Verification Center, trusted-device controls, evidence-based reporting, and accessibility.

## 3. Core Design Principles

### 3.1 Emotional and brand principles
- Use warmth without informality.
- Use premium restraint rather than decorative excess.
- Use generous whitespace to reduce stress and increase trust.
- Use clear hierarchy so critical financial information is immediately understandable.
- Use calm emphasis instead of loud contrast.
- Use polished, executive-quality layouts that still feel welcoming to everyday members.

### 3.2 Interaction principles
- Every screen must have a primary purpose and a clear next action.
- Every feature has exactly one permanent home in navigation.
- Never duplicate major navigation destinations across menus, drawers, and overflow areas.
- Hide features a user cannot use; do not tease inaccessible functionality with disabled navigation items.
- Use progressive disclosure for complexity: surface summary first, detail second, power tools third.
- Prefer guided flows for high-risk, regulated, or multi-step tasks.

### 3.3 Platform principles
- Member, operations, executive, and public experiences must feel related but not identical.
- AI is a workspace, not a popup.
- Accessibility is a default requirement, not a later enhancement.
- Responsive behavior must be built into every component and layout from the start.
- Design decisions must reinforce permission boundaries, auditability, and privacy.

## 4. Platform Experience Model

### 4.1 Public Website
Purpose:
- brand trust
- product discovery
- education
- onboarding entry
- sign-in entry

Required homepage sections:
- Hero
- Personal Banking
- Business Banking
- Investments
- Credit
- HeroBox
- Community
- Financial Education
- Contact
- Sign In
- Open Account

Rules:
- Returning users must be directed to Sign In without unnecessary marketing friction.
- New users begin onboarding from Open Account or equivalent onboarding entry points.
- The public site should feel comparable in quality to leading U.S. financial institutions without imitating any specific brand identity.
- Public pages should emphasize credibility, clarity, and service sophistication.

### 4.2 Member Portal
Permanent primary navigation for members:
- Home
- Accounts
- Payments
- Cards
- Wealth
- Credit
- Verification Center
- Security
- Support
- Profile

Rules:
- Members see only their own accounts, investments, cards, documents, statements, support conversations, verification status, and profile data.
- Members must never see internal notes, internal cases, operations data, audit logs, platform configuration, or other member records.
- Verification Center replaces generic KYC navigation and must not be duplicated elsewhere.
- Navigation labels should use member-friendly language, not internal banking terminology.

### 4.3 Operations Center
Permanent primary navigation for operations users:
- Dashboard
- Members
- Banking
- Verification
- Operations
- Communications
- Reports
- AI Operations Assistant

Rules:
- Operations interfaces prioritize throughput, triage, review context, and clear queue status.
- High-density data views are allowed, but must remain readable and structured.
- Operations users must not see platform-governance-only configuration or hidden authority identifiers.

### 4.4 VANTORIS iCommand
Purpose:
- executive governance
- platform oversight
- operational intelligence
- security and compliance oversight

Permanent primary navigation:
- Governance
- Platform Health
- Security
- Analytics
- AI Governance
- Configuration

Rules:
- VANTORIS iCommand is an executive workspace only.
- It must never expose hidden authority levels, hidden authority identifiers, or internal permission codes in the user interface.
- Executive tools may be powerful, but the interface must remain calm, precise, and auditable.

### 4.5 HeroBox and NGO Portal
- HeroBox and NGO Portal must share the same foundation tokens, form patterns, cards, navigation logic, and accessibility standards as the rest of the platform.
- Product-specific branding moments may exist, but they must remain within the VANTORIS token system.
- These experiences must feel purpose-built, not visually disconnected.

## 5. Navigation System

### 5.1 Global navigation rules
- Every feature has one canonical location.
- Do not duplicate destinations between sidebar, top navigation, more menus, drawers, and AI launchers.
- More menus may contain secondary actions, but not duplicate primary product areas.
- Navigation visibility must be determined by:
  - role
  - permissions
  - account type
  - verification status
  - current workflow state
- Users must never see menu items they cannot use.
- Hidden authorities, internal system permissions, and internal authority codes must never be surfaced in UI copy, menus, badges, or tooltips.

### 5.2 Navigation behavior by form factor
- Desktop: left sidebar or top navigation with clear hierarchy and persistent context.
- Tablet: condensed sidebar or structured drawer with visible current section and easy access to primary actions.
- Mobile: bottom navigation only when it improves task completion and stays within the canonical information architecture.
- Large displays: preserve readable content widths; do not stretch core flows edge-to-edge.

### 5.3 Navigation tone
- Use stable, plain-language labels.
- Avoid clever labels, ambiguous metaphors, or internal operational jargon.
- Use breadcrumbs only when they meaningfully clarify nested context.

## 6. AI Experience Design

### 6.1 Foundational rule
AI is not a popup. AI is a workspace.

### 6.2 Role-specific assistant naming
- Members see: Financial Assistant
- Operations users see: Operations Assistant
- VANTORIS iCommand users see: Platform Intelligence

These are role-specific presentations of the broader AI Command Center architecture established elsewhere in the repository.

### 6.3 AI workspace requirements
- AI must open as a dedicated workspace, panel, or route with enough room for context, actions, results, uploads, and history.
- AI must display only actions that the signed-in user is authorized to perform.
- AI suggestions must inherit the current user's permissions and workflow context.
- AI must never reveal information outside the user's allowed scope.
- AI action deep links must resolve to the one canonical location for that task.
- AI must support attachments and chat patterns consistent with the shared chat architecture.
- AI should feel intelligent and assistive, not theatrical or overly anthropomorphic.

### 6.4 AI layout expectations
Every AI workspace should support:
- workspace header
- conversation/history area
- structured action and suggestion area
- context panel
- upload area
- result or workflow panel
- clear audit-aware confirmation patterns for sensitive actions

## 7. Visual Language

### 7.1 Color system

The color system must create a premium banking experience built on calm contrast, warmth, and clarity.

#### Primary colors
- Deep Navy — primary brand anchor, headers, navigation emphasis, high-trust surfaces
- White — primary canvas, content surfaces, high-clarity reading environments

Canonical token values:
- `color.brand.navy = #102847`
- `color.base.white = #FFFFFF`

#### Secondary colors
- Soft Gray — section separation, muted surfaces, table fills, neutral containers
- Light Blue — supportive emphasis, informational backgrounds, calm feature highlighting

Canonical token values:
- `color.surface.gray = #F4F6F8`
- `color.surface.blue = #EAF2FF`

#### Accent color
- Gold — premium emphasis, sparing highlights, key indicators, selected executive accents

Canonical token value:
- `color.accent.gold = #C8A34D`

#### Status colors
- Success Green — `#2E8B57`
- Warning Amber — `#C98A00`
- Error Red — `#C43D3D`
- Info Blue — `#2F6FED`

### 7.2 Color usage rules
- White and soft neutrals should dominate layouts.
- Deep Navy should provide structure, trust, and anchoring, not visual heaviness.
- Gold is an accent only; never use it as the dominant interface color.
- Status colors must be reserved for status, feedback, and risk communication.
- Avoid large dark fields unless they materially improve focus, and even then maintain warmth and contrast.
- Do not use neon, hyper-saturated gradients, or hacker-style palettes.
- Do not rely on color alone to communicate status, urgency, or success.

## 8. Typography

### 8.1 Typography goals
- modern
- highly readable
- calm
- precise
- premium

### 8.2 Typography standards
- Use a modern sans-serif system with excellent legibility at small and large sizes.
- Headings must be large enough to create a confident premium hierarchy.
- Body copy must feel comfortable and uncluttered.
- Tables, balances, and transaction metadata must remain highly scannable.
- Numeric data should use tabular figures where precision and alignment matter.

### 8.3 Hierarchy rules
- H1 is reserved for page-level identity and major landing sections.
- H2 structures major page regions and dashboards.
- H3 and lower organize cards, panels, and nested sections.
- Body text must not be compressed to create artificial density.
- Labels, helper text, and captions must remain readable and never appear fragile or low-contrast.

### 8.4 Spacing and rhythm
- Use comfortable line lengths and consistent vertical rhythm.
- Increase spacing around major sections, cards, and forms to reinforce clarity.
- Use larger heading-to-body spacing on marketing and executive surfaces.

## 9. Layout, Spacing, and Surfaces

### 9.1 Layout system
- All layouts must use shared primitives such as Grid, Stack, Box, Flex, and Panel equivalents from the design system.
- Layouts should prioritize whitespace, modularity, and predictable alignment.
- Use constrained content widths for readability.
- Use wider analytical canvases only where dense operational data benefits from it.

### 9.2 Spacing
- The platform must feel spacious, not cramped.
- Spacing must follow a consistent token scale.
- Dense operational views may reduce spacing modestly, but must not abandon hierarchy or readability.

### 9.3 Surfaces
- Primary content surfaces should be white or near-white.
- Secondary surfaces may use soft gray or light blue fills.
- Cards, sheets, dialogs, and drawers should feel polished and calm, with subtle border, elevation, and radius treatment.
- Shadows must be restrained and soft.

## 10. Component Standards

All component implementations must align with the layered component architecture in `docs/COMPONENT_ARCHITECTURE.md`.

### 10.1 Buttons
- Primary buttons use Deep Navy on light surfaces unless a contextual status action is required.
- Secondary buttons use quieter contrast and never compete visually with the primary action.
- Destructive actions use the error color and require clear confirmation when risk is meaningful.
- Button labels must be clear, action-oriented, and free from internal jargon.
- Touch targets must meet accessibility sizing expectations.

### 10.2 Cards and panels
- Cards group related content and should be the default container for modular summaries.
- Cards must use clear headers, content zones, and optional action areas.
- Avoid overloading cards with too many competing actions.
- Important balances, statuses, and next steps should appear near the top of the card.

### 10.3 Tables
- Tables are required for operations, reporting, and high-detail financial review surfaces.
- Member-facing tables should favor readability over maximal density.
- Operations tables may be denser, but must keep clear column hierarchy, row states, and filter visibility.
- Numeric and financial columns must align for comparison.
- Statuses must use both text and visual indicators.

### 10.4 Forms
- Forms must feel calm, guided, and trustworthy.
- Use single-column flows by default for critical financial tasks and onboarding unless a wider multi-column layout clearly improves comprehension.
- Labels are always visible.
- Helper text should prevent mistakes before they happen.
- Validation should be immediate when helpful and never punitive in tone.
- Sensitive inputs and regulated steps should make trust, privacy, and verification expectations explicit.

### 10.5 Dialogs
- Use dialogs for focused decisions, short confirmations, and interruptive acknowledgements.
- Dialogs should not contain complex multi-step workflows that deserve full-page treatment.
- High-risk dialogs must explain impact clearly and require deliberate confirmation.

### 10.6 Drawers and sheets
- Use drawers for contextual side tasks, detail inspection, and non-destructive supporting workflows.
- Drawers must never duplicate a feature's canonical permanent home.
- On smaller screens, drawers may become full-height sheets if accessibility and usability improve.

### 10.7 Navigation components
- Shared navigation primitives must enforce consistent current-state indicators, icon sizing, spacing, and permission-aware rendering.
- Bottom navigation must be deliberate and limited to experiences where it materially improves mobile task completion.
- More menus must not become shadow navigation systems.

### 10.8 AI panels and AI workspace modules
- AI components must support suggestions, structured actions, context display, uploads, and conversation history.
- Permission-aware action visibility is mandatory.
- AI actions that trigger sensitive workflows must clearly show review and confirmation states.

### 10.9 Charts and analytics
- Charts must support executive comprehension first and decoration second.
- Use simplified palettes and clear legends.
- Use accent gold sparingly for emphasis, not as the base series color across all charts.
- Avoid cluttered dashboards with too many simultaneous chart types.
- Provide textual summaries for important insights and anomalies.

### 10.10 Notifications and alerts
- Use notifications for timely information, not as a substitute for navigation or task management.
- Success, warning, info, and error patterns must be consistent across all surfaces.
- Toasts are for short-lived updates.
- Alerts and banners are for persistent context or important action requirements.
- Security-sensitive alerts must be direct, calm, and explicit.

### 10.11 Search
- Search must feel fast, focused, and structured.
- Search results should present primary identifier, secondary metadata, status, and next action clearly.
- Enterprise search surfaces must never reveal results the user is not allowed to access.

### 10.12 Upload areas
- Upload components must support document, image, video, and voice/file workflows allowed by the platform.
- Upload areas should clearly communicate accepted file types, size constraints, scan or review status, and privacy expectations.
- Upload progress and completion states must be visible and accessible.

## 11. Shared Domain UX Standards

### 11.1 Verification Center
- Verification Center is the single verification destination.
- Do not label the navigation destination as KYC.
- Verification states must be explicit, understandable, and actionable.
- Verification UX must reduce anxiety through clear next steps and calm status presentation.

### 11.2 Trusted devices and security
- Security interfaces must present trusted devices, session events, MFA, passkeys, and recovery actions in a clear, controlled manner.
- Device-management UI must make additions, removals, and approval requirements understandable without exposing internal risk logic.
- Fresh-authentication prompts for high-risk actions must feel authoritative and concise.

### 11.3 Chat and support
- Chat, support, and advisor interactions must use the shared chat architecture and shared chat primitives.
- Messages, attachments, read receipts, typing indicators, threads, reactions, and AI summaries must feel consistent across support and advisory contexts.
- Member Advisor, support, and AI should feel like one coherent communications system.

## 12. Responsiveness

The design system must support:
- Desktop
- Tablet
- Mobile
- Large Displays

### 12.1 Breakpoint model
Use the shared responsive model already established in the component architecture:
- xs: 0+
- sm: 640+
- md: 768+
- lg: 1024+
- xl: 1280+
- 2xl: 1536+

### 12.2 Responsive rules
- Use mobile-first layouts and scale upward.
- Preserve primary actions and reading order across breakpoints.
- Do not hide critical financial information behind avoidable interactions.
- Convert dense tables, filters, and multi-panel layouts into more focused structures on smaller screens.
- Large displays should increase breathing room and analytical context, not simply enlarge every element.

## 13. Accessibility

VANTORIS must meet WCAG 2.2 AA standards across public, member, operations, and executive experiences.

Accessibility requirements:
- semantic structure
- keyboard accessibility
- visible focus states
- sufficient color contrast
- touch-friendly target sizing
- clear labels and instructions
- screen-reader compatibility
- responsive reflow without loss of meaning
- motion restraint and respect for reduced-motion settings
- non-color status communication

Accessibility must be validated at the component level and at the full workflow level.

## 14. Content and Voice

- Use language that is warm, calm, and precise.
- Prefer plain financial language over internal platform terminology.
- Avoid slang, hype, or theatrical AI copy.
- Confirmation text should reassure without sounding casual.
- Error messages should be direct, respectful, and recovery-oriented.
- AI copy must be confident but never imply authority beyond the signed-in user's actual permissions.

## 15. Base44 Compatibility

- This design system must map cleanly onto the future Base44 implementation.
- Base44-imported components should be audited against this document and migrated into the shared design-system model without rewriting validated business logic unnecessarily.
- Existing flows may be visually normalized, but behavioral intent must be preserved unless explicitly approved.
- Token extraction, component consolidation, responsive normalization, and accessibility improvements are preferred migration paths.

## 16. Governance

- Any new token, component type, layout pattern, or navigation model change requires design-system review.
- Design changes that affect permissions, AI behavior, verification, or regulated workflows must also be reviewed against repository, coding, API, database, and security standards.
- No product surface may create a parallel design language or duplicate component library.

## 17. Cross-References

- `README.md`
- `docs/ARCHITECTURE.md`
- `docs/COMPONENT_ARCHITECTURE.md`
- `docs/REPOSITORY_STRUCTURE.md`
- `docs/REPOSITORY_STANDARDS.md`
- `docs/CODING_STANDARDS.md`
- `docs/CI_CD.md`
- `docs/API_ARCHITECTURE.md`
- `docs/DATABASE_ARCHITECTURE.md`

Planned or referenced companion documents not yet present in this repository snapshot:
- `docs/SECURITY_STANDARDS.md`
- `docs/AUTHENTICATION.md`
- `docs/RBAC.md`
- `docs/MIGRATION_GUIDE.md`
- `docs/TESTING.md`

