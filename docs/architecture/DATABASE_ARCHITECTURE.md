# Database Architecture — VANTORIS

Status: normative documentation-only. This file defines the logical database architecture, domain models, data ownership, lifecycle rules, and operational requirements for VANTORIS. It standardizes the platform on PostgreSQL and related infrastructure and is written to enable a low-friction migration of the Base44 production data and schema.

Important constraints
- This document is documentation-only. Do NOT generate SQL migrations or application code in this repo.
- The repository standard is to use node-pg-migrate for migrations once the Base44 export is imported.

Platform standards
- Primary RDBMS: PostgreSQL 16+
- Migration tooling: node-pg-migrate (JS/TS-friendly migration runner)
- Cache: Redis for session, rate-limiting, short-lived state
- Event streaming: Kafka (or equivalent) for domain events and ledger/eventing
- Object storage: S3-compatible (for media, documents, and long-term storage)
- High availability: Read replicas for read scaling
- Recovery: Point-in-Time Recovery (PITR) configured for all production clusters

Operational expectations
- All database schema changes must use migration scripts (node-pg-migrate) and be run in CI against ephemeral DBs before applying to staging.
- Backups: continuous WAL archiving + daily full backups; retention policy by compliance.
- Monitoring: slow query logging, connection pool metrics, index bloat alerts, and replication lag monitoring.

Core database domains (logical schemas and ownership)
Note: for each domain, we define logical entities, ownership, lifecycle, indexing guidance, and notes for migration compatibility.

1) Members (schema: members)
- Entities:
  - member_profile (id PK, first_name, last_name, preferred_name, email, phone, preferred_locale, timezone, created_at, updated_at, status)
  - member_credentials (id PK, member_id FK, password_hash, salt, last_password_change, mfa_methods)
  - member_settings (id PK, member_id FK, preferences JSONB)
  - member_contacts (address book entries)
- Ownership: Member service
- Lifecycle: profile created on onboarding; soft-delete pattern (deleted_at) with retention; PII retention and redaction rules applied per docs/SECURITY_STANDARDS.md
- Indexing: unique index on email (case-insensitive), indexes on phone, member_id FK indexes, partial indexes for active members
- Migration notes: ensure name fields exist (first_name, last_name, preferred_name) and that PreferredName is nullable; do not derive display_name from email

2) Organizations (schema: organizations)
- Entities: organization, organization_memberships, organization_roles, org_settings
- Ownership: Organizations service / admin
- Lifecycle: org created with owner, supports joint accounts and business KYC
- Indexing: org_id PK, indexes on external identifiers (tax id), search GIN on JSONB metadata

3) Accounts (schema: accounts)
- Entities: account (id, org_id?, member_id?, account_type, currency, status, created_at), account_balances (ledger balance snapshots), account_metadata
- Ownership: Account service / core banking
- Lifecycle: provisioned by onboarding or admin; status flow (provisioned → active → suspended → closed)
- Indexing: composite indexes for (member_id, account_type), partial index for active accounts
- Migration notes: map legacy account numbers carefully to new id scheme; preserve account numeric identifiers where regulatory references require it

4) Cards (schema: cards)
- Entities: card, card_pan_token (tokenized PAN), card_status, card_controls, card_limits
- Ownership: Card service
- Lifecycle: issuance → activation → suspend → revoke
- PCI note: PANs must never be stored in plaintext in DB; use tokenization and store metadata only; refer to docs/SECURITY_STANDARDS.md
- Indexing: index on card_token, account_id

5) Transactions & Payments (schema: transactions)
- Entities:
  - transaction (id, external_id, account_id, amount, currency, type, status, created_at, posted_at)
  - payment_instructions (ACH/wire/zelle/billpay metadata)
  - transaction_tags (for classification)
- Ownership: Transaction Engine / Payments
- Lifecycle: created → pending → posted → settled/reconciled or failed/reversed
- Indexing: index on account_id, created_at, external_id; partition by time (monthly) for high-volume tables

