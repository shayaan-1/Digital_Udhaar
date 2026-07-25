-- ============================================
-- ENUMS
-- ============================================
CREATE TYPE credit_status AS ENUM ('active', 'restricted', 'blocked');
CREATE TYPE user_role AS ENUM ('owner', 'manager', 'staff');
CREATE TYPE transaction_type AS ENUM ('credit_sale', 'payment', 'adjustment', 'opening_balance');

-- ============================================
-- BUSINESSES
-- ============================================
CREATE TABLE businesses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255) NOT NULL,
    logo_url        TEXT,
    address         TEXT,
    phone           VARCHAR(20),
    whatsapp_number VARCHAR(20),
    currency        VARCHAR(10) NOT NULL DEFAULT 'PKR',
    payment_instructions TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- USERS
-- ============================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    email           VARCHAR(255) NOT NULL UNIQUE,
    hashed_password TEXT NOT NULL,
    role            user_role NOT NULL DEFAULT 'owner', -- Phase 1: owner only, but keep the enum for Phase 4
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_business_id ON users(business_id);

-- ============================================
-- CUSTOMERS
-- ============================================
CREATE TABLE customers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,

    -- Basic info
    name                VARCHAR(255) NOT NULL,
    business_name       VARCHAR(255),
    mobile_number       VARCHAR(20) NOT NULL,
    whatsapp_number     VARCHAR(20),
    address             TEXT,
    city                VARCHAR(100),
    notes               TEXT,

    -- Credit info
    credit_limit        NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (credit_limit >= 0),
    opening_balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
    credit_status       credit_status NOT NULL DEFAULT 'active',

    -- System-generated / derived fields (maintained by trigger, see below)
    current_outstanding NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_purchases     NUMERIC(14,2) NOT NULL DEFAULT 0,
    total_payments      NUMERIC(14,2) NOT NULL DEFAULT 0,
    last_purchase_date  DATE,
    last_payment_date   DATE,

    -- Metadata
    archived_at         TIMESTAMPTZ,
    created_by          UUID REFERENCES users(id),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_customers_business_id ON customers(business_id);
CREATE INDEX idx_customers_name ON customers(name);
CREATE INDEX idx_customers_mobile ON customers(mobile_number);
CREATE INDEX idx_customers_archived ON customers(archived_at);

-- ============================================
-- TRANSACTIONS (the load-bearing table)
-- ============================================
CREATE TABLE transactions (
    id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id             UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id             UUID NOT NULL REFERENCES customers(id),

    type                    transaction_type NOT NULL,
    amount                  NUMERIC(14,2) NOT NULL CHECK (amount > 0),

    -- Credit sale specific
    invoice_number          VARCHAR(100),
    invoice_date            DATE,

    -- Payment specific
    payment_method          VARCHAR(50),   -- cash / bank / easypaisa / jazzcash / other

    reference_number        VARCHAR(100),
    description             TEXT,

    -- Reversal model (no edits, only reversals)
    is_reversal             BOOLEAN NOT NULL DEFAULT false,
    reversed_transaction_id UUID REFERENCES transactions(id),

    -- Running balance snapshot AFTER this transaction (immutable once written)
    running_balance         NUMERIC(14,2) NOT NULL,

    created_by              UUID NOT NULL REFERENCES users(id),
    created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT chk_future_date CHECK (
        (invoice_date IS NULL OR invoice_date <= CURRENT_DATE)
    )
);

CREATE INDEX idx_transactions_customer_id ON transactions(customer_id, created_at);
CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_transactions_invoice_number ON transactions(invoice_number);
CREATE INDEX idx_transactions_type ON transactions(type);

-- ============================================
-- TRIGGER: keep customers.current_outstanding /
-- total_purchases / total_payments / last dates in sync
-- ============================================
CREATE OR REPLACE FUNCTION fn_apply_transaction_to_customer()
RETURNS TRIGGER AS $$
DECLARE
    delta NUMERIC(14,2);
BEGIN
    -- Credit sale & opening balance increase outstanding; payment decreases it
    IF NEW.type IN ('credit_sale', 'opening_balance') THEN
        delta := NEW.amount;
    ELSIF NEW.type = 'payment' THEN
        delta := -NEW.amount;
    ELSE -- adjustment: sign is encoded by is_reversal / amount convention decided at app layer
        delta := NEW.amount;
    END IF;

    UPDATE customers
    SET
        current_outstanding = current_outstanding + delta,
        total_purchases = total_purchases + (CASE WHEN NEW.type = 'credit_sale' THEN NEW.amount ELSE 0 END),
        total_payments = total_payments + (CASE WHEN NEW.type = 'payment' THEN NEW.amount ELSE 0 END),
        last_purchase_date = (CASE WHEN NEW.type = 'credit_sale' THEN NEW.invoice_date ELSE last_purchase_date END),
        last_payment_date = (CASE WHEN NEW.type = 'payment' THEN NEW.created_at::date ELSE last_payment_date END),
        updated_at = now()
    WHERE id = NEW.customer_id;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_apply_transaction_to_customer
AFTER INSERT ON transactions
FOR EACH ROW EXECUTE FUNCTION fn_apply_transaction_to_customer();

-- ============================================
-- updated_at auto-touch (generic, reused across tables)
-- ============================================
CREATE OR REPLACE FUNCTION fn_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_businesses_updated_at BEFORE UPDATE ON businesses
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();

CREATE TRIGGER trg_customers_updated_at BEFORE UPDATE ON customers
FOR EACH ROW EXECUTE FUNCTION fn_touch_updated_at();