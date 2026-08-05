# Functional Requirements Document (FRD)

## Product: Distributor Credit Intelligence Platform

**Version:** MVP 2.0 (repositioned from the original WhatsApp-Based Credit Recovery System — schema and Phase 1 unchanged)

---

# 1. Purpose of the Project

The system enables distributors who sell on credit to their retailer base to digitally manage retailer ledgers, monitor outstanding balances and credit risk in real time, automate collection reminders across multiple channels, and generate professional account statements and receivables reports.

The primary business objective is to reduce cash leakage and bad debt from retailer credit, and to give distributor owners a forward-looking view of which retailers are becoming credit risks — not just a record of what already happened.

**Positioning note:** the system is validated first with FMCG distributors (Lahore pilot), but the data model and workflows are vertical-agnostic — any distributor extending trade credit to a retailer base (pharma, hardware, building materials, cloth wholesale, etc.) fits the same model without schema changes.

---

# 2. User Roles

## 2.1 Owner

Full access. Can manage retailers, create users, record sales/payments, configure reminder and risk rules, view analytics, export reports, view audit logs.

## 2.2 Manager

Same operational access as Staff plus reporting and user-management visibility (introduced in the multi-user phase; not required for MVP).

## 2.3 Staff (incl. counter staff / salesmen)

Permissions configurable by owner. Possible permissions: create retailers, record sales, record payments, view retailer ledger, send reminders manually. Cannot delete financial records, change business settings, or manage users.

---

# 3. Business Profile

During setup the distributor provides: business name, logo, address, phone number, WhatsApp number (optional — one of several channels, not required), currency (PKR), payment instructions (bank/Easypaisa/JazzCash).

These auto-populate reminders and statements.

---

# 4. Retailer Management

*(Referred to as "Customer" in the schema/backend — no data model change from Phase 1.)*

### Basic Information
Retailer/Shop Name, Business Name (optional), Mobile Number (required), WhatsApp Number (optional), Address, City, Notes.

### Credit Information
Credit Limit, Opening Balance, Credit Status (Active / Restricted / Blocked).

### System-Generated Fields
Current Outstanding, Total Purchases, Total Payments, Last Purchase Date, Last Payment Date, Average Payment Delay, **Risk Score**, **Risk Level**, Total Overdue Amount.

Deleting retailers is not allowed if transactions exist. Retailers may only be archived.

---

# 5. Ledger Management

Every financial activity is recorded as an immutable ledger transaction. Transaction Types: Credit Sale, Payment Received, Manual Adjustment (increase/decrease), Opening Balance.

Each transaction contains: Date, Amount, Reference Number, Description, Created By, Timestamp.

Transactions cannot be edited after saving — corrections require reversal entries. Running balance is recalculated after every transaction via the shared transaction-creation service (single write path — this is the architectural foundation everything else, including risk scoring, is built on).

---

# 6. Credit Sale Flow

Staff selects retailer. System displays: outstanding balance, credit limit, **risk score and recommendation**, average payment delay.

If projected balance exceeds credit limit, system displays a warning; Owner may override.

Staff enters Invoice Number, Invoice Date, Credit Amount, optional notes. System saves the transaction, updates the retailer balance and risk score, updates the dashboard.

---

# 7. Payment Recording Flow

Staff selects retailer, system displays outstanding amount. Staff enters payment amount, date, method, reference, notes. System creates the payment transaction, updates outstanding balance and risk score, updates the dashboard and payment history. Overpayments create a retailer credit balance.

---

# 8. Retailer Ledger

Chronological ledger per retailer: date, transaction type, debit, credit, running balance, remarks. Filters: date range, transaction type. Export: PDF, Excel.

---

# 9. Retailer Statement

Owner can generate a statement for any period: business info, retailer info, opening balance, all transactions, closing balance, outstanding amount, generated date. Export: PDF, and share via any connected messaging channel (not tied to a single provider).

---

# 10. Multi-Channel Collection Reminders

**This replaces the original WhatsApp-only reminder system.** Reminders are sent through a channel-agnostic notification layer:

- **SMS** — default channel. High delivery certainty, no external approval bottleneck, works on any handset.
- **WhatsApp** — optional richer channel where available and approved; added as an adapter, not a hard dependency of the core product.
- (Future) **Voice/IVR** — same abstraction, addable later without touching the ledger or risk engine.

Reminder templates are configurable with variables: Retailer Name, Business Name, Outstanding Amount, Due Date, Payment Instructions.

## 10.1 Manual Reminder Flow
Owner/Staff opens retailer, clicks *Send Reminder*, previews the generated message, sends via the configured channel, delivery attempt is logged (date, time, user, template, channel, delivery status).

