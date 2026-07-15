# Design System — VANTORIS

Status: normative documentation-only. This document defines the complete VANTORIS design system and UI experience standards. It is the visual and interaction source of truth for the Public Website, Member Portal, Operations Center, VANTORIS iCommand, HeroBox, and NGO Portal, and it remains compatible with the planned Base44 migration.

## Purpose

VANTORIS must present a premium, warm, trustworthy enterprise financial experience that feels welcoming while maintaining executive-level professionalism. The design system must keep the platform visually consistent, permission-aware, accessible, responsive, and implementation-ready across all documented product surfaces.

## Experience Principles

The platform must feel:
- Warm
- Trustworthy
- Premium
- Modern
- Clean
- Spacious
- Human
- Professional
- Intelligent

The platform must avoid:
- Aggressive aesthetics
- Military styling
- Hacker or cyberpunk styling
- Overly dark interfaces
- Visual clutter
- Duplicate navigation paths

The design system must also reinforce the architectural principles already established elsewhere in the repository:
- Security-first presentation for sensitive financial workflows
- Progressive disclosure to reduce clutter and cognitive load
- Progressive enhancement so core flows remain usable across devices and browser constraints
- Single-responsibility layouts where each workspace supports a clear user goal
- Permission-aware visibility so users see only actions and destinations they are allowed to use

## Design Foundations

### Color System

Primary palette:
- Deep Navy for primary brand surfaces, trusted navigation anchors, key headings, and high-emphasis actions
- White for primary content backgrounds and contrast balance

Secondary palette:
- Soft Gray for surface separation, borders, dividers, and low-emphasis backgrounds
- Light Blue for supporting highlights, informational surfaces, and calm financial-data framing

Accent palette:
- Gold for premium emphasis, selected highlights, and controlled celebratory moments

Status palette:
- Green for success and verified states
- Amber for warning, pending review, and caution states
- Red for destructive, failed, or urgent states
- Blue for neutral informational and active-progress states

Rules:
- Use generous whitespace as a first-class design element
- Preserve high contrast for text and data visualization
- Reserve accent colors for meaningful emphasis rather than decoration
- Do not rely on color alone to communicate state or action

### Typography

Typography must be modern, highly readable, and confidence-building.

Rules:
- Use large headings with strong hierarchy for page scanning
- Maintain comfortable spacing between headings, body copy, labels, and data values
- Favor readable weights and clean letterforms over decorative styling
- Keep financial values, labels, and status text visually distinct
- Ensure typography scales fluidly across breakpoints without breaking layout integrity
- Preserve readable line lengths, especially on large displays

### Spacing and Layout Rhythm

Rules:
- Spacious layouts are required across member and operations surfaces
- Use consistent spacing tokens rather than ad hoc values
- Group related information into clearly separated sections
- Increase density only where operational workflows require it
- Never stretch primary reading content edge to edge on wide screens
- Use shared layout primitives such as Grid, Stack, Box, and Flex to preserve consistency

## Component Standards

The shared design system must standardize the following component categories across all applications:
- Buttons
- Cards
- Tables
- Forms
- Dialogs
- Drawers
- Navigation
- AI Panels and AI workspaces
- Charts
- Notifications
- Search
- Upload Areas

### Buttons
- Primary actions must be visually obvious without overwhelming the page
- Secondary and destructive actions must be clearly differentiated
- Touch targets must remain large enough for mobile and tablet interaction
- Button labels must describe the action directly

### Cards
- Cards must group related data, actions, or summaries
- Card sizing must adapt to viewport size and information density
- Cards must support account, transaction, portfolio, insight, and metric use cases without bespoke styling per app

### Tables
- Tables are the default for dense operational data on larger screens
- Tables must degrade gracefully into stacked, grouped, or card-based presentations on smaller screens
- Sorting, filtering, and row actions must remain accessible across devices
- Large datasets should preserve readability before maximizing density

### Forms
- Forms must prioritize clarity, validation visibility, and progressive disclosure
- Sensitive flows such as onboarding, verification, transfers, and trusted-device changes must emphasize confidence and reduce error risk
- Field groupings, labels, help text, and validation states must remain consistent across all products

### Dialogs and Drawers
- Dialogs must be reserved for focused decisions and confirmations
- Drawers may be used for contextual detail when they do not obscure critical workflow content
- On small screens, dialogs and drawers may expand to full-screen experiences when appropriate

### Navigation Components
- Navigation must always communicate place, hierarchy, and the next likely action
- Sidebars, top navigation, bottom navigation, tabs, breadcrumbs, and command surfaces must all derive from one unified navigation model
- Menu structures must not duplicate destination ownership

### AI Workspace Components
- AI is not a popup; AI is a workspace
- AI surfaces must use the same design tokens and interaction standards as the rest of the platform
- AI actions, prompts, context, and workflow steps must appear as structured workspace elements rather than ad hoc overlays
- Permission-aware AI actions must only display actions the signed-in user is authorized to perform

