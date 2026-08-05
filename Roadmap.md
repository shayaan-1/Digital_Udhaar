# Implementation Roadmap
## Distributor Credit Intelligence Platform — Phased Delivery Plan

**Prepared as:** Senior PM / Technical Architect view for a resource-constrained solo/small team
**Stack:** FastAPI (backend) · Next.js (frontend) · PostgreSQL (database) · Redis + Celery (background jobs)
**Guiding principle:** Ship the smallest thing a distributor will pay for, then layer automation, credit intelligence, collaboration, and hardening on top — in that order. Every phase is a shippable, sellable increment, not an internal milestone.

**What changed from the original roadmap, and why:**
- Phase 2 is no longer "WhatsApp automation." It's now **channel-agnostic collections messaging**, SMS-first, with WhatsApp as an optional adapter — removing the single external-dependency blocker that stalled the original plan.
- A **Minimum-Viable Risk Engine (Phase 2.5)** is pulled forward from the old Phase 5. It's the product's actual differentiator versus existing distribution/ledger software, and it only needs real transaction history — which exists as soon as Phase 1 is live — not the full multi-user/audit stack first.
- Phases 3, 4, and 6 are structurally unchanged from the original plan; only the terminology (retailer instead of generic "customer," distributor instead of generic "business") and a few report/dashboard additions reflect the new positioning.
- Nothing in Phase 1's schema or backend changes. This roadmap builds on top of what's already shipped.

---

## How to Read This Document

For every phase:
1. **Business goal** — why this phase exists commercially
2. **Why it's sequenced here** — dependency and risk logic
3. **Included / Excluded features** — explicit scope fence
4. **Epic → User Story → Dev Task breakdown** — with complexity (S/M/L) and dependencies
5. **Parallelization guidance** — for a 1 backend + 1 frontend (+1 full-stack occasionally) team
6. **Build order** — DB → Backend → Frontend → Integrations

Complexity legend: **S** = <1 day, **M** = 1–3 days, **L** = 3–7 days (single engineer, MVP quality).

---

# Phase 1 — Core Ledger (Shipped)

### Status
Already built. No changes required by the repositioning — the schema (`businesses`, `users`, `customers`, `transactions`, the shared transaction-creation service, the reversal model, idempotency keys, and the `fn_apply_transaction_to_customer` trigger) is fully reusable as-is. "Customer" in the schema/code maps to "Retailer" in the product-facing language; this is a labeling change in the UI copy only, not a data model change.

