# Functional Requirements Document (FRD)

## Product: WhatsApp-Based Credit Recovery System

**Version:** **MVP** 1.0

---

# 1. Purpose of the project

The system enables businesses that sell on credit to digitally manage customer ledgers, monitor outstanding balances, automate payment reminders through WhatsApp, and generate professional account statements.

The primary business objective is to reduce overdue receivables and improve cash flow.

---

# 2. User Roles

## 2.1 Owner

Has full access to the system.

Can:

- Manage customers
- Create users
- Record sales
- Record payments
- Configure reminder rules
- View analytics
- Export reports
- View audit logs

---

## 2.2 Staff

Permissions configurable by owner.

Possible permissions:

- Create customers
- Record sales
- Record payments
- View customer ledger
- Send reminders manually

Cannot:

- Delete financial records
- Change business settings
- Manage users

---

# 3. Business Profile

During setup the business provides:

- Business name
- Logo
- Address
- Phone number
- WhatsApp number
- Currency (**PKR**)
- Payment instructions (Bank/Easypaisa/JazzCash)

These details automatically appear on reminders and statements.

---

# 4. Customer Management

Each customer contains:

### Basic Information

- Customer Name
- Business Name (optional)
- Mobile Number (required)
- WhatsApp Number
- Address
- City
- Notes

### Credit Information

- Credit Limit
- Opening Balance
- Credit Status (Active / Restricted / Blocked)

### System Generated Fields

- Current Outstanding
- Total Purchases
- Total Payments
- Last Purchase Date
- Last Payment Date
- Average Payment Delay
- Risk Rating
- Total Overdue Amount

Deleting customers is not allowed if transactions exist.

Customers may only be archived.

---

# 5. Ledger Management

Every financial activity is recorded as a ledger transaction.

Transaction Types:

- Credit Sale
- Payment Received
- Manual Adjustment
- Opening Balance

Each transaction contains:

- Date
- Amount
- Reference Number
- Description
- Created By
- Timestamp

Transactions cannot be edited after saving.

Corrections require reversal entries to maintain audit history.

Running balance is recalculated after every transaction.

---

# 6. Credit Sale Flow

Staff selects the customer.

System displays:

- Outstanding balance
- Credit limit
- Risk score
- Average payment delay

If projected balance exceeds credit limit:

System displays warning.

Owner may override.

Staff enters:

- Invoice Number
- Invoice Date
- Credit Amount
- Optional notes

System:

- Saves transaction
- Updates customer balance
- Updates dashboard

---

# 7. Payment Recording Flow

Staff selects customer.

System displays outstanding amount.

Staff enters:

- Payment amount
- Payment date
- Payment method
- Reference number
- Notes

System:

- Creates payment transaction
- Updates outstanding balance
- Updates dashboard
- Records payment history

Overpayments create customer credit balance.

---

# 8. Customer Ledger

Each customer has a chronological ledger.

Shows:

- Date
- Transaction type
- Debit
- Credit
- Running balance
- Remarks

Filters:

- Date range
- Transaction type

Export:

- **PDF**
- Excel

---

# 9. Customer Statement

Owner can generate statement for any period.

Statement contains:

- Business information
- Customer information
- Opening balance
- All transactions
- Closing balance
- Outstanding amount
- Generated date

Export formats:

- **PDF**
- WhatsApp Share

---

# 10. WhatsApp Reminder System

Reminder templates are configurable.

Default template:

Assalam-o-Alaikum.

Your outstanding balance with **ABC** Traders is Rs. XX,**XXX**.

Kindly clear your payment at your earliest convenience.

Thank you.

Variables:

- Customer Name
- Business Name
- Outstanding Amount
- Due Date
- Payment Instructions

---

# 11. Manual Reminder Flow

Owner opens customer.

Clicks *Send Reminder*.

System:

- Generates message
- Shows preview
- Sends via WhatsApp
- Logs delivery attempt

History stores:

- Date
- Time
- User
- Message template
- Delivery status

---

# 12. Scheduled Reminder Flow

Owner creates reminder rule.

Configuration:

- Days after invoice
- Frequency
- Stop after payment
- Maximum reminders

