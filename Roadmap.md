# Implementation Roadmap
## WhatsApp-Based Credit Recovery System — Phased Delivery Plan

**Prepared as:** Senior PM / Technical Architect view for a resource-constrained startup team
**Stack:** FastAPI (backend) · Next.js (frontend) · PostgreSQL (database) · Redis + Celery (background jobs)
**Guiding principle:** Ship the smallest thing that a real business will pay for, then layer automation, collaboration, and intelligence on top — in that order. Every phase below is a shippable, sellable product, not an internal milestone.

---

## How to Read This Document

For every phase you'll find:
1. **Business goal** — why this phase exists commercially
2. **Why it precedes later phases** — sequencing logic
3. **Included / Excluded features** — explicit scope fence
4. **Epic → User Story → Dev Task breakdown** — with complexity (S/M/L) and dependencies
5. **Parallelization guidance** — what can be built simultaneously by 2 engineers (assumed team size: 1 backend + 1 frontend, occasionally +1 full-stack)
6. **Build order** — DB → Backend → Frontend → Integrations

Complexity legend: **S** = <1 day, **M** = 1–3 days, **L** = 3–7 days (single engineer, MVP quality, not gold-plated).

---

# Phase 1 — The Digital Khata (Core Ledger MVP)

### Business Goal
Replace the paper/Excel ledger with a single-owner web app that tracks who owes what. This is the minimum wedge that gets a shopkeeper to stop using a notebook. **No WhatsApp automation yet** — the value proposition at this stage is purely "accurate, always-available ledger with real-time outstanding balances." This is sellable and demo-able within 2–3 weeks.

### Why This Comes First
- WhatsApp reminders, statements, and risk scoring are all *derived* from ledger data. Without a correct, trustworthy ledger, none of the downstream features have anything meaningful to act on.
- It validates the riskiest assumption first: will a business actually migrate their credit tracking into this tool at all? If not, WhatsApp automation is irrelevant.
- It's the smallest slice that produces a "wow, this is already better than my notebook" reaction, which is what earns the right to onboard paying pilot customers.