6) Double-Entry Ledger (schema: ledger)
- Immutable ledger tables are REQUIRED. The ledger is the source of truth for balances.
- Entities:
  - ledger_entries (id PK, entry_uuid, ledger_account_id, amount, debit_credit ENUM, currency, transaction_id FK, created_at, metadata JSONB)
  - ledger_balances (derived snapshots, materialized views for fast read)
  - ledger_accounts (accounting accounts mapped to business accounts)
- Requirements:
  - Every financial transaction MUST create balanced debit and credit entries as part of the same transactional boundary.
  - Use DB transactions to ensure atomicity; if distributed operations are required, use a transactional outbox pattern + event bus (Kafka) and idempotent processors.
  - Ledger entries are append-only. No updates/deletes to ledger_entries. Any correction must be represented as new compensating entries.
  - Transaction states: Pending, Posted, Reversed, Failed, Cancelled. Track status on both transaction and ledger entries where appropriate.
- Indexing: partition ledger_entries by time and/or by currency; index by transaction_id for traceability

7) ACH, Domestic Wire, International Wire, Zelle (schema: payments)
- Entities:
  - ach_instructions, ach_status, wire_instructions, wire_status, zelle_messages
- Ownership: Payments service(s)
- Lifecycle: instruction created → cleared/settled → settled/reconciled or failed
- Compliance: maintain NACHA/OFAC/sanctions flags in instruction metadata; ensure immutable audit trail
- Indexing: index by routing number, external_reference, settlement_date

8) Investments (schema: investments)
- Entities: portfolios, positions, orders, executions, market_data_snapshots
- Ownership: Investments service
- Lifecycle: order → execution → settlement; positions updated via ledger entries where applicable
- Indexing: index by portfolio_id, symbol, date; consider time-series storage for market data

9) Crypto (schema: crypto)
- Entities: wallets, wallet_addresses, crypto_transactions, custody_events
- Ownership: Crypto service
- Security: private keys managed by custody provider or HSM; database stores references/tokens only
- Lifecycle: deposit → pending → confirmed → settled; withdrawals require multi-step confirmations
- Indexing: index by wallet_id, tx_hash

10) Verification Center (schema: verification)
- Entities: verification_requests (id, member_id, type(enum), status(enum), provider, provider_payload JSONB, results JSONB, created_at, updated_at), verification_documents
- Types: identity, address, email, phone, income, business, trusted_device
- Status enums: Unverified, IdentitySubmitted, UnderReview, Verified, Failed
- Ownership: Verification service
- Indexing: index by member_id, status, created_at

11) Trusted Devices (schema: devices)
- Entities: trusted_devices (device_id PK, member_id FK, device_name, device_type, os, browser, ip_address, location JSONB, trust_date, last_active, current_status enum, removed_date, approval_method, audit_reference_id)
- Ownership: Security service
- Rules:
  - Allow maximum of two active trusted devices; adding a third requires removing one existing device (or approval flow)
  - Maintain history: never fully delete trusted device records; soft-delete or mark removed_date
- Indexing: index by member_id, device_id; partial index for current_status = 'trusted'

12) Notifications (schema: notifications)
- Entities: notification_queue, notification_channels, notification_history
- Ownership: Notification service
- Lifecycle: queued → delivered | failed; retries with backoff
- Indexing: target_member_id, status, scheduled_at

13) Chat (schema: chat)
- Entities:
  - conversations (id, type, last_message_at, metadata JSONB)
  - conversation_members (conversation_id, member_id, role)
  - messages (id, conversation_id, sender_id, body, message_type, metadata JSONB, created_at, edited_at)
  - attachments (id, message_id, storage_url, content_type, size, metadata)
  - reactions (id, message_id, member_id, reaction_type, created_at)
  - read_receipts (message_id, member_id, read_at)
  - typing_events (conversation_id, member_id, started_at)
  - message_search_index (materialized/indexed for search)
