---
name: MoveMoney architecture
description: Which features are implemented vs removed in MoveMoney.jsx
---

**Implemented (real backend workflows):**
- Internal Transfer → routes to /accounts
- Send Money → `Transaction.create` + `Notification.create`; 3-step form→review→receipt
- Request Money → `ServiceRequest.create` (type "Money Request") + Notification
- ACH Transfer → `WithdrawalRequest.create` (type "ach"); bank details JSON-stringified into `notes`
- Domestic Wire → `WithdrawalRequest.create` (type "wire"); wire details in `notes`
- International Wire → `WithdrawalRequest.create` (type "international_wire") + `ServiceRequest.create`; also creates notification
- Deposit Check → `ServiceRequest.create` (type "Check Deposit")
- Add Money / Withdraw Funds → route to /accounts

**Removed (no backend entity, spec says hide):**
- QR Code Payment, Pay Bills, Crypto Transfer, Currency Exchange
- Scheduled Transfers, Recurring Transfers, Beneficiaries (entire section removed)

**Why:** Spec says "hide features until backend support exists rather than displaying a placeholder." All implemented flows use the WithdrawalRequest, Transaction, ServiceRequest, and Notification entities which are confirmed in the Base44 backend.

**All wire/ACH panels** include form → review → confirm → receipt steps with audit logging via `logAuditEntry`.
