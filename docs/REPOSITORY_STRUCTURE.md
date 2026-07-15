# REPOSITORY STRUCTURE

This document defines the canonical repository layout for VANTORIS and explains where production artifacts and the Base44 export should be placed when imported.

Principles
- Monorepo layout using workspaces (pnpm/yarn/lerna) to group frontend, backend, and shared packages.
- Clear separation between apps (runtime services), libs (shared code), infra (IaC), and docs.
- Minimal surface area at root: top-level directories are the single source of truth for teams and automation.

Top-level layout

```
/                 # repository root
  apps/           # runnable applications (frontend, backend services)
    member-web/   # member-facing React application
    member-mobile/# React Native app (if kept here)
    operations/   # operations dashboard
    services/     # deployable backend services (account, transaction, auth, etc.)
  libs/           # shared libraries and UI design system
    design-system/
    api-client/
    utils/
  infra/          # IaC (Terraform, k8s manifests, Helm charts)
  scripts/        # repository-level scripts (migration, bootstrap helpers)
  docs/           # architecture & operational docs (this folder)
  .github/        # CI config, issue/PR templates
  package.json    # workspace definition (only present after import)
  pnpm-workspace.yaml | yarn.workspaces
  README.md
```

Placement and Base44 import guidance
- When the Base44 export is provided, import the tree into the apps/ and libs/ directories preserving logical boundaries.
- Preserve service names and Docker image names from the export; map them into infra/ for deployment artifacts.
- If the export contains a mono-repo, keep its internal structure but move it under /apps/<service> or /libs/<package> as appropriate.

Repository ownership
- Each top-level app or service must contain an OWNERS file listing code owners and on-call contacts.
- infra/ contains separate OWNERS for platform and security teams.

Why this layout
- Supports independent lifecycle for services, shared code reuse, and simple CI pipeline targeting changed workspaces.

Change process
- Any change to top-level layout must be approved via a design PR and documented in docs/REPOSITORY_STRUCTURE.md.