### Recap of what exists
- Distributor (business) profile setup
- Retailer (customer) management: CRUD, archive-not-delete, credit info, system-generated fields
- Ledger transactions: Credit Sale, Payment, Adjustment (increase/decrease), Opening Balance — immutable, reversal-only corrections
- Credit sale flow with credit-limit warning
- Payment recording flow (incl. overpayment → credit balance)
- Retailer ledger view with date/type filters
- Minimal dashboard (today's sales/payments, total outstanding, total retailers)
- Core validation rules, basic auth, password hashing, HTTPS

### Nothing to build here — this phase is the foundation everything below reads from and writes through.

---

# Phase 2 — Multi-Channel Collections Messaging

### Business Goal
Turn the ledger into an active recovery tool without repeating the mistake of making the entire product depend on WhatsApp Business API approval. SMS becomes the default channel — near-universal delivery on any handset, no approval lead time, low per-message cost — with WhatsApp added later as an optional richer channel.

### Why This Comes Before Phase 2.5/3
- Reminders are still the highest-leverage collections lever available immediately after the ledger — it just needs to not be gated on external API approval.
- Building the channel abstraction now (rather than hard-coding WhatsApp) is a one-day decision today and a rewrite later if skipped — this is the single most important architectural correction from the original plan.
- Statement-sharing (Phase 3) and later notification triggers (Phase 5) both reuse whatever messaging client abstraction is built here, so getting the interface right pays off twice.

### Included
- Channel-agnostic `NotificationChannel` interface (`send(recipient, message) -> status`)
- SMS adapter (primary/default channel) — e.g., a local telco gateway or Twilio SMS
- WhatsApp adapter (optional, added when/if Business API approval comes through) — same interface, swapped in without touching scheduler or template logic
- Configurable reminder templates with variable substitution
- Manual reminder flow (Owner/Staff-triggered, single retailer)
- Scheduled reminder flow (rule-based, Celery Beat)
- Reminder delivery logging (sent/delivered/failed) per channel
- Staff note on reply outcome (promised payment, disputed, wrong number, follow-up)

### Excluded
- Two-way conversational AI / auto-reply handling
- Voice/IVR channel (structurally trivial to add later given the abstraction, but not needed for MVP)
- Notification framework for reminder failures — reuses Phase 5's future notification table, not built standalone here

---

## Feature: Notification Channel Abstraction

**Epic 2.1 — Channel-Agnostic Messaging Layer**

- **Story:** As the system, I need a single interface for sending messages so the product isn't tied to one vendor.
  - Tasks:
    - [BE] `NotificationChannel` abstract interface + `ChannelType` enum (`sms`, `whatsapp`) — **S**
    - [DB] `reminder_log` table includes a `channel` column from day one (not retrofitted later) — **S**
    - [BE] `SMSClient` adapter (send message, webhook/poll for delivery status if provider supports it) — **M**
    - [BE] `WhatsAppClient` adapter — built to the same interface, wired in only once provider approval exists; can ship weeks later with zero changes to scheduler/template code — **M** (deferred until approval is in hand)
  - Dependencies: none technically; this is the first thing built in Phase 2 specifically because everything else in this phase and later phases calls into it
  - **Risk flag carried over, correctly de-risked now:** WhatsApp approval can proceed in parallel with everything else in this phase without blocking any of it.

---

## Feature: Reminder Templates

**Epic 2.2 — Template Configuration**

- **Story:** As an Owner, I want to customize the reminder message with dynamic variables.
  - Tasks:
    - [DB] `reminder_templates` table (business_id, name, body_text, is_default) — **S**
    - [BE] Template CRUD + variable-substitution engine (`{{retailer_name}}`, `{{business_name}}`, `{{outstanding_amount}}`, `{{due_date}}`, `{{payment_instructions}}`) — **M**
    - [FE] Template editor with live preview using sample data — **M**
  - Dependencies: `businesses` (Phase 1)

---

## Feature: Manual Reminder Flow

**Epic 2.3 — Send Reminder Now**

- **Story:** As an Owner/Staff, I want to preview and send a reminder to one retailer on demand, through whichever channel is configured as default.
  - Tasks:
    - [BE] `POST /customers/{id}/reminders/send` — renders template, calls the configured `NotificationChannel`, writes `reminder_log` with channel used — **M**
    - [FE] "Send Reminder" button on retailer profile → preview modal → confirm/send — **M**
    - [FE] Reminder history tab on retailer profile (date, time, user, template, channel, status) — **M**
  - Dependencies: Epics 2.1, 2.2

---

## Feature: Scheduled Reminder Flow

**Epic 2.4 — Reminder Rules & Automation**

- **Story:** As an Owner, I want a rule ("remind 7 days after invoice, every 3 days, stop after payment, max 5 reminders") that runs automatically.
  - Tasks:
    - [DB] `reminder_rules` table (business_id, days_after_invoice, frequency_days, stop_after_payment, max_reminders, active, preferred_channel) — **S**
    - [BE] Rule CRUD endpoints — **S**
    - [FE] Rule builder UI (incl. channel selection) — **M**
  - Dependencies: Epic 2.2

- **Story:** As the system, I want a scheduler that evaluates all active rules daily and dispatches qualifying reminders through the right channel.
  - Tasks:
    - [Infra] Redis + Celery worker + Celery Beat — **M**
    - [BE] Celery Beat periodic task (`run_reminder_scheduler`, daily) — queries retailers matching rule criteria (overdue days, reminder count < max, outstanding > 0) — **L**
    - [BE] Skip logic: no reminder when outstanding balance is zero — **S**
    - [BE] Idempotency guard (uses the `idempotency_key` column already added to `transactions`; mirror the same pattern for reminder dispatch) — **S**
  - Dependencies: Epic 2.1 (channel abstraction), Phase 1 transaction/balance data, Epic 2.4 rule storage

**Parallelization:** Redis/Celery infra setup can happen in parallel with template + manual-send work — different engineer, converging only at the scheduler task itself.

---

## Feature: Reply / Outcome Tracking

**Epic 2.5 — Delivery & Outcome Tracking**

- **Story:** As an Owner, I want to log what happened after a reminder since auto-reply parsing is out of scope.
  - Tasks:
    - [BE] `PATCH /reminder-log/{id}/note` — **S**
    - [FE] Note dropdown on reminder history row — **S**
  - Dependencies: Epic 2.3

---

### Phase 2 Build Order
1. **Backend:** Channel abstraction (`NotificationChannel`) → SMS adapter → template engine → manual send endpoint → Celery/Redis infra → scheduled task → (WhatsApp adapter whenever approval lands, in parallel, non-blocking)
2. **Database:** `reminder_templates` → `reminder_log` (with `channel` column from the start) → `reminder_rules`
3. **Frontend:** Template editor → manual send UI → reminder history → rule builder

### Phase 2 Parallelization
- Engineer A: SMS integration + Celery/Redis infra + scheduler (critical path, no external approval dependency)
- Engineer B: Template editor + manual reminder UI (built against the `NotificationChannel` interface, channel-blind)
- WhatsApp Business API approval process can be kicked off on day one and slotted in whenever it clears, without blocking ship date

---

# Phase 2.5 — Minimum-Viable Credit Risk Engine (pulled forward)

### Business Goal
This is the product's actual differentiator versus every existing ledger/distribution tool in this market: a live, per-retailer risk signal, not a static credit limit or an after-the-fact aging report. It needs to exist as early as possible because it's the reason a distributor pays a premium over "just a ledger."

### Why This Comes Before Phase 3/4
- The scoring inputs (payment delay, outstanding amount, credit utilization, overdue invoice count) are available from Phase 1 transaction data alone — it does not need Phase 2's reminder history to produce a useful first version (a fuller version, refined with reminder-response data, can follow in Phase 5).
- Every week this ships later is a week of "just a ledger with SMS reminders" — exactly the commodity position competitors already occupy. Shipping even a basic version early changes the sales conversation from day one of the pilot.
- This is a clean example of building the stub now and filling it in later rather than the reverse: the full version (Phase 5) extends this rather than replacing it.

### Included
- Basic risk-scoring service (pure function): inputs → score + level (Low/Medium/High)
- Hook into the existing shared transaction-creation service (single choke point, per Phase 1's design) so score recalculates on every transaction with no separate write path
- Risk badge + recommendation shown on the Credit Sale flow (already stubbed in Phase 1's `credit-sale-context` endpoint) and on the retailer profile
- Nightly Celery batch recalculation as a safety net

### Excluded
- Reminder-response-derived signals (needs Phase 2's history to mature) — added in Phase 5
- ML/predictive scoring — explicitly future work
- Notification triggers on risk level change — needs Phase 5's notification framework

---

## Feature: Risk Scoring (MVP)

**Epic 2.5.1 — Basic Risk Engine**

- **Story:** As the system, I want to recalculate a retailer's risk score after every transaction.
  - Tasks:
    - [DB] `customer_risk_metrics` table (customer_id, risk_score, risk_level, avg_payment_delay, total_overdue_amount, last_calculated_at) — separate table, not columns bolted onto the hot `customers` row — **S**
    - [BE] Risk-scoring service: pure function `(avg_payment_delay, outstanding_amount, credit_utilization, overdue_invoice_count) → (score, level)` — **M**
    - [BE] Hook risk recalculation into the Phase 1 transaction-creation service — **M**
    - [BE] Celery nightly batch recalculation (safety net for any missed triggers) — **S**
  - Dependencies: Phase 1 `transactions` table (already exists and is sufficient on its own for this version)

- **Story:** As Staff, I want to see the retailer's risk level and recommendation before completing a credit sale.
  - Tasks:
    - [BE] Extend `GET /customers/{id}/credit-sale-context` (already stubbed with a placeholder in Phase 1) with real risk data — **S**
    - [FE] Risk badge + recommendation banner on Credit Sale form — **S**
  - Dependencies: Epic 2.5.1 scoring service

**Parallelization:** Fully independent of Phase 2's messaging work — can be built by a second engineer in parallel, converging only in the dashboard (Phase 3) and notifications (Phase 5) later.

---

### Phase 2.5 Build Order
1. **Database:** `customer_risk_metrics`
2. **Backend:** Scoring function → hook into transaction service → nightly batch job → extend credit-sale-context endpoint
3. **Frontend:** Risk badge on Credit Sale form, risk indicator on retailer profile

---

# Phase 3 — Statements, Ledger Export & Reports

### Business Goal
Give the distributor professional, shareable documents — this is what makes the tool feel credible enough to send to retailers and to use for the distributor's own reconciliation. It also starts surfacing collections ROI now that Phase 2 reminder activity and Phase 2.5 risk data both exist.

### Why This Comes Before Phase 4/5
- Statements and reports are read-only projections of existing ledger, reminder, and risk data — zero new write-paths, low risk, fast to build, and a visible jump in product maturity.
- Building this before multi-user/staff roles avoids retrofitting permission checks into every report/export endpoint twice.
- Doing this after the risk engine (not before, as in the original plan) means the Overdue Report and Collection Summary can be built with risk-level columns from the start instead of being retrofitted.

### Included
- PDF generation for retailer statements, with distributor branding
- PDF + Excel export for ledger view
- Reports: Outstanding Retailers, Payments Received, Sales Report, Overdue Report (risk-level aware), Collection Summary, Retailer Ledger Report
- Report filters (date, retailer, amount range) + PDF/Excel export
- Statement sharing via the Phase 2 `NotificationChannel` abstraction (SMS link or WhatsApp, not hard-coded)

### Excluded
- Staff-level access to reports (Phase 4 — permission gating)
- Reminder-response-derived risk refinements (Phase 5)

---

## Feature: Retailer Statement

**Epic 3.1 — Statement Generation**

- **Story:** As an Owner, I want to generate a PDF statement for a retailer for any date range.
  - Tasks:
    - [BE] `GET /customers/{id}/statement?date_from&date_to` — opening balance, transactions in range, closing balance — **M**
    - [BE] PDF rendering service (WeasyPrint/Playwright-to-PDF) with distributor branding — **L**
    - [FE] "Generate Statement" modal with date range picker + preview — **M**
  - Dependencies: Phase 1 ledger data, Phase 1 business profile (branding)

- **Story:** As an Owner, I want to share a statement directly through whichever reminder channel is active.
  - Tasks:
    - [BE] Statement PDF upload to storage + shareable link generation — **M**
    - [BE] Reuse the Phase 2 `NotificationChannel` abstraction to send the document link (works whether the active channel is SMS or WhatsApp) — **S**
    - [FE] "Share" button (channel-agnostic label, not "Share via WhatsApp") — **S**
  - Dependencies: Epic 2.1 (channel abstraction), Epic 3.1 PDF generation

---

## Feature: Ledger Export

**Epic 3.2 — Ledger PDF/Excel Export**

- **Story:** As an Owner, I want to export the filtered retailer ledger view.
  - Tasks:
    - [BE] `GET /customers/{id}/ledger/export?format=pdf|xlsx` (reuses PDF service; Excel via `openpyxl`) — **M**
    - [FE] Export button on ledger view (respects active filters) — **S**
  - Dependencies: Epic 1.5 (Phase 1 ledger view), Epic 3.1 PDF service

---

## Feature: Reports Module

**Epic 3.3 — Standard Reports**

- **Story:** As an Owner, I want an Outstanding Retailers report.
  - Tasks:
    - [BE] `GET /reports/outstanding-customers?date&amount_min&amount_max` — **M**
    - [FE] Report table + shared filter bar component (reused across all reports) — **M**
  - Dependencies: Phase 1 data

- **Story:** As an Owner, I want Payments Received, Sales, Overdue, Collection Summary, and Retailer Ledger reports — with the Overdue Report and Collection Summary including risk level per retailer.
  - Tasks:
    - [BE] 5× report query endpoints, Overdue Report and Collection Summary joined against `customer_risk_metrics` — **L** total
    - [FE] Reuse report table/filter shell for each — **M** total
  - Dependencies: Epic 3.3 shared filter component, Phase 2.5 risk data

- **Story:** As an Owner, I want to export any report to PDF/Excel.
  - Tasks:
    - [BE] Generic export wrapper around report query results — **M**
    - [FE] Standardized export button across all report screens — **S**
  - Dependencies: Epic 3.2 PDF/Excel infra (reused, not rebuilt)

**Parallelization:** Once the shared filter component and export wrapper exist, the 6 reports are near-identical in shape and split cleanly across 2 engineers.

---

### Phase 3 Build Order
1. **Backend:** PDF rendering service → Statement endpoint → Ledger export → Report query endpoints (generic export wrapper built once, reused everywhere)
2. **Frontend:** Statement modal → Ledger export button → Shared report table/filter shell → 6 report pages
3. **Database:** No new tables required beyond an optional `statement_shares` table if link expiry/tracking is desired
4. **Integrations:** Reuses Phase 2's `NotificationChannel`; new PDF library integration

---

# Phase 4 — Multi-User Collaboration (Staff Roles + Permissions + Audit Log)

### Business Goal
Unlock distributors with counter staff and field salesmen — essentially every real distributor above a one-person operation. This converts the product from a single-owner tool into a team tool, materially increasing willingness to pay.

### Why This Comes Before Phase 5/6
- Introducing staff accounts before the risk engine's full version and notifications means permission checks only need to be retrofitted once, across Phases 1–3, rather than designed twice.
- The audit log is far more valuable once there's more than one actor — with staff and salesmen entering data, "who recorded this payment" is essential for trust and dispute resolution, a known pain point in this specific ICP.
- Intentionally not earlier: a single-owner pilot doesn't need staff accounts to prove the ledger/reminders/risk-score value; adding multi-user complexity earlier would have slowed the highest-value phases down.

### Included
- Staff role with configurable permissions (create retailers, record sales/payments, view ledger, send reminders manually)
- Owner/Manager/Staff role model
- User invite, disable, password reset, permission assignment
- Full audit log (login, retailer creation, sales, payments, reminder sent, user changes, settings changes)
- **New consideration for this ICP:** if field data-entry by salesmen turns out to be real (validate in pilot interviews), a lightweight "assigned retailers per staff member" grouping — not a full route/PJP system, just enough to scope what a salesman sees

### Excluded
- Fine-grained per-retailer permission scoping beyond assigned-retailer grouping
- Full route/PJP planning, GPS tracking (that's DMS-breadth territory, explicitly out of scope — see Phase 6 non-goals)
- SSO/2FA

---

## Feature: Staff Roles & Permissions

**Epic 4.1 — Role Model**

- **Story:** As an Owner, I want to invite a staff member with a defined permission set.
  - Tasks:
    - [DB] Extend `users` with `permissions` JSONB column (role enum already exists from Phase 1) — **S**
    - [BE] `POST /users/invite` (email invite token flow) — **M**
    - [BE] Permission-check dependency/decorator applied to existing Phase 1–3 endpoints — **L** (retrofit across many endpoints, budget accordingly)
    - [FE] User invite form + permission checkbox matrix — **M**
  - Dependencies: Phase 1 `users` table
  - **Note:** largest single task in the roadmap — touches nearly every existing write endpoint; schedule with buffer.

- **Story:** As an Owner, I want to disable a user or reset their password.
  - Tasks:
    - [BE] `POST /users/{id}/disable`, `POST /users/{id}/reset-password` — **S**
    - [FE] User management table with actions — **M**
  - Dependencies: Epic 4.1 role model

- **Story:** As Staff, I want my UI to only show actions I'm permitted to perform.
  - Tasks:
    - [FE] Global permission-aware component wrapper — **M**
  - Dependencies: BE permission decorator returning permission set on login

- **Story (conditional on pilot findings):** As a salesman, I want to only see retailers assigned to my route.
  - Tasks:
    - [DB] `assigned_customers` join table or a simple `assigned_staff_id` column on `customers` — **S**
    - [BE] Scope retailer list/ledger queries by assignment for staff role — **S**
    - [FE] Filter retailer list by "my retailers" — **S**
  - Dependencies: Epic 4.1 — **only build this if pilot interviews confirm field-entry-by-salesman is the real workflow; skip if owners/counter staff enter data centrally.**

---

## Feature: Audit Log

**Epic 4.2 — Full Audit Trail**

- **Story:** As an Owner, I want an immutable log of all significant actions.
  - Tasks:
    - [DB] `audit_log` table (user_id, action, entity_type, entity_id, timestamp, metadata JSONB) — **S**
    - [BE] Audit-writing middleware/decorator on: login, retailer creation, sales, payments, reminder sent, user changes, settings changes — **L** (do this in the same pass as the permission retrofit, endpoint-by-endpoint)
    - [FE] Audit log viewer (filterable by user, action, date) — **M**
  - Dependencies: Epic 4.1

**Parallelization:** Permission retrofit and audit-log retrofit touch the same endpoints — do both in a single pass per endpoint, one engineer working through them while a second builds the two new UI screens against contract stubs.

---

### Phase 4 Build Order
1. **Database:** `users` extension → `audit_log` → (conditional) `assigned_customers`
2. **Backend:** Invite/disable/reset endpoints → permission decorator → single sweep across existing endpoints adding both permission checks and audit writes
3. **Frontend:** User management screen → permission-aware UI wrapper → audit log viewer → (conditional) "my retailers" filter
4. **Integrations:** Minimal transactional email for invites (if not already built in Phase 1's password reset)

---

# Phase 5 — Full Intelligence Layer (Risk Engine v2 + Notifications + Advanced Analytics)

### Business Goal
Extend the Phase 2.5 risk-score MVP into a fuller signal using reminder-response history, and layer proactive notifications on top of events already being generated across Phases 1–4. This is where the product moves from "flags risk" to "actively surfaces what needs attention," strengthening retention and justifying premium pricing.

### Why This Comes After, Not Before
- The richer inputs (reminder-response patterns, not just raw payment delay) only become meaningful after Phase 2 has been running for real weeks — this is why the *basic* version shipped in Phase 2.5 instead of waiting for this phase.
- Notifications are naturally layered on top of events already generated by Phases 1–4 (large sale, large payment, credit limit exceeded, reminder failure, high risk) — no new event sources needed, just new subscribers.
- Positioned after multi-user support (Phase 4) so notifications and risk-based recommendations can be scoped to the right recipients (e.g., only Owner/Manager sees risk recommendations, not all staff).

### Included
- Risk scoring refined with reminder-response signals (promised-but-not-paid patterns, dispute frequency)
- Notification system (large payment, large sale, credit limit exceeded, reminder failure, high-risk retailer detected)
- Expanded dashboard analytics (collection rate, avg payment delay, monthly trend, top outstanding, overdue/high-risk retailer lists)

### Excluded
- Predictive/ML-based cash-flow forecasting
- AI collection assistant

---

## Feature: Risk Engine v2

**Epic 5.1 — Refined Risk Scoring**

- **Story:** As the system, I want to incorporate reminder-response patterns into the risk score.
  - Tasks:
    - [BE] Extend the Epic 2.5.1 scoring function with reminder-outcome inputs (promised-payment-not-honored count, dispute count) from `reminder_log` — **M**
    - [BE] Re-run nightly batch recalculation with the extended function — **S**
  - Dependencies: Phase 2.5 scoring service, Phase 2 reminder history (needs real weeks of data to be meaningful)

---

## Feature: Notifications

**Epic 5.2 — Owner Notification System**

- **Story:** As an Owner, I want to be notified of significant events without checking the dashboard constantly.
  - Tasks:
    - [DB] `notifications` table (business_id, type, message, entity_id, read_at, created_at) — **S**
    - [BE] Notification-writing hooks: payment recorded (> threshold), credit sale recorded (> threshold), credit limit exceeded, reminder send failure, risk level → High — **M**
    - [BE] `GET /notifications`, `POST /notifications/{id}/read` — **S**
    - [FE] Notification bell + dropdown + unread badge — **M**
    - [BE] Configurable thresholds in business settings — **S**
  - Dependencies: Epic 5.1 (high-risk trigger), Phase 2 channel/webhook (failure trigger), Phase 1 transaction service (threshold triggers)

**Parallelization:** Risk engine v2 (5.1) and notification plumbing (5.2) can be built by two engineers in parallel — notifications only need an event, not the risk engine itself, except for the "high risk detected" trigger, the one integration point between the two epics.

---

## Feature: Advanced Dashboard Analytics

**Epic 5.3 — Dashboard v2**

- **Story:** As an Owner, I want collection rate, average payment delay, monthly trend, and a high-risk retailer list visualized.
  - Tasks:
    - [BE] `GET /dashboard/analytics` (collection rate, monthly trend time-series) — **M**
    - [FE] Chart components (trend line, collection rate gauge) — **M**
    - [FE] Top Outstanding + Overdue + High-Risk Retailer widgets (reuses Phase 3 report queries and Phase 5.1 risk data) — **S**
  - Dependencies: Phase 3 report queries, Epic 5.1 risk data

---

### Phase 5 Build Order
1. **Database:** Extend `customer_risk_metrics` usage → `notifications`
2. **Backend:** Risk-scoring v2 → notification hooks → dashboard analytics endpoint
3. **Frontend:** Refined risk display → notification bell → dashboard v2 widgets/charts
4. **Integrations:** None new — entirely internal computation on existing data

---

# Phase 6 — Onboarding Efficiency & Hardening (Data Import, Settings, Search, Security)

### Business Goal
Reduce friction for distributors switching from notebooks/Excel (bulk import), round out configurability, and harden the system for scale now that the core product is proven. This is the phase optimizing for sales conversion and operational trust.

### Why This Comes Last
- Data import is only worth building once the target schema is fully stable — building earlier risks rework every time an earlier phase adds a column.
- Full global search (across invoices/ledger, not just retailer name) is a quality-of-life feature best prioritized after the core workflows it searches into all exist.
- Security hardening is appropriately a "before general availability" gate, not a Day 1 blocker for a pilot with 1–2 friendly distributors.

### Included
- Data import (Retailers, Opening Balances, Transactions) via Excel/CSV with validation
- Full global search (retailer name, phone, business name, invoice number)
- Extended settings (statement branding, payment methods, reminder schedule defaults, credit limit defaults, active channel configuration)
- Security hardening: automated daily backups, RBAC enforcement audit, final validation-rule sweep

### Explicit Non-Goals (confirmed out of scope — this is deliberately not a full DMS)
- Inventory management, van sales, route/PJP planning, GPS tracking
- Scheme and claims management (principal-to-distributor trade schemes)
- Multi-branch/multi-warehouse support
- Accounting/ERP integration, FBR e-invoicing
- Financing/loan scoring, AI collection assistant, predictive cash-flow analytics
- Native mobile application, online payment gateway integration

**Why these stay excluded even long-term:** the product's competitive position is "fast to adopt, focused purely on retailer credit intelligence" versus heavier, multi-module distribution ERPs already established in this market. Building toward DMS feature parity would mean competing on their terms (implementation depth, sales infrastructure) rather than the terms where this product actually wins (speed of adoption, risk intelligence depth).

---

## Feature: Data Import

**Epic 6.1 — Bulk Import**

- **Story:** As an Owner, I want to import my existing retailer list and opening balances from Excel/CSV.
  - Tasks:
    - [BE] File upload endpoint + parser (pandas/openpyxl) for Retailers, Opening Balances, Transactions templates — **L**
    - [BE] Validation pass: duplicate retailers (by mobile), missing phone numbers, invalid amounts — row-level error report before commit — **M**
    - [BE] Transactional bulk-insert using Phase 1's transaction-creation service for opening balances (so risk/audit hooks fire correctly, not bypassed) — **M**
    - [FE] Import wizard: upload → validation report → confirm → success summary — **L**
  - Dependencies: Phase 1 schema, Phase 4 audit log, Phase 2.5/5 risk hooks
  - **Design note carried over from original plan:** route imported rows through the same internal services used by manual entry — guarantees audit logs, risk recalculation, and validation rules stay consistent.

---

## Feature: Global Search

**Epic 6.2 — Unified Search**

- **Story:** As an Owner/Staff, I want one search box that finds retailers or invoices by name, phone, business name, or invoice number.
  - Tasks:
    - [DB] Postgres full-text index (`tsvector`) across `customers` (name, business_name, mobile) and `transactions` (reference_number) — **M**
    - [BE] `GET /search?q=` unified endpoint returning typed results — **M**
    - [FE] Global search bar in top nav with grouped results dropdown — **M**
  - Dependencies: Phase 1 schema (stable by now)

---

## Feature: Extended Settings

**Epic 6.3 — Settings Completion**

- **Story:** As an Owner, I want to configure statement branding, default payment methods, default credit limits, and active reminder channels in one place.
  - Tasks:
    - [BE] `PATCH /settings` covering fields not already editable (statement footer text, default credit limit, default payment methods, active channel priority order) — **S**
    - [FE] Settings page consolidating: business profile, reminder templates/schedule/channels, statement branding, payment methods, credit defaults — **M**
  - Dependencies: Phases 1–2 settings surfaces

---

## Feature: Security Hardening

**Epic 6.4 — Production Readiness**

- **Story:** As the business, I need daily backups and a final RBAC/validation audit before go-live at scale.
  - Tasks:
    - [Infra] Automated daily Postgres backup job — **M**
    - [BE] RBAC audit: re-verify every endpoint from Phases 1–5 has the correct permission decorator (checklist pass) — **M**
    - [BE] Validation-rule regression sweep — **S**
    - [Infra] HTTPS/TLS termination confirmed in deployment config — **S**
  - Dependencies: All prior phases (horizontal audit pass, not a vertical feature)

**Parallelization:** Epics 6.1–6.3 split cleanly across 2 engineers; Epic 6.4 is a shared checklist pass by both engineers in the final week before broader rollout.

---

### Phase 6 Build Order
1. **Database:** Full-text search indexes (additive)
2. **Backend:** Import validation/parsing → import commit service (reusing transaction service) → search endpoint → settings consolidation → RBAC/backup audit
3. **Frontend:** Import wizard → global search bar → consolidated settings page
4. **Integrations:** Object storage for backups; no new third-party APIs

---

# Cross-Phase Dependency Summary

```
Phase 1 (Core Ledger — shipped)
   │  transactions table + shared transaction service is the load-bearing wall
   ▼
Phase 2 (Multi-Channel Reminders) ──────┐
   │  NotificationChannel abstraction   │
   │  reused everywhere below           │
   ▼                                    ▼
Phase 2.5 (Risk Engine MVP)         Phase 3 reuses NotificationChannel
   │  hooks into shared txn service     for statement sharing
   ▼
Phase 3 (Statements/Reports)
   │  risk-aware reports (Overdue, Collection Summary)
   ▼
Phase 4 (Staff/Permissions/Audit)
   │  retrofits permission + audit checks onto Phases 1–3 endpoints
   ▼
Phase 5 (Risk Engine v2/Notifications/Analytics)
   │  extends Phase 2.5 scoring with Phase 2 reminder-response data
   │  scoped by Phase 4 permissions
   ▼
Phase 6 (Import/Search/Settings/Hardening)
   │  routes through Phase 1 services; audits Phases 1–5 endpoints
```

**Key architectural decision that pays off repeatedly (unchanged from the original plan):** the single, shared **transaction-creation service** built in Phase 1 is what makes both the risk engine (2.5 and 5) and audit logging (4) cheap to bolt on instead of requiring a rewrite. **The equivalent decision made in this revision** is the Phase 2 `NotificationChannel` abstraction — it's what makes the WhatsApp dependency optional instead of foundational, and it's reused by statement sharing (3) and notification delivery (5) without rework.

---

# Recommended Team Allocation (2–3 engineers)

| Phase | Backend-heavy work | Frontend-heavy work | Notes |
|---|---|---|---|
| 1 | *(shipped)* | *(shipped)* | Foundation — no rework needed |
| 2 | Channel abstraction, SMS adapter, Celery/Redis | Template editor, reminder UI | WhatsApp adapter slots in later, non-blocking |
| 2.5 | Risk-scoring service, hook into txn service | Risk badge on sale form | Fully parallel to Phase 2 — different engineer, no shared code path |
| 3 | PDF/export service, report queries (risk-aware) | Statement modal, report screens | Mostly parallelizable once shared components exist |
| 4 | Permission + audit retrofit (largest single task) | User mgmt, audit log viewer | Budget extra time — touches nearly every prior endpoint |
| 5 | Risk scoring v2, notification hooks | Refined risk display, notification bell, charts | Entirely internal computation — no new external integrations |
| 6 | Import service, search index, RBAC audit | Import wizard, global search, settings | Final phase before scaled go-live |

---

# Why This Sequencing Minimizes Risk

1. **Revenue-relevant value ships in Phase 1–2.5**, not at the end — a pilot distributor can be using and paying for the product after the ledger, SMS-first reminders, and a basic risk score exist, without waiting on WhatsApp approval or the full intelligence layer.
2. **The riskiest external dependency (WhatsApp Business API) is now optional, not load-bearing** — it can be pursued in parallel with everything else and integrated whenever it clears, with zero schedule impact on Phase 2 shipping.
3. **The differentiating feature (risk scoring) ships early, not late** — this is the single biggest change from the original plan and directly addresses the competitive reality that ledgers and basic reminders are already commodity features among existing distribution software in this market.
4. **Multi-user complexity (Phase 4) is deferred until single-user workflows are proven**, avoiding permission-model rework that would happen if roles were designed before the endpoints they gate exist.
5. **Import and hardening (Phase 6) are last** because they're about reducing friction and increasing trust at scale — valuable for growth, not for proving the core value proposition.