### Included
- Business profile setup (single business, owner-only)
- Customer management (CRUD, archive-not-delete)
- Ledger transactions: Credit Sale, Payment Received, Opening Balance, Manual Adjustment (with reversal-only correction model)
- Credit sale flow with credit-limit warning
- Payment recording flow (incl. overpayment → credit balance)
- Customer ledger view with date/type filters
- Minimal dashboard (today's sales/payments, total outstanding, total customers)
- Core validation rules
- Basic auth (single owner login), password hashing, HTTPS

### Excluded (deliberately deferred)
- WhatsApp reminders (manual or scheduled)
- PDF/Excel export of ledger or statements
- Reports module
- Staff roles/permissions, user management
- Credit risk engine
- Notifications
- Audit log (a minimal "created_by/timestamp" field is captured now; the full audit *log UI* comes later)
- Data import
- Global search across invoices (basic customer name/phone search only)

---

## Feature: Business Profile Setup

**Epic 1.1 — Business Onboarding**

- **Story:** As an Owner, I want to enter my business details once so they auto-populate future documents.
  - Tasks:
    - [DB] `businesses` table (name, logo_url, address, phone, whatsapp_number, currency, payment_instructions) — **S**
    - [BE] `POST /businesses`, `GET /businesses/me`, `PATCH /businesses/me` — **S**
    - [FE] Onboarding form (multi-step: profile → logo upload → payment instructions) — **M**
    - [BE] Logo upload to object storage (S3-compatible) + URL persisted — **M**
  - Dependencies: none (first table in the system)
  - Parallel: FE form can be built against a mocked API contract while BE is in progress

---

## Feature: Authentication

**Epic 1.2 — Owner Auth**

- **Story:** As an Owner, I want to sign up and log in securely.
  - Tasks:
    - [DB] `users` table (email, hashed_password, role, business_id) — **S**
    - [BE] JWT-based auth (`/auth/signup`, `/auth/login`, `/auth/refresh`), bcrypt hashing — **M**
    - [FE] Signup/login pages, token storage (httpOnly cookie), protected route wrapper — **M**
    - [BE] Password reset flow (email token) — **M** *(can slip to Phase 4 if email infra isn't ready; flag as optional)*
  - Dependencies: `businesses` table must exist to link `business_id`
  - Parallel: FE auth pages can be built in parallel with BE once the JWT contract (payload shape) is agreed

---

## Feature: Customer Management

**Epic 1.3 — Customer CRUD**

- **Story:** As an Owner, I want to add a customer with basic + credit info.
  - Tasks:
    - [DB] `customers` table (name, business_name, mobile [required], whatsapp_number, address, city, notes, credit_limit, opening_balance, credit_status, business_id, archived_at) — **M**
    - [BE] `POST /customers`, validation (name + mobile mandatory, credit_limit ≥ 0) — **S**
    - [FE] "Add Customer" form + client-side validation — **M**
  - Dependencies: `businesses`, `users` (auth)

- **Story:** As an Owner, I want to view/search/edit my customer list.
  - Tasks:
    - [BE] `GET /customers` (paginated), `GET /customers/{id}`, `PATCH /customers/{id}` — **M**
    - [BE] Simple search by name/mobile (`ILIKE` query, indexed) — **S**
    - [FE] Customer list table + search bar + edit modal — **M**
  - Dependencies: Customer CRUD above

- **Story:** As an Owner, I want to archive (not delete) a customer with transaction history.
  - Tasks:
    - [BE] `POST /customers/{id}/archive` — blocks hard delete if transactions exist — **S**
    - [FE] Archive confirmation + "Archived" filter toggle in list — **S**
  - Dependencies: Ledger transactions must exist as a concept (soft dependency on Epic 1.4, but can be stubbed with a `has_transactions` check against an empty table initially)

**Parallelization:** Epic 1.3 stories are almost entirely sequential (list depends on create), but FE table/search UI can be scaffolded with mock data while BE endpoints are finalized.

---

## Feature: Ledger Management + Credit Sale + Payment Flows

**Epic 1.4 — Transaction Ledger Core**

- **Story:** As the system, I need an immutable, typed transaction record so balances are always auditable.
  - Tasks:
    - [DB] `transactions` table (customer_id, type[enum: credit_sale/payment/adjustment/opening_balance], amount, reference_number, description, created_by, created_at, is_reversal, reversed_transaction_id) — **M**
    - [BE] Shared transaction-creation service (single internal function all flows call — enforces "no edits, only reversals") — **M**
    - [DB] Running balance: computed column via trigger **or** materialized `current_outstanding` on `customers` updated transactionally — **M** (decision point: trigger is more robust, recommended)
  - Dependencies: `customers` table
  - Complexity note: this is the single most important table in the product — get the reversal model right here since Phase 3 (statements) and Phase 5 (risk engine) both read from it.

- **Story:** As Staff, I want to record a credit sale and see credit-limit/risk context before saving.
  - Tasks:
    - [BE] `GET /customers/{id}/credit-sale-context` (outstanding, credit_limit, avg_payment_delay placeholder=0 in Phase 1) — **S**
    - [BE] `POST /transactions` (type=credit_sale) — validates invoice number/date, amount > 0, date not in future — **M**
    - [FE] Credit Sale form with live "over limit" warning banner — **M**
    - [BE] Owner-override flag on over-limit sales (Phase 1: owner is the only role, so this is just a confirmation checkbox) — **S**
  - Dependencies: Epic 1.4 core, Epic 1.3

- **Story:** As Staff, I want to record a payment against a customer's outstanding balance.
  - Tasks:
    - [BE] `POST /transactions` (type=payment) — supports overpayment → negative outstanding (credit balance) — **M**
    - [FE] Payment form (amount, date, method dropdown, reference, notes) — **M**
  - Dependencies: Epic 1.4 core

**Parallelization:** Credit Sale flow and Payment flow are independent once the shared transaction service exists — build both FE forms in parallel.

---

## Feature: Customer Ledger View

**Epic 1.5 — Ledger Viewing**

- **Story:** As an Owner, I want to see a customer's full chronological ledger with running balance.
  - Tasks:
    - [BE] `GET /customers/{id}/ledger?date_from&date_to&type` — **M**
    - [FE] Ledger table (date, type, debit, credit, running balance, remarks) with filters — **M**
  - Dependencies: Epic 1.4
  - *(PDF/Excel export intentionally excluded from Phase 1 — see Phase 3)*

---

## Feature: Minimal Dashboard

**Epic 1.6 — Owner Dashboard v1**

- **Story:** As an Owner, I want a snapshot of today's activity and total exposure.
  - Tasks:
    - [BE] `GET /dashboard/summary` (today's sales, today's payments, total outstanding, total customers) — **M** (simple aggregate queries, no caching needed yet at this scale)
    - [FE] Dashboard cards layout — **M**
  - Dependencies: Epics 1.3, 1.4

---

### Phase 1 Build Order
1. **Database:** `businesses` → `users` → `customers` → `transactions`
2. **Backend:** Auth → Business profile → Customer CRUD → Transaction service → Credit sale/Payment endpoints → Ledger query → Dashboard aggregate
3. **Frontend:** Auth pages → Onboarding → Customer list/CRUD → Credit sale & payment forms → Ledger view → Dashboard
4. **Integrations:** None required in Phase 1 (no external APIs) — this is intentional to de-risk delivery speed.

### Phase 1 Team Parallelization
- Backend engineer: DB schema → auth → transaction service (critical path)
- Frontend engineer: builds against a stubbed/mocked API contract for auth + customer CRUD in week 1, then wires real endpoints in week 2
- Both converge on Credit Sale + Payment flows together since these are the highest-value, highest-testing-need screens

---

# Phase 2 — WhatsApp Reminder Engine

### Business Goal
This is the product's actual differentiator and the reason a customer pays a premium over a plain ledger app: **automated collections**. Phase 2 turns the ledger into an active recovery tool by sending manual and scheduled WhatsApp reminders.

### Why This Comes Before Later Phases
- It's the highest-leverage feature for the stated business objective ("reduce overdue receivables and improve cash flow") — it should ship as soon as the ledger is trustworthy, not after cosmetic features like reports/statements.
- It introduces two new pieces of infrastructure (Celery/Redis for scheduling, WhatsApp Business API) that are isolated and testable independently of the rest of the system — good candidate for early de-risking rather than leaving it to the end.
- Reports (Phase 3) become far more valuable once there's reminder activity to report on (e.g. "reminders sent vs. collected").

### Included
- Configurable reminder templates with variable substitution
- Manual reminder flow (Owner-triggered, single customer)
- Scheduled reminder flow (rule-based, Celery Beat)
- Reminder delivery logging (sent/delivered/failed)
- Staff note on reply outcome (promised payment, disputed, wrong number, follow-up)

### Excluded
- Two-way conversational AI / auto-reply handling (explicitly out of MVP scope per FRD)
- Notifications for reminder failures (Phase 5, needs the notification framework)
- Reports on reminder effectiveness (Phase 3/5)

---

## Feature: Reminder Templates

**Epic 2.1 — Template Configuration**

- **Story:** As an Owner, I want to customize the reminder message with dynamic variables.
  - Tasks:
    - [DB] `reminder_templates` table (business_id, name, body_text, is_default) — **S**
    - [BE] Template CRUD endpoints + variable-substitution engine (`{{customer_name}}`, `{{business_name}}`, `{{outstanding_amount}}`, `{{due_date}}`, `{{payment_instructions}}`) — **M**
    - [FE] Template editor with live preview using sample data — **M**
  - Dependencies: `businesses` (Phase 1)

---

## Feature: WhatsApp Integration Layer

**Epic 2.2 — Messaging Provider Integration**

- **Story:** As the system, I need a reliable way to send WhatsApp messages and know delivery status.
  - Tasks:
    - [Integration] Evaluate & integrate WhatsApp Business Cloud API (Meta) or Twilio WhatsApp API — **L** (approval/verification lead time is the real risk here, start this in parallel with Epic 1.x if possible)
    - [BE] `WhatsAppClient` service abstraction (send message, webhook receiver for delivery status) — **M**
    - [BE] `POST /webhooks/whatsapp/status` — updates `reminder_log.status` — **M**
    - [DB] `reminder_log` table (customer_id, template_id, message_body, sent_at, status[sent/delivered/failed], sent_by, staff_note) — **S**
  - Dependencies: none technically, but **start provider verification in week 1** since business/API approval can take days
  - **Risk flag:** This is the single external dependency most likely to cause schedule slippage — kick off provider onboarding before writing any code for this epic.

---

## Feature: Manual Reminder Flow

**Epic 2.3 — Send Reminder Now**

- **Story:** As an Owner, I want to preview and send a reminder to one customer on demand.
  - Tasks:
    - [BE] `POST /customers/{id}/reminders/send` — renders template, calls `WhatsAppClient`, writes `reminder_log` — **M**
    - [FE] "Send Reminder" button on customer profile → preview modal → confirm/send — **M**
    - [FE] Reminder history tab on customer profile (date, time, user, template, status) — **M**
  - Dependencies: Epics 2.1, 2.2

---

## Feature: Scheduled Reminder Flow

**Epic 2.4 — Reminder Rules & Automation**

- **Story:** As an Owner, I want to define a rule ("remind 7 days after invoice, every 3 days, stop after payment, max 5 reminders") that runs automatically.
  - Tasks:
    - [DB] `reminder_rules` table (business_id, days_after_invoice, frequency_days, stop_after_payment, max_reminders, active) — **S**
    - [BE] Rule CRUD endpoints — **S**
    - [FE] Rule builder UI — **M**
  - Dependencies: Epic 2.1

- **Story:** As the system, I want a scheduler that evaluates all active rules daily and sends qualifying reminders.
  - Tasks:
    - [Infra] Stand up Redis + Celery worker + Celery Beat — **M**
    - [BE] Celery Beat periodic task (`run_reminder_scheduler`, daily) — queries customers matching rule criteria (overdue days, reminder count < max, outstanding > 0) — **L**
    - [BE] Skip logic: no reminder when outstanding balance is zero — **S**
    - [BE] Idempotency guard (don't double-send if scheduler retries) — **S**
  - Dependencies: Epic 2.2 (WhatsApp client), Epic 1.4 (transaction/balance data), Epic 2.4 rule storage

**Parallelization:** Redis/Celery infra setup can happen in parallel with template + manual-send work — different engineer, no shared code path until the scheduler task itself is written.

---

## Feature: Reply Tracking

**Epic 2.5 — Delivery & Outcome Tracking**

- **Story:** As an Owner, I want to log what happened after a reminder (promised payment, disputed, etc.) since auto-reply parsing is out of scope.
  - Tasks:
    - [BE] `PATCH /reminder-log/{id}/note` — **S**
    - [FE] Note dropdown on reminder history row — **S**
  - Dependencies: Epic 2.2/2.3

---

### Phase 2 Build Order
1. **Integration (start immediately, longest lead time):** WhatsApp provider account setup & approval
2. **Database:** `reminder_templates` → `reminder_log` → `reminder_rules`
3. **Backend:** WhatsApp client abstraction → manual send endpoint → Celery/Redis infra → scheduled task
4. **Frontend:** Template editor → manual send UI → reminder history → rule builder

### Phase 2 Parallelization
- Engineer A: WhatsApp provider integration + Celery/Redis infra (backend-heavy)
- Engineer B: Template editor + manual reminder UI (can be built against a stub `WhatsAppClient` that logs instead of sends)
- Converge on end-to-end testing once both are ready

---

# Phase 3 — Statements, Ledger Export & Reports

### Business Goal
Give the business owner professional, shareable documents (PDF statements, exportable reports) — this is what makes the tool feel "official" enough to send to customers and use for their own accounting/reconciliation. It also starts surfacing the ROI of Phase 2 (e.g., collection reports).

### Why This Comes Before Phase 4/5
- Statements and reports are **read-only projections** of existing ledger + reminder data — zero new write-paths, so they're low-risk to build and are a fast way to add perceived product maturity.
- Doing this before multi-user/staff roles avoids having to retrofit permission checks into every report/export endpoint twice.
- Doing this before the risk engine means reports (esp. Overdue Report, Collection Summary) can later be enriched with risk scores rather than built around them from scratch.

### Included
- PDF generation for customer statements
- PDF + Excel export for ledger view
- Reports module: Outstanding Customers, Payments Received, Sales Report, Overdue Report, Collection Summary, Customer Ledger Report
- Report filters (date, customer, amount range) + PDF/Excel export
- WhatsApp Share of statements

### Excluded
- Staff-level access to reports (Phase 4 — permission gating)
- Risk-score columns in reports (Phase 5)

---

## Feature: Customer Statement

**Epic 3.1 — Statement Generation**

- **Story:** As an Owner, I want to generate a PDF statement for a customer for any date range.
  - Tasks:
    - [BE] `GET /customers/{id}/statement?date_from&date_to` — computes opening balance, transactions in range, closing balance — **M**
    - [BE] PDF rendering service (e.g., WeasyPrint/Playwright-to-PDF) with business branding (logo, address) — **L**
    - [FE] "Generate Statement" modal with date range picker + preview — **M**
  - Dependencies: Phase 1 ledger data, Phase 1 business profile (branding)

- **Story:** As an Owner, I want to share a statement directly via WhatsApp.
  - Tasks:
    - [BE] Statement PDF upload to storage + shareable link generation — **M**
    - [BE] Reuse `WhatsAppClient` from Phase 2 to send document link — **S**
    - [FE] "Share via WhatsApp" button — **S**
  - Dependencies: Epic 2.2 (WhatsApp client), Epic 3.1 PDF generation

---

## Feature: Ledger Export

**Epic 3.2 — Ledger PDF/Excel Export**

- **Story:** As an Owner, I want to export the filtered customer ledger view.
  - Tasks:
    - [BE] `GET /customers/{id}/ledger/export?format=pdf|xlsx` (reuses PDF service; Excel via `openpyxl`) — **M**
    - [FE] Export button on ledger view (respects active filters) — **S**
  - Dependencies: Epic 1.5, Epic 3.1 PDF service

---

## Feature: Reports Module

**Epic 3.3 — Standard Reports**

- **Story:** As an Owner, I want an Outstanding Customers report.
  - Tasks:
    - [BE] `GET /reports/outstanding-customers?date&amount_min&amount_max` — **M**
    - [FE] Report table + filter bar (shared filter component reused across all reports) — **M**
  - Dependencies: Phase 1 data

- **Story:** As an Owner, I want Payments Received, Sales, Overdue, Collection Summary, and Customer Ledger reports.
  - Tasks:
    - [BE] 5× report query endpoints (mostly parameterized aggregate queries on `transactions`) — **L** total (roughly S–M each)
    - [FE] Reuse report table/filter shell for each — **M** total
  - Dependencies: Epic 3.3 shared filter component (build once, reuse 6×)

- **Story:** As an Owner, I want to export any report to PDF/Excel.
  - Tasks:
    - [BE] Generic export wrapper around report query results — **M**
    - [FE] Export button standardized across all report screens — **S**
  - Dependencies: Epic 3.2 PDF/Excel infra (reused, not rebuilt)

**Parallelization:** Once the shared filter component and export wrapper exist, the 6 individual reports are near-identical in shape and can be split across 2 engineers (3 reports each) or done rapidly by one.

---

### Phase 3 Build Order
1. **Backend:** PDF rendering service (shared infra) → Statement endpoint → Ledger export → Report query endpoints (build the generic export wrapper once, reuse everywhere)
2. **Frontend:** Statement modal → Ledger export button → Shared report table/filter shell → 6 report pages
3. **Database:** No new tables required — this phase is purely additive/read-only on top of Phase 1–2 schema (statement links can optionally get a lightweight `statement_shares` table if link expiry/tracking is desired)
4. **Integrations:** Reuses Phase 2's `WhatsAppClient`; new PDF library integration

---

# Phase 4 — Multi-User Collaboration (Staff Roles + Permissions + Audit Log)

### Business Goal
Unlock businesses with more than one employee — most real credit-sale businesses have counter staff who aren't the owner. This phase converts the product from a single-owner tool into a team tool, which materially increases willingness to pay (more seats, more entrenched workflow).

### Why This Comes Before Phase 5/6
- Introducing staff accounts *before* the risk engine and notifications means permission checks only need to be retrofitted once (on Phase 1–3 endpoints), rather than needing to be designed twice.
- The audit log is far more valuable once there's more than one actor in the system — with a single owner, "who did this" is a trivial question; with staff, it's essential for trust and dispute resolution.
- This is intentionally *not* Phase 2, because a single owner running the pilot doesn't need staff accounts to prove the WhatsApp/statement value — adding multi-user complexity earlier would have slowed the highest-value phases down.

### Included
- Staff role with configurable permissions (create customers, record sales/payments, view ledger, send reminders manually)
- Owner/Manager/Staff role model
- User invite, disable, password reset, permission assignment
- Full audit log (login, customer creation, sales, payments, reminder sent, user changes, settings changes)

### Excluded
- Fine-grained per-customer permission scoping (not in FRD, correctly out of scope)
- SSO/2FA (not required by MVP FRD)

---

## Feature: Staff Roles & Permissions

**Epic 4.1 — Role Model**

- **Story:** As an Owner, I want to invite a staff member with a defined permission set.
  - Tasks:
    - [DB] Extend `users` with `role` enum (owner/manager/staff) + `permissions` JSONB column (or a `user_permissions` join table if finer control is desired later — recommend JSONB for MVP speed) — **S**
    - [BE] `POST /users/invite` (email invite token flow) — **M**
    - [BE] Permission-check dependency/decorator applied to existing Phase 1–3 endpoints (create customer, record sale/payment, view ledger, send reminder) — **L** (retrofit work across many endpoints, budget accordingly)
    - [FE] User invite form + permission checkbox matrix — **M**
  - Dependencies: Phase 1 `users` table
  - **Note:** This is the largest single task in the roadmap because it touches nearly every existing write endpoint — schedule it with buffer.

- **Story:** As an Owner, I want to disable a user or reset their password.
  - Tasks:
    - [BE] `POST /users/{id}/disable`, `POST /users/{id}/reset-password` — **S**
    - [FE] User management table with actions — **M**
  - Dependencies: Epic 4.1 role model

**Story:** As Staff, I want my UI to only show actions I'm permitted to perform.
  - Tasks:
    - [FE] Global permission-aware component wrapper (hide/disable buttons based on JWT-embedded permissions) — **M**
  - Dependencies: BE permission decorator above must return permission set on login

---

## Feature: Audit Log

**Epic 4.2 — Full Audit Trail**

- **Story:** As an Owner, I want an immutable log of all significant actions.
  - Tasks:
    - [DB] `audit_log` table (user_id, action, entity_type, entity_id, timestamp, metadata JSONB) — **S**
    - [BE] Audit-writing middleware/decorator hooked into: login, customer creation, sales, payments, reminder sent, user changes, settings changes — **L** (similar retrofit scope to permissions; do both passes together for efficiency)
    - [FE] Audit log viewer (filterable by user, action, date) — **M**
  - Dependencies: Epic 4.1 (role/user model), touches most Phase 1–3 write paths

**Parallelization:** Permission retrofit (Epic 4.1) and audit-log retrofit (Epic 4.2) touch the *same* endpoints — do them in a single pass per endpoint rather than two separate sweeps, ideally by one engineer working endpoint-by-endpoint while a second engineer builds the two new UI screens (user management, audit log viewer) against contract stubs.

---

### Phase 4 Build Order
1. **Database:** `users` extension → `audit_log`
2. **Backend:** Invite/disable/reset endpoints → permission decorator → sweep all existing endpoints (customer, transaction, reminder, settings) adding both permission checks and audit writes together
3. **Frontend:** User management screen → permission-aware UI wrapper → audit log viewer
4. **Integrations:** Reuses existing email (invite) — if not already built in Phase 1's password reset, build minimal transactional email sending here

---

# Phase 5 — Intelligence Layer (Credit Risk Engine + Notifications + Advanced Analytics)

### Business Goal
Move from "record and remind" to "advise." This is where the product starts proactively telling the owner *who's risky* and *what needs attention*, which is a strong retention/upsell feature once the core workflow is habitual.

### Why This Comes After, Not Before
- The risk engine's core inputs (average payment delay, credit utilization, overdue invoice count) are all derived from **historical transaction and reminder data** — it needs Phases 1–2 running for real weeks/months to produce meaningful scores. Building it earlier would mean it launches with no data to be useful.
- Notifications are naturally layered on top of events already being generated by Phases 1–4 (large sale, large payment, credit limit exceeded, reminder failed, high risk detected) — no new event sources needed, just new subscribers to existing write paths.
- This is deliberately positioned after multi-user support (Phase 4) so risk indicators and notifications can already be scoped to the right recipients/permissions (e.g., only Owner/Manager sees risk-based recommendations).

### Included
- Credit risk score recalculation on every transaction
- Risk levels (Low/Medium/High) + recommendation text, shown before every new sale
- Notification system (large payment, large sale, credit limit exceeded, reminder failed, high-risk customer)
- Expanded dashboard analytics (collection rate, avg payment delay, monthly trend, top outstanding, overdue customers list)

### Excluded
- Predictive/ML-based cash flow forecasting (explicitly future-release per FRD)
- AI collection assistant (explicitly future-release)

---

## Feature: Credit Risk Engine

**Epic 5.1 — Risk Scoring**

- **Story:** As the system, I want to recalculate a customer's risk score after every transaction.
  - Tasks:
    - [DB] Add `risk_score`, `risk_level`, `avg_payment_delay`, `total_overdue_amount` columns to `customers` (or a separate `customer_risk_metrics` table — recommend separate table to avoid bloating the hot `customers` row) — **S**
    - [BE] Risk-scoring service: pure function taking (avg_payment_delay, outstanding_amount, credit_utilization, overdue_invoice_count) → score + level — **M**
    - [BE] Hook risk recalculation into the transaction-creation service from Phase 1 (single choke point makes this easy — this is exactly why Epic 1.4 was built as a shared service) — **M**
    - [BE] Celery task to batch-recalculate nightly (safety net in case of any missed triggers) — **S**
  - Dependencies: Phase 1 `transactions` table, Phase 2 reminder history (for delay calculation)

- **Story:** As Staff, I want to see the customer's risk level and recommendation before completing a credit sale.
  - Tasks:
    - [BE] Extend `GET /customers/{id}/credit-sale-context` (already stubbed in Phase 1) with real risk data — **S**
    - [FE] Risk badge + recommendation banner on Credit Sale form — **S**
  - Dependencies: Epic 5.1 scoring service — this is a clean example of a Phase 1 stub being "filled in" rather than rebuilt

---

## Feature: Notifications

**Epic 5.2 — Owner Notification System**

- **Story:** As an Owner, I want to be notified of significant events without checking the dashboard constantly.
  - Tasks:
    - [DB] `notifications` table (business_id, type, message, entity_id, read_at, created_at) — **S**
    - [BE] Notification-writing hooks on: payment recorded (if > threshold), credit sale recorded (if > threshold), credit limit exceeded, reminder send failure (Phase 2 webhook), risk level → High — **M**
    - [BE] `GET /notifications`, `POST /notifications/{id}/read` — **S**
    - [FE] Notification bell + dropdown + unread badge — **M**
  - Dependencies: Epic 5.1 (for high-risk trigger), Phase 2 webhook (for failure trigger), Phase 1 transaction service (for threshold triggers)
  - Configurable thresholds: [BE] `notification_settings` in business settings — **S**

**Parallelization:** Risk engine (5.1) and notification plumbing (5.2) can be built by two engineers in parallel — notifications only need an *event*, not the risk engine itself, except for the "high risk detected" trigger, which is the one integration point between the two epics.

---

## Feature: Advanced Dashboard Analytics

**Epic 5.3 — Dashboard v2**

- **Story:** As an Owner, I want collection rate, average payment delay, and monthly trend visualized.
  - Tasks:
    - [BE] `GET /dashboard/analytics` (collection rate = payments/sales over period; monthly trend = grouped time-series query) — **M**
    - [FE] Chart components (trend line, collection rate gauge) — **M**
    - [FE] Top Outstanding Customers + Overdue Customers widgets (reuses report queries from Phase 3) — **S**
  - Dependencies: Phase 3 report queries (reused), Epic 5.1 risk data (for risk-sorted widgets)

---

### Phase 5 Build Order
1. **Database:** `customer_risk_metrics` → `notifications`
2. **Backend:** Risk-scoring service → hook into transaction service → notification hooks → dashboard analytics endpoint
3. **Frontend:** Risk badge on sale form → notification bell → dashboard v2 widgets/charts
4. **Integrations:** None new — this phase is entirely internal computation on existing data

---

# Phase 6 — Onboarding Efficiency & Hardening (Data Import, Settings, Search, Security)

### Business Goal
Reduce friction for businesses switching from Excel/paper (bulk import), round out configurability, and harden the system for scale/reliability now that the core product is proven. This is the phase where you optimize for *sales conversion* (easy migration) and *operational trust* (backups, full search).

### Why This Comes Last
- Data import is only worth building once the target schema (customers, transactions, risk fields) is fully stable — building it earlier risks rework every time an earlier phase adds a column.
- Full global search (across invoices/ledger, not just customer name) is a quality-of-life feature best prioritized after the core workflows it searches *into* (ledger, reports, reminders) all exist.
- Security hardening (automated backups, RBAC audit pass) is appropriately a "before general availability" gate rather than a Day 1 blocker for a pilot with 1–2 friendly customers.

### Included
- Data import (Customers, Opening Balances, Transactions) via Excel/CSV with validation
- Full global search (customer name, phone, business name, invoice number)
- Extended settings (statement branding, payment methods, reminder schedule defaults, credit limit defaults)
- Security hardening: automated daily backups, RBAC enforcement audit, final validation-rule sweep

### Excluded (confirmed future releases per FRD)
- Inventory/supplier management, purchase orders
- Multi-branch support
- Accounting integration
- Financing/loan scoring
- AI collection assistant, predictive cash flow analytics
- Mobile application
- Online payment gateway integration
- ERP integrations

---

## Feature: Data Import

**Epic 6.1 — Bulk Import**

- **Story:** As an Owner, I want to import my existing customer list and opening balances from Excel/CSV.
  - Tasks:
    - [BE] File upload endpoint + parser (pandas/openpyxl) for Customers, Opening Balances, Transactions templates — **L**
    - [BE] Validation pass: duplicate customers (by mobile), missing phone numbers, invalid amounts — returns row-level error report before commit — **M**
    - [BE] Transactional bulk-insert (all-or-nothing per validated batch) using Phase 1's transaction-creation service for opening balances (so risk/audit hooks fire correctly) — **M**
    - [FE] Import wizard: upload → validation report → confirm → success summary — **L**
  - Dependencies: Phase 1 customer/transaction schema, Phase 4 audit log, Phase 5 risk hooks (import must trigger them, not bypass them)
  - **Design note:** Route imported rows through the *same* internal services used by manual entry (Epic 1.3/1.4) rather than direct DB writes — this guarantees audit logs, risk recalculation, and validation rules stay consistent instead of drifting.

---

## Feature: Global Search

**Epic 6.2 — Unified Search**

- **Story:** As an Owner/Staff, I want one search box that finds customers or invoices by name, phone, business name, or invoice number.
  - Tasks:
    - [DB] Postgres full-text index (`tsvector`) across `customers` (name, business_name, mobile) and `transactions` (reference_number) — **M**
    - [BE] `GET /search?q=` unified endpoint returning typed results (customer matches, transaction/invoice matches) — **M**
    - [FE] Global search bar in top nav with grouped results dropdown — **M**
  - Dependencies: Phase 1 schema (stable by now)

---

## Feature: Extended Settings

**Epic 6.3 — Settings Completion**

- **Story:** As an Owner, I want to configure statement branding, default payment methods, and default credit limits in one place.
  - Tasks:
    - [BE] `PATCH /settings` covering fields not already editable in Phase 1 profile (statement footer text, default credit limit, default payment methods list) — **S**
    - [FE] Settings page consolidating: business profile (Phase 1), reminder templates/schedule (Phase 2), statement branding, payment methods, credit defaults — **M**
  - Dependencies: Phases 1–2 settings surfaces (this epic mostly organizes/extends existing config into one screen)

---

## Feature: Security Hardening

**Epic 6.4 — Production Readiness**

- **Story:** As the business, I need daily backups and a final RBAC/validation audit before go-live at scale.
  - Tasks:
    - [Infra] Automated daily Postgres backup job (managed DB snapshot or `pg_dump` to object storage) — **M**
    - [BE] RBAC audit: re-verify every endpoint from Phases 1–5 has the correct permission decorator (checklist pass, not new code) — **M**
    - [BE] Validation-rule regression sweep against Section 24 rules (name/mobile mandatory, amount > 0, no future dates, credit limit ≥ 0, payment requires customer) — **S**
    - [Infra] HTTPS/TLS termination confirmed in deployment config (likely already true if hosted on standard PaaS) — **S**
  - Dependencies: All prior phases (this is a horizontal audit pass, not a vertical feature)

**Parallelization:** Epics 6.1–6.3 are independent features and split cleanly across 2 engineers; Epic 6.4 is best done as a shared checklist pass by both engineers in the final week before broader rollout.

---

### Phase 6 Build Order
1. **Database:** Full-text search indexes (additive, no migration risk to existing data)
2. **Backend:** Import validation/parsing service → import commit service (reusing core transaction service) → search endpoint → settings consolidation → RBAC/backup audit
3. **Frontend:** Import wizard → global search bar → consolidated settings page
4. **Integrations:** Object storage for backups; no new third-party APIs

---

# Cross-Phase Dependency Summary

```
Phase 1 (Ledger Core)
   │  transactions table + transaction service is the load-bearing wall
   ▼
Phase 2 (WhatsApp Reminders) ──────┐
   │  WhatsAppClient reused        │
   ▼                               ▼
Phase 3 (Statements/Reports)   Phase 5 depends on Phase 2's
   │  PDF/export infra reused      reminder history for
   ▼                               avg_payment_delay calc
Phase 4 (Staff/Permissions/Audit)
   │  retrofits permission + audit checks onto Phases 1–3 endpoints
   ▼
Phase 5 (Risk Engine/Notifications/Analytics)
   │  reads Phase 1 transactions + Phase 2 reminder log
   │  scoped by Phase 4 permissions
   ▼
Phase 6 (Import/Search/Settings/Hardening)
   │  routes through Phase 1 services; audits Phases 1–5 endpoints
```

**Key architectural decision that pays off repeatedly:** building a single, shared **transaction-creation service** in Phase 1 (Epic 1.4) — rather than letting Credit Sale, Payment, Data Import, and future flows each write to the `transactions` table directly — is what makes Phase 5 (risk recalculation) and Phase 4 (audit logging) cheap to bolt on later instead of requiring a rewrite.

---

# Recommended Team Allocation (2–3 engineers)

| Phase | Backend-heavy work | Frontend-heavy work | Notes |
|---|---|---|---|
| 1 | Auth, schema, transaction service | Auth pages, customer/ledger UI | Highest-risk phase for schema decisions — get transaction model right |
| 2 | WhatsApp integration, Celery/Redis | Template editor, reminder UI | Kick off WhatsApp provider approval on Day 1 of this phase (lead time risk) |
| 3 | PDF/export service, report queries | Statement modal, report screens | Mostly parallelizable once shared PDF/filter components exist |
| 4 | Permission + audit retrofit (largest single task) | User mgmt, audit log viewer | Budget extra time — touches nearly every prior endpoint |
| 5 | Risk scoring, notification hooks | Risk badges, notification bell, charts | Entirely internal computation — no new external integrations |
| 6 | Import service, search index, RBAC audit | Import wizard, global search, settings | Final phase before scaled go-live |

---

# Why This Sequencing Minimizes Risk

1. **Revenue-relevant value ships in Phase 1–2**, not at the end — a pilot customer can be using and paying for the product after Phases 1–2 (roughly 5–7 weeks), well before staff accounts, risk scoring, or import tooling exist.
2. **The riskiest external dependency (WhatsApp Business API approval) is surfaced in Phase 2**, early enough to absorb delays without blocking the whole roadmap, but not so early that it blocks proving the core ledger works.
3. **Multi-user complexity (Phase 4) is deferred until the single-user workflows are proven**, avoiding permission-model rework that would happen if roles were designed before the endpoints they gate even existed.
4. **The risk/intelligence layer (Phase 5) is sequenced after there's real data to be intelligent about** — shipping it earlier would mean launching a feature with nothing meaningful to show.
5. **Import and hardening (Phase 6) are last** because they're about *reducing friction and increasing trust at scale* — valuable for growth, not for proving the core value proposition.
