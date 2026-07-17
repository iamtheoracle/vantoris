---
name: Admin AI Dev Mode
description: Administrator-only AI development assistant at /operations/ai-dev-mode
---

**Route:** `/operations/ai-dev-mode` → `src/pages/admin/AdminAIMode.jsx`

**Role gate:** Checks `user.role` against `['admin', 'developer', 'executive', 'ops']`. Shows access-denied screen for any other role.

**Sidebar entry:** Added to `WORKSPACE_CONFIG.executive` section "AI & Administration" in `AdminSidebar.jsx`.

**Audit logging:** Access and each query are logged via `logAuditEntry` with actions `AI_DEV_MODE_ACCESS` and `AI_DEV_MODE_QUERY`.

**AI backend:** Uses `base44.agents.initiate({ agentName: 'VantorisDevAI', ... })`. Falls back gracefully if agent isn't configured.

**Critical constraint:** Banner and system prompt explicitly state deployments require explicit administrator approval. AI never executes deployments autonomously.

**Why:** Spec requires an admin-only AI mode separate from the member-facing AI assistant. Deployment actions must require human approval — this is enforced both in the system prompt and the UI warning banner.