### Charts, Notifications, Search, and Uploads
- Charts must favor readability, trend clarity, and accessible legends over visual novelty
- Notifications must be noticeable without becoming noisy or disruptive
- Search must remain prominent where information retrieval is a primary workflow
- Upload areas must clearly communicate supported file types, progress, validation, and resulting status

## Navigation Model

Navigation is governed by the following permanent rules:
- Every feature must have exactly one permanent home
- Never duplicate navigation across menus, tabs, drawers, and workspaces
- Only show features relevant to the user’s role, permissions, account type, verification status, and current workflow
- Hide unavailable features rather than disabling them
- Never expose hidden authorities, internal permission identifiers, or internal system permission structures

AI entry points must follow the same rule set and must appear only where the workspace and permissions allow them.

## AI Experience Standards

### Member-facing AI
Members see the Financial Assistant.

Rules:
- The assistant must support a calm, trusted financial guidance experience
- The workspace must respect member permissions and member-owned data boundaries
- The AI must never reveal internal operations data, hidden workflows, or unauthorized actions

### Operations AI
Operations users see the Operations Assistant.

Rules:
- The workspace must support case handling, review workflows, operational triage, and communication tasks
- It must remain docked or positioned so it does not cover critical operational content on larger screens

### Executive AI
VANTORIS iCommand users see Platform Intelligence.

Rules:
- The workspace must support governance, analytics, security oversight, reporting, and configuration context
- Executive AI surfaces must never expose hidden authority identifiers even within high-authority workspaces

## Product Surface Guidance

### Public Website
The public website must communicate premium trust comparable to leading U.S. financial institutions without imitating any specific brand.

Homepage sections must include:
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
- Returning users go directly to Sign In
- New users begin onboarding
- Marketing presentation must remain aligned with the same core design tokens as authenticated products

### Member Portal
Members must see only:
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
- Members must see only their own accounts, investments, documents, and data
- Layouts should prioritize reassurance, clarity, and guided action completion
- Support and AI surfaces should feel integrated rather than bolted on

### Operations Center
Operations Center must organize into:
- Dashboard
- Members
- Banking
- Verification
- Operations
- Communications
- Reports
- AI Operations Assistant

Rules:
- Operations layouts may use higher information density than member layouts
- Critical queues, case context, and triage actions must stay visible without sacrificing readability

### VANTORIS iCommand
VANTORIS iCommand is an executive workspace only.

It contains:
- Governance
- Platform Health
- Security
- Analytics
- AI Governance
- Configuration

Rules:
- Never expose hidden authority identifiers
- Maintain premium executive clarity with strong information hierarchy
- Preserve audit-oriented presentation for sensitive actions and system state

### HeroBox and NGO Portal
Rules:
- Both surfaces must inherit the same visual language, component standards, accessibility requirements, and responsive rules
- They may introduce purpose-specific content and workflows, but must not fork the design system or navigation model

## Responsive Design

VANTORIS must be fully responsive and automatically adapt to:
- Mobile Phones
- Foldable Phones
- Tablets
- Laptops
- Desktop Monitors
- Ultra-Wide Displays

Users must never need to manually zoom to use the application.

Responsive behavior must be automatic and immediate, without page reloads or manual mode switches.

## Adaptive Layouts

The platform must automatically adjust:
- Spacing
- Card size
- Table presentation
- Navigation position
- Dialog size
- AI workspace position
- Form width and grouping
- Typography scale

Rules:
- Layout decisions must be driven by available space, not by device name alone
- Containers must reflow before content becomes cramped or unreadable
- Dense operational layouts must simplify gracefully on smaller screens
- AI workspaces must reposition without hiding critical workflow content
- Dialogs and drawers must resize to preserve legibility and action clarity
- Forms must adapt from multi-column to single-column as needed while preserving validation clarity

## Mobile

Mobile standards:
- Use single-column layouts where appropriate
- Provide large touch targets and comfortable vertical rhythm
- Use bottom navigation where it improves reachability
- Support swipe-friendly interactions where they add value without hiding critical actions
- Use full-screen forms and full-screen AI workspaces when appropriate
- Convert complex data tables into mobile-friendly summaries, cards, or drill-down views
- Keep primary tasks, balances, statuses, and support entry points immediately understandable

## Tablet

Tablet standards:
- Use two-column layouts where appropriate
- Introduce side navigation when space allows
- Support split-screen operation where practical
- Preserve touch-friendly controls while allowing denser information layout than mobile
- Use tablet layouts to balance browsing, review, and action-taking without desktop assumptions

## Desktop