## 10.2 Scheduled Reminder Flow
Owner creates a reminder rule (days after invoice, frequency, stop after payment, maximum reminders). Scheduler runs automatically and sends via the configured channel(s). No reminder is sent when outstanding balance is zero.

## 10.3 Reply / Outcome Tracking
System stores Sent / Delivered (if available) / Failed per channel, plus an optional staff note: promised payment, disputed invoice, wrong number, follow-up required.

---

# 11. Credit Risk Engine (pulled forward — core differentiator)

Risk score recalculated after every transaction via the same shared transaction-creation service used for credit sales and payments (no separate write path, no drift risk).

**Inputs:** average payment delay, outstanding amount, credit utilization, number of overdue invoices.

**Risk Levels:** Low / Medium / High, each with a recommendation: safe to extend credit / monitor closely / limit additional credit / block further credit.

Displayed before every new credit sale and on the retailer profile and dashboard. This is the layer that existing distribution/ledger software in this market does not offer with the same depth — static credit limits and after-the-fact aging reports are common; a live, transaction-driven forward risk score is not.

---

# 12. Dashboard

Owner dashboard displays: Today's Credit Sales, Today's Payments, Total Outstanding, Total Retailers, Overdue Retailers, Top Outstanding Retailers, Recently Received Payments, Recent Credit Sales, Monthly Collection Trend, Collection Rate, Average Payment Delay, **High-Risk Retailers list**.

---

# 13. Search

Global search across Retailer Name, Phone Number, Business Name, Invoice Number.

---

# 14. Reports

Outstanding Retailers, Payments Received, Sales Report, Overdue Report, Collection Summary, Retailer Ledger Report. Filters: date, retailer, amount range. Export: PDF, Excel.

---

# 15. Notifications

Owner receives notifications for: large payment received, large new credit sale, retailer exceeds credit limit, reminder delivery failure (any channel), high-risk retailer detected.

---

# 16. User Management

Owner can invite users, disable users, reset passwords, assign permissions. Roles: Owner, Manager, Staff.

---

# 17. Audit Log

Records: login, retailer creation, sales, payments, reminder sent, user changes, settings changes. Each entry: user, timestamp, action, entity affected. Logs cannot be modified.

---

# 18. Data Import

Import Retailers, Opening Balances, Transactions via Excel/CSV, routed through the same internal services used by manual entry (so risk scoring and audit logs stay consistent, not bypassed). System validates duplicate retailers, missing phone numbers, invalid amounts; invalid rows reported before import.

---

# 19. Settings

Owner configures: reminder templates, reminder schedule, active reminder channels, credit limit defaults, statement branding, payment methods, company profile.

---

# 20. Security

Secure login, encrypted passwords, all actions tied to authenticated users, HTTPS, daily automatic backups, role-based authorization enforced.

---

# 21. Validation Rules

- Retailer name and mobile number are mandatory.
- Transaction amount must be greater than zero.
- Future transaction dates are not allowed.
- Credit limit cannot be negative.
- Payments cannot be recorded without selecting a retailer.

---

# 22. End-to-End Business Flow

1. Distributor is onboarded and company profile configured.
2. Existing retailers and opening balances are imported or entered.
3. Staff/salesman creates a credit sale when goods are supplied; system shows live risk context first.
4. Ledger, outstanding balance, and risk score update automatically.
5. Dashboard reflects new receivable and any change in risk level.
6. Scheduled reminder identifies overdue accounts and sends via the configured channel(s).
7. Retailer pays via preferred payment method; staff records payment.
8. Ledger updates automatically; outstanding amount decreases; risk score recalculates.
9. Retailer statement reflects latest balance.
10. Owner monitors collections, overdue balances, and high-risk retailers from the dashboard.

---

# 23. MVP Scope

**Included:** Retailer management, digital ledger, credit sales, payment recording, retailer statements, multi-channel reminders (SMS-first, WhatsApp optional), reminder scheduling, minimum-viable credit risk score, dashboard, basic reports, user management, audit logs, data import.

**Excluded (future releases):** Inventory management, van sales/route planning, scheme and claims management, multi-branch support, accounting/ERP integration, predictive ML-based risk/cash-flow forecasting, AI collection assistant, native mobile app, online payment gateway integration.

---

# 24. Explicit Non-Goals

- Not a full distribution ERP (no inventory, PJP routing, GPS van tracking, scheme management) — deliberately scoped to receivables and credit risk only, to stay fast to adopt against heavier incumbent DMS platforms.
- Not dependent on any single messaging provider — WhatsApp is an optional adapter, never a hard requirement of the MVP.