- Ownership: Chat service / Member Advisor
- Media: store attachments metadata in DB; binary content in S3. Use object_versioning for provenance.
- Indexing: index messages by conversation_id, created_at; full-text search indexes (GIN) on message body; consider external search service for heavy queries

14) AI Data Model (schema: ai)
- Entities:
  - ai_conversations (id, owner_id, context JSONB, created_at)
  - ai_messages (id, conversation_id, role, content, tokens_estimate, created_at)
  - ai_memory (id, owner_id, namespace, key, value JSONB, vector_id?)
  - ai_actions (id, name, description, permission_key, action_schema JSONB)
  - ai_workflows (id, version, definition JSONB/ YAML reference)
  - ai_prompts (id, template, version, metadata)
  - ai_execution_history (id, action_id, inputs JSONB, outputs JSONB, status, started_at, completed_at)
  - ai_summaries (id, conversation_id, summary_text, generated_at)
- Ownership: AI/Member Advisor services
- Permissions: ai_actions must reference permission descriptors; permission checks enforced at execution time
- Indexing: index by owner_id, conversation_id; if using vector DB for embeddings, store references to vector_id and use external vector index for similarity search

15) Audit Logs (schema: audit)
- Entities:
  - audit_events (id PK, actor_id, user_id, session_id, device_id, ip_address, correlation_id, trace_id, action, resource_type, resource_id, before_state JSONB, after_state JSONB, timestamp, source_service)
- Ownership: Central audit/logging service (write-once)
- Requirements: immutable, append-only, tamper-evident storage; forward to an immutable event store as required (WORM or secure storage for compliance)
- Indexing: index by resource_id, actor_id, timestamp

16) Reports (schema: reports)
- Entities: report_definitions, report_runs, report_results (stored as files in S3 with metadata in DB)
- Ownership: BI / Reports service
- Lifecycle: definition → scheduled run → persisted result (S3) with run metadata

17) Documents (schema: documents)
- Entities: documents (id, owner_id, type, storage_url, content_hash, metadata JSONB, ocr_text, created_at)
- Ownership: Document service
- Security: encrypted at rest; PII classification flags; retention/archival rules

18) Support & Member Advisor (schema: support)
- Entities: tickets, ticket_messages (backed by conversations), ticket_status, ticket_assignments
- Ownership: Support / Member Advisor
- Integration: ticket messages surface in Member Advisor; cross-reference conversation ids

Entity relationships & ownership summary
- Each domain owns its schema and publishes canonical APIs and migration scripts.
- Cross-domain references use stable IDs (UUIDs) and foreign keys where appropriate; where strong decoupling is required, use event references (event sourcing / outbox pattern).

Indexing strategy
- Use compound indexes for common query patterns (eg. (member_id, created_at DESC)).
- Use partial indexes for common filters (status = 'active').
- Partition high-volume tables (ledger_entries, transactions, messages) by time (monthly) and optionally by tenant for multi-tenant scale.
- Use GIN indexes for JSONB where queries search within metadata and tsvector + GIN for full-text search.

Partitioning & archival
- Partition ledger_entries and messages by time (monthly or weekly depending on volume).
- Archive older partitions to cold storage (S3) after retention window; maintain summarized materialized views for reporting.

Connection pooling & scaling
- Use a connection pooler (PgBouncer) in transaction-pool mode for high-concurrency services.
- Enforce maximum connections per service and monitor pool saturation.

Read replicas & PITR
- Configure read replicas for heavy read workloads (dashboards, reporting).
- Enable PITR for the primary cluster with WAL archiving and test point-in-time restores periodically.

Backup & Disaster Recovery
- Continuous WAL archiving + daily full backups.
- Offsite backup copies and retention per compliance.
- Automated DR runbooks for failover to replica or restore to new cluster.