Scheduler runs automatically.

Customers matching criteria receive reminders.

Reminder log updated.

No reminder is sent when outstanding balance is zero.

---

# 13. WhatsApp Reply Tracking (MVP)

System stores:

- Sent
- Delivered (if available)
- Failed

Optional staff note:

- Customer promised payment
- Customer disputed invoice
- Wrong number
- Follow-up required

---

# 14. Credit Risk Engine

Risk score recalculated after every transaction.

Inputs:

- Average payment delay
- Outstanding amount
- Credit utilization
- Number of overdue invoices

Risk Levels:

- Low
- Medium
- High

Recommendations:

- Safe to extend credit
- Monitor closely
- Limit additional credit
- Block further credit

Displayed before every new sale.

---

# 15. Dashboard

Owner dashboard displays:

Today's Credit Sales

Today's Payments

### Total Outstanding

### Total Customers

### Overdue Customers

### Top Outstanding Customers

### Recently Received Payments

### Recent Credit Sales

### Monthly Collection Trend

### Collection Rate

### Average Payment Delay

---

# 16. Search

Global search supports:

- Customer Name
- Phone Number
- Business Name
- Invoice Number

Returns relevant customer and ledger.

---

# 17. Reports

Reports include:

### Outstanding Customers

### Payments Received

### Sales Report

### Overdue Report

### Collection Summary

### Customer Ledger Report

Filters:

- Date
- Customer
- Amount Range

Export:

- **PDF**
- Excel

---

# 18. Notifications

Owner receives notifications for:

- Large payment received
- Large new credit sale
- Customer exceeds credit limit
- Reminder failed
- High-risk customer detected

---

# 19. User Management

Owner can:

- Invite users
- Disable users
- Reset passwords
- Assign permissions

Roles:

- Owner
- Manager
- Staff

---

# 20. Audit Log

System records:

- Login
- Customer creation
- Sales
- Payments
- Reminder sent
- User changes
- Settings changes

Each entry includes:

- User
- Timestamp
- Action
- Entity affected

Logs cannot be modified.

---

# 21. Data Import

Support importing:

- Customers
- Opening Balances
- Transactions

Accepted formats:

- Excel
- **CSV**

System validates:

- Duplicate customers
- Missing phone numbers
- Invalid amounts

Invalid rows reported before import.

---

# 22. Settings

Business owner configures:

- Reminder templates
- Reminder schedule
- Credit limit defaults
- Statement branding
- Payment methods
- Company profile

---

# 23. Security

- Secure login required.
- Passwords encrypted.
- All actions tied to authenticated users.
- **HTTPS** for all communication.
- Daily automatic backups.
- Role-based authorization enforced.

---

# 24. Validation Rules

- Customer name is mandatory.
- Mobile number is mandatory.
- Transaction amount must be greater than zero.
- Future transaction dates are not allowed.
- Credit limit cannot be negative.
- Payments cannot be recorded without selecting a customer.

---

# 25. End-to-End Business Flow

## Business is onboarded and company profile configured.

## Existing customers and opening balances are imported or entered. ## Staff creates a credit sale when goods are supplied. ## Ledger and outstanding balance update automatically. ## Dashboard reflects new receivable. ## Scheduled reminder identifies overdue accounts. ## WhatsApp reminder is sent and logged. ## Customer pays via preferred payment method. ## Staff records payment. ## Ledger updates automatically. ## Outstanding amount decreases. ## Risk score recalculates. ## Customer statement reflects latest balance. ## Owner monitors collections and overdue balances from the dashboard.

---

# 26. MVP Scope

Included:

- Customer management
- Digital ledger
- Credit sales
- Payment recording
- Customer statements
- WhatsApp reminders
- Reminder scheduling
- Dashboard
- Basic reports
- Credit risk indicator
- User management
- Audit logs
- Data import

Excluded (Future Releases):

- Inventory management
- Supplier management
- Purchase orders
- Multi-branch support
- Accounting integration
- Financing and loan scoring
- AI collection assistant
- Predictive cash flow analytics
- Mobile application
- Online payment gateway integration
- **ERP** integrations