Desktop standards:
- Use multi-column dashboards where appropriate
- Support larger data tables and richer data comparisons
- Use persistent side navigation
- Support resizable panels when useful for operations and executive workflows
- Dock AI workspaces without covering important content
- Maintain stable placement for filters, summaries, detail panes, and actions

## Large Displays

Large-display standards:
- Use additional space to improve readability rather than simply stretching layouts
- Never stretch core content edge to edge
- Keep readable line lengths for text-heavy surfaces
- Preserve generous whitespace and balanced composition
- Support multiple simultaneous panels when useful for operations, analytics, and AI-assisted workflows
- Allow dashboards, reports, and executive workspaces to benefit from wider comparison layouts without losing hierarchy

## Foldables and Intermediate States

Rules:
- Support narrow and expanded folded-device states without breaking navigation or forms
- Re-evaluate panel docking and workspace placement when the available viewport changes significantly
- Preserve continuity when the viewport transitions between compact and expanded states

## Accessibility

All layouts must remain usable at common browser zoom levels:
- 100%
- 125%
- 150%
- 200%

The design system must continue to meet WCAG 2.2 AA requirements across all surfaces and breakpoints.

Accessibility rules:
- Keyboard navigation must remain intact across responsive states
- Reading order and focus order must remain logical when layouts reflow
- Text must remain readable and actionable without horizontal scrolling in standard workflows
- Contrast, state communication, and target sizing must remain compliant at each breakpoint and zoom level
- Responsive changes must not remove access to core actions, support, verification, or security controls

## Performance and Interaction Behavior

Rules:
- Layout changes must occur automatically without requiring page reloads or manual zooming
- Responsive adaptations must not introduce noticeable layout instability during normal workflow use
- Large tables, charts, and AI surfaces should use responsive strategies that preserve performance as well as readability
- Progressive loading, virtualization, and lazy rendering may be used where needed, but the user experience must remain coherent while content loads

## Implementation Alignment

The design system must remain aligned with the documented architecture and standards:
- Shared UI components belong in the shared design-system library
- Design tokens must be the single source of truth for color, spacing, typography, elevation, and layout behavior
- Member, operations, executive, support, verification, chat, and AI experiences must reuse common primitives rather than diverging visually
- Permission-aware visibility in the interface must complement, never replace, backend enforcement
- Verification Center remains the single verification surface
- Unified chat remains a single architecture and shared interaction model

## Base44 Compatibility

This document is documentation-only and must remain fully compatible with the Base44 implementation and migration plan.

Rules:
- Preserve intended business behavior while improving presentation quality and responsiveness
- Use this design system as the target for migration, refactor, and validation work after import
- Do not require a redesign that would rewrite working business logic without explicit approval

## Cross-References

- `/home/runner/work/vantoris/vantoris/docs/ARCHITECTURE.md`
- `/home/runner/work/vantoris/vantoris/docs/COMPONENT_ARCHITECTURE.md`
- `/home/runner/work/vantoris/vantoris/docs/CODING_STANDARDS.md`
- `/home/runner/work/vantoris/vantoris/docs/API_ARCHITECTURE.md`
- `/home/runner/work/vantoris/vantoris/docs/DATABASE_ARCHITECTURE.md`
- `/home/runner/work/vantoris/vantoris/docs/CI_CD.md`
- `/home/runner/work/vantoris/vantoris/docs/REPOSITORY_STANDARDS.md`
- `/home/runner/work/vantoris/vantoris/docs/REPOSITORY_STRUCTURE.md`

## Dependencies and Gaps Discovered

- `/home/runner/work/vantoris/vantoris/README.md` references `/home/runner/work/vantoris/vantoris/docs/AUTHENTICATION.md`, `/home/runner/work/vantoris/vantoris/docs/RBAC.md`, `/home/runner/work/vantoris/vantoris/docs/TESTING.md`, and `/home/runner/work/vantoris/vantoris/docs/MIGRATION_GUIDE.md`, but those files are not present in the current checkout.
- Multiple existing documents reference `/home/runner/work/vantoris/vantoris/docs/SECURITY_STANDARDS.md` and `/home/runner/work/vantoris/vantoris/docs/VERIFICATION_CENTER.md`, which are also not present in the current checkout.
- Repository standards require a shared design-system library after Base44 import, but no application or library code exists yet in this repository.
- Existing documentation establishes responsive and accessibility expectations, but breakpoint tokens, container width rules, and component-level responsive behavior maps still need implementation artifacts after import.

## Recommendations Before the Next Document

1. Reconcile the current checkout with the referenced-but-missing documentation so all source-of-truth documents are present together.
2. Define the canonical responsive breakpoint and container-token set when the shared design-system library is introduced after Base44 import.
3. Create security and verification standards documents before implementation begins so responsive UI decisions for sensitive flows inherit finalized compliance rules.
4. Validate this design system against the testing strategy once `/home/runner/work/vantoris/vantoris/docs/TESTING.md` is available in the active checkout.