Encryption & key management
- All sensitive fields encrypted at rest via TDE or column-level encryption using KMS (AWS KMS, HashiCorp Vault, or equivalent).
- Use envelope encryption for large documents and S3 objects; store keys in a managed KMS and rotate keys according to policy.

Data retention, redaction, and privacy
- Define retention windows per data type in docs/SECURITY_STANDARDS.md (PII, transaction history, audit logs).
- Implement redaction or pseudonymization pipelines for PII before exporting to analytics systems.

Eventing and eventual consistency
- Use transactional outbox pattern to publish domain events to Kafka for cross-service consistency.
- Consumers should be idempotent; use message keys (UUIDs) and store last-processed offsets where applicable.

Multi-tenancy model
- Support tenancy via one of two options (choose during implementation):
  1. Shared schema with tenant_id column (simpler, requires row-level security and tenant-aware indexing)
  2. Schema-per-tenant or DB-per-tenant (better isolation but operationally heavier)
- Recommended: start with shared schema + row-level security (RLS) on Postgres for tenant isolation, with clear policies and audit logs.

Session security model
- Sessions stored in Redis with session_id and device_id association.
- Max two trusted devices per account; session lifecycle enforced at application layer and audit recorded in trusted_devices table.
- Inactivity lock: 2 minutes lock UI; 5–10 minutes full session termination depending on risk profile.
- High-risk actions require re-authentication (fresh MFA) — endpoints must validate fresh_auth flag in session or require challenge flow.

Schema migration & Base44 compatibility
- Design schemas to minimize friction when importing Base44: preserve core entity names and IDs where possible.
- Use node-pg-migrate for migration scripts after import. When mapping legacy tables, prefer renames and additive changes rather than destructive transforms.
- Provide an import plan (docs/MIGRATION_GUIDE.md) that lists table mapping, ID transformations, and reconciliation steps. The migration guide will be authored as a separate document.

Testing and CI for DB changes
- All migration scripts must run against ephemeral Postgres instances in CI (Testcontainers or dedicated test DB) before merging.
- Add integration tests that exercise ledger balancing and end-to-end payment flows in staging.

Governance, auditability, and immutability
- Ledger and audit tables are append-only. Use database privileges and code review to prevent accidental DDL that would drop or modify historical data.
- Maintain WORM-like storage for archive partitions when required for compliance.

Recommendations before next document
1. Decide on tenancy strategy (shared schema + RLS recommended) so subsequent documents (RBAC, infra) can reference a concrete model.
2. Provision a staging Postgres 16+ cluster with PITR and WAL archiving to validate migration steps during Base44 import.
3. Create a node-pg-migrate starter template and migration-testing pipeline to validate migration scripts in CI after Base44 import (do not add now).
4. Define retention/archival policies in docs/SECURITY_STANDARDS.md and map them to legal/compliance requirements.

Gaps & dependencies discovered
- No existing DB schemas or migration scripts are present in this repository — these will arrive with the Base44 export.
- Security standards (PII, encryption, retention) and verification center vendor integration details are referenced but not yet present; create docs/SECURITY_STANDARDS.md and docs/VERIFICATION_CENTER.md next.
- Vector DB or embedding storage decisions for AI memory are not yet made; this doc references external vector indices as optional and requires a decision during implementation.
- Choice of message search engine (Postgres full-text vs external search like Elasticsearch/OpenSearch) is undecided — heavy message volumes suggest using an external search index for scalability.

Cross-references
- docs/REPOSITORY_STANDARDS.md
- docs/CODING_STANDARDS.md
- docs/API_ARCHITECTURE.md
- docs/CI_CD.md
- docs/SECURITY_STANDARDS.md (to be created)
- docs/MIGRATION_GUIDE.md (to be created)
- docs/VERIFICATION_CENTER.md (to be created)

Files created by this commit
- docs/DATABASE_ARCHITECTURE.md

This is a documentation-only commit. No SQL or application code generated.
