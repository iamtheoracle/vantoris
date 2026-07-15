# API Architecture — VANTORIS

Status: normative documentation-only. This file defines the platform-wide API architecture and contract standards for VANTORIS. REST + OpenAPI v3 is the primary public contract. GraphQL is allowed only for internal analytics and reporting services. This document prepares the repository to receive the Base44 export and guides API contract changes during and after migration.

Purpose
- Define contract-first API design using OpenAPI v3 for all public-facing services.
- Preserve strong typing and machine-readable contracts (docs/api/*.yaml) so client SDKs and contract tests can be generated.
- Ensure auditability, versioning, migration paths, and evidence requirements for every API change.

Principles
- Contract-first: design APIs as OpenAPI v3 documents stored under docs/api/*.yaml and run consumer-driven contract tests in CI.
- Versioning: path-based versioning (/v1/, /v2/). Breaking changes MUST follow the two-release migration plan (deprecate → warn → remove).
- Backwards compatibility: prefer additive changes, deprecate fields before removal, and provide compatibility shims where needed.
- Security: TLS 1.3, token-based auth (OAuth2 / JWT), field-level encryption for PCI/PII, and server-side validation of all inputs.
- Observability: every request must include correlation and trace context; sensitive actions produce immutable audit events.

Public contract layout
- Canonical files: docs/api/account.yaml, docs/api/transaction.yaml, docs/api/auth.yaml, docs/api/chat.yaml, docs/api/ai.yaml, docs/api/verification.yaml, etc.
- Each OpenAPI document must include:
  - Info: title, version, contact, license
  - Servers list for dev/staging/prod
  - SecuritySchemes (OAuth2/JWT)
  - Common components: schemas, parameters, responses, security, headers
  - x-evidence metadata (custom extension) indicating required Evidence fields and verification tests

API Gateway & Edge
- Gateway responsibilities:
  - Authenticate and validate tokens
  - Rate limiting and quota enforcement
  - Request signing (internal- to- internal trust) and IP-based defenses
  - Correlation headers injection: X-Correlation-ID and traceparent
  - Simple RBAC hints (UI visibility) — gateway may expose allowed actions endpoints but backend must enforce permissions

Authentication & Authorization
- Primary flow: OAuth2 Authorization Code with PKCE for web/mobile clients; JWT access tokens with short lifetimes and refresh tokens with rotation.
- Service-to-service: mTLS or signed JWTs for internal calls.
- Token scopes: fine-grained scopes that map to permissions; map scopes to AI action descriptors and permission descriptors in libs/ai/permissions.
- Refresh token rotation: issue new refresh token on refresh and invalidate previous.

Error model and responses
- Standard error envelope (application/json):
  {
    "code": "string",          // machine-readable error code
    "message": "string",       // human-friendly message
    "details": { ... },         // optional structured details
    "correlation_id": "uuid"  // request correlation id
  }
- Use HTTP status semantics: 2xx success, 4xx client errors (400/401/403/404/409), 5xx server errors.
- Business errors use 4xx with structured codes (e.g., ACCOUNT_INSUFFICIENT_FUNDS, TRANSFER_LIMIT_EXCEEDED).

Banking APIs (required contracts)
Create OpenAPI skeletons for each of the following and place them under docs/api/:
- Authentication (docs/api/auth.yaml)
- Members (docs/api/members.yaml)
- Organizations (docs/api/organizations.yaml)
- Accounts (docs/api/accounts.yaml)
- Cards (docs/api/cards.yaml)
- Transactions (docs/api/transactions.yaml)
- ACH (docs/api/ach.yaml)
- Domestic Wire (docs/api/wire.domestic.yaml)
- International Wire (docs/api/wire.international.yaml)
- Zelle (docs/api/zelle.yaml)
- Bill Pay (docs/api/billpay.yaml)
- Investments (docs/api/investments.yaml)
- Crypto (docs/api/crypto.yaml)
- Notifications (docs/api/notifications.yaml)
- Statements (docs/api/statements.yaml)
- Documents (docs/api/documents.yaml)
- Verification Center (docs/api/verification.yaml)
- Trusted Devices (docs/api/trusted-devices.yaml)
- Audit Logs (docs/api/audit.yaml)
- Reports (docs/api/reports.yaml)
- Member Advisor (docs/api/member-advisor.yaml)
- AI Command Center (docs/api/ai-command-center.yaml)

Each banking API must document:
- Primary resources and identifiers
- Supported operations (CRUD, search, query semantics)
- Idempotency keys for write operations (Idempotency-Key header)
- Required audit fields and immutability guarantees where applicable
- Compliance-relevant notes (PCI/PCI-DSS, AML/KYC implications)

AI Command Center APIs
Document and provide OpenAPI endpoints that support ACC capabilities:
- AI Workspace (GET /v1/ai/workspace) — workspace metadata and entry points
- Action Catalog (GET /v1/ai/actions) — list of AI actions with metadata, deep-link templates, and required permission keys
- Permission Discovery (GET /v1/ai/permissions?actor={id}) — returns allowed actions for the caller
- Workflow Execution (POST /v1/ai/workflows/{workflowId}/execute) — start or resume guided workflows
- Context Detection (POST /v1/ai/context) — submit page/context to get structured context tokens
- Memory (GET/POST /v1/ai/memory) — read/write short-term/long-term memory objects (access-controlled)
- Prompt Templates (GET /v1/ai/prompts, POST /v1/ai/prompts/{id}/render)
- Conversation History (GET /v1/ai/conversations/{id}) — versioned conversation transcripts
- AI Suggestions (GET /v1/ai/suggestions) — asynchronous suggestions for the workspace
- AI Notifications (webhooks or SSE/WS) for long-running AI actions

API requirements for ACC
- Permission-aware responses: endpoints that return action lists must include permission metadata indicating why an action is allowed/denied.
- Deep linking: action catalog entries must include canonical deep-link templates (e.g., vantoris://accounts/{accountId}/transfer?prefill=... or web deep links /accounts/{id}/transfer?source=ai)
- Workflow definitions: workflows are first-class objects (YAML/JSON) and must be versioned.
- Async patterns: long-running AI jobs must support job polling (GET /v1/jobs/{id}) and webhooks for completion.

Universal Chat API
Define a single contracts set supporting the following resources and events under docs/api/chat.yaml:
- Conversations
  - Create conversation, list conversations, join/leave
- Messages
  - Send message (POST /v1/conversations/{id}/messages) with polymorphic payloads for text, media, contact, location, reactions, replies
- Media
  - Request upload URL (POST /v1/uploads) → returns signed URL and upload id
  - Confirm upload and attach to message
- Voice Notes
  - Upload flow same as media; metadata includes duration and waveform data optional
- Documents
  - Document metadata (content-type, size, hash, OCR status)
- Read receipts & typing indicators
  - Events: delivered, read, typing_start, typing_stop via WS/SSE/webhook
- Reactions
  - Add/remove reaction endpoints and reaction summary in message payload
- Replies & threading
  - message.reply_to reference and thread listing endpoints
- Message search
  - POST /v1/conversations/{id}/search with query and filters — server-side indexed and paginated
- AI Summaries
  - POST /v1/conversations/{id}/summaries to request AI-generated summary; results stored as message-type=summary
- Webhook & Events
  - Define event envelopes for message_received, message_updated, message_deleted, reaction_added, typing, read_receipt

Media & File Uploads
- Use presigned URLs for direct-to-storage uploads. Server validates file metadata after upload and stores metadata in DB.
- Virus scanning and PII detection pipeline must run asynchronously; message may initially be queued with a moderation state: pending -> safe | flagged
- Media metadata schema includes: id, url, contentType, size, width/height (if image), duration (if audio/video), encryption metadata, retention policy

Deep Links
- Standardize deep-links across platform. Canonical forms (examples):
  - Web: https://app.vantoris.com/{route}?deep_link_from=ai&dl_id={id}
  - Mobile: vantoris://{route}?dl_id={id}&source=ai
- Deep-linkable resources include: Members, Accounts, Cards, Transactions, Applications, Reports, Fraud Alerts, AI Actions, Notifications
- Deep-link contract must be documented in docs/api/deeplinks.yaml and included in Action Catalog entries for ACC.

Verification Center APIs
- Replace KYC endpoints with Verification Center contracts (docs/api/verification.yaml) covering:
  - Email verification (send token, confirm token)
  - Phone verification (SMS code, voice call) — support OTP and re-sends
  - Identity verification (submit identity documents, scan results, liveness checks)
  - Address verification (document or third-party service proof)
  - Income verification (structured income proofs, document uploads)
  - Business verification (UBO, business docs)
  - Trusted Device verification (device binding, approval flow)
- Each verification flow must expose status endpoints and webhook callbacks for third-party providers (e.g., /v1/verification/{id}/status).
- Verification states enumerated and canonicalized: Unverified, IdentitySubmitted, UnderReview, Verified, Failed.

Personalization APIs
- Profile endpoints must explicitly surface: FirstName, LastName, PreferredName fields (docs/api/members.yaml)
- Servers must not use or return email-derived usernames for display name fields. API schema must include validation rules for PreferredName length and allowed characters.

Audit & Observability
- Every sensitive endpoint (transfers, withdrawals, KYC changes, permission grants, AI action executions) must emit immutable audit events to the audit log service (docs/api/audit.yaml).
- Audit event payload includes: correlation_id, trace_id, actor_id, device_id, session_id, action, resource_id, before/after state (where applicable), timestamp.
- Correlation ID (X-Correlation-ID) must be propagated through async systems and included in logs and metrics.

Evidence & API Change Requirements
Every API change must include the following artifacts in the PR and release notes:
- OpenAPI update: modified docs/api/*.yaml file(s) with clear changelog section
- Contract tests: new or updated consumer-driven contract tests committed under tests/contract
- Migration notes: docs/MIGRATION_GUIDE.md or docs/api/migrations/<migration>.md describing DB or client migration steps
- Version impact: declare whether change is additive or breaking and list affected consumers
- Runtime verification: smoke test guidance and staging URL where the change was exercised

Pagination, Filtering, and Sorting
- Use cursor-based pagination for large lists (opaque cursor tokens). Offset pagination only for internal admin APIs and must be documented.
- Standardized filter parameters: filter[field]=value and filter[range]=start..end. Support server-side validation and limit-by-default.
- Sorting: sort=field1,-field2 (prefix - for descending)

Rate limiting and quotas
- Rate-limit headers: X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset
- Token-scoped quotas for high-cost endpoints (e.g., AI prompts, bulk exports). Documentation must explain quota model.

Security & Compliance notes
- Field-level encryption for card and payment details in storage; PCI-sensitive workflows must use tokenization.
- Sensitive logs redaction rules and retention policies in docs/SECURITY_STANDARDS.md.
- PII minimization: APIs must avoid returning unnecessary PII fields in list endpoints.

Testing and CI
- Place OpenAPI spec files in docs/api/ and wire contract tests into CI (see docs/CI_CD.md).
- CI must run OpenAPI validation, schema linting (spectral), and contract test verification for any changed API spec.

File locations and naming
- docs/api/*.yaml — canonical OpenAPI contracts
- docs/api/README.md — how to run contract tests and generate clients
- docs/api/migrations/*.md — migration notes per API change
- tests/contract/ — consumer-driven contract tests

Cross-references
- docs/CODING_STANDARDS.md — type safety and schema typing requirements
- docs/CI_CD.md — CI enforcement and evidence requirements
- docs/REPOSITORY_STANDARDS.md — AI/ACC and repo-level rules
- docs/VERIFICATION_CENTER.md — verification flows and vendor integration details (to be created)
- docs/SECURITY_STANDARDS.md — PII, encryption, and retention (to be created)

Next steps
- Create skeleton OpenAPI files for the banking and platform APIs under docs/api/ during migration or as part of API backlog. For now, this document prescribes filenames and expectations.

Notes
- Do NOT generate server code or clients in this document. This is a contract-first specification prepared for the Base44 import. After import, generate clients and enable contract tests as part of the CI onboarding process.

