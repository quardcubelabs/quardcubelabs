-- ==============================================================================
-- QUARDCUBE LABS - ENTERPRISE ERP & CRM NATIVE MODULES SCHEMA
-- Modules: Chart of Accounts, Bank Accounts, Journal Entries, Supplier Bills,
-- Stock Adjustments, Hardware Serial Tracking, CRM Leads, Deals, Contacts, Activities
-- Target Database: Supabase PostgreSQL
-- ==============================================================================

-- 1. CHART OF ACCOUNTS (General Ledger Master)
CREATE TABLE IF NOT EXISTS public.chart_of_accounts (
    id TEXT PRIMARY KEY DEFAULT ('acc-' || substr(md5(random()::text), 1, 8)),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('asset', 'liability', 'equity', 'revenue', 'expense', 'cogs')),
    sub_category VARCHAR(100),
    currency VARCHAR(10) DEFAULT 'TZS',
    current_balance NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BANK & CASH ACCOUNTS (Treasury & Float Register)
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id TEXT PRIMARY KEY DEFAULT ('bnk-' || substr(md5(random()::text), 1, 8)),
    account_name VARCHAR(255) NOT NULL,
    account_type VARCHAR(100) NOT NULL,
    account_number VARCHAR(100),
    bank_name VARCHAR(255),
    branch VARCHAR(255),
    currency VARCHAR(10) DEFAULT 'TZS',
    current_balance NUMERIC(15, 2) DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    last_reconciled_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. JOURNAL ENTRIES (General Ledger Double-Entry Transactions)
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id TEXT PRIMARY KEY DEFAULT ('jn-' || substr(md5(random()::text), 1, 8)),
    entry_number VARCHAR(50) UNIQUE NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reference_type VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    memo TEXT,
    total_debit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_credit NUMERIC(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(50) DEFAULT 'posted' CHECK (status IN ('draft', 'posted', 'void')),
    lines JSONB NOT NULL DEFAULT '[]'::jsonb,
    posted_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. SUPPLIER BILLS (Accounts Payable & Vendor Invoices)
CREATE TABLE IF NOT EXISTS public.supplier_bills (
    id TEXT PRIMARY KEY DEFAULT ('bill-' || substr(md5(random()::text), 1, 8)),
    bill_number VARCHAR(50) UNIQUE NOT NULL,
    po_id TEXT,
    po_number VARCHAR(100),
    supplier_id TEXT,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_email VARCHAR(255),
    bill_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    shipping_amount NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    balance_due NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'pending_approval', 'approved', 'partially_paid', 'paid', 'void')),
    notes TEXT,
    created_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. STOCK ADJUSTMENTS (Physical Count Variances & Write-Offs)
CREATE TABLE IF NOT EXISTS public.stock_adjustments (
    id TEXT PRIMARY KEY DEFAULT ('adj-' || substr(md5(random()::text), 1, 8)),
    adjustment_number VARCHAR(50) UNIQUE NOT NULL,
    product_id BIGINT,
    product_name VARCHAR(255) NOT NULL,
    warehouse_id TEXT,
    warehouse_name VARCHAR(255),
    previous_quantity INTEGER NOT NULL DEFAULT 0,
    quantity_adjusted INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    unit_cost NUMERIC(15, 2) NOT NULL DEFAULT 0,
    total_value_impact NUMERIC(15, 2) NOT NULL DEFAULT 0,
    reason VARCHAR(255) NOT NULL,
    notes TEXT,
    performed_by VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INVENTORY SERIALS (Hardware Serialization & Warranty Tracking)
CREATE TABLE IF NOT EXISTS public.inventory_serials (
    id TEXT PRIMARY KEY DEFAULT ('ser-' || substr(md5(random()::text), 1, 8)),
    product_id BIGINT,
    product_name VARCHAR(255) NOT NULL,
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    mac_address VARCHAR(50),
    warehouse_id TEXT,
    warehouse_name VARCHAR(255),
    status VARCHAR(50) DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'reserved', 'sold', 'in_rma', 'defective', 'returned')),
    supplier_id TEXT,
    supplier_name VARCHAR(255),
    invoice_number VARCHAR(100),
    customer_name VARCHAR(255),
    customer_phone VARCHAR(50),
    purchase_date DATE,
    warranty_months INTEGER DEFAULT 12,
    warranty_start_date DATE,
    warranty_end_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CRM LEADS (Sales Inquiries & Prospects)
CREATE TABLE IF NOT EXISTS public.crm_leads (
    id TEXT PRIMARY KEY DEFAULT ('lead-' || substr(md5(random()::text), 1, 8)),
    lead_number VARCHAR(50) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    region VARCHAR(100) DEFAULT 'Dar es Salaam',
    source VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'converted', 'lost')),
    estimated_value NUMERIC(15, 2) DEFAULT 0,
    assigned_to_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. CRM DEALS (Commercial Pipeline & Stages)
CREATE TABLE IF NOT EXISTS public.crm_deals (
    id TEXT PRIMARY KEY DEFAULT ('deal-' || substr(md5(random()::text), 1, 8)),
    deal_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    stage VARCHAR(50) DEFAULT 'lead' CHECK (stage IN ('lead', 'meeting', 'proposal', 'negotiation', 'won', 'lost')),
    probability INTEGER DEFAULT 20,
    expected_close_date DATE,
    assigned_to_name VARCHAR(255),
    lost_reason TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. CRM CONTACTS (Customer 360 Profiles)
CREATE TABLE IF NOT EXISTS public.crm_contacts (
    id TEXT PRIMARY KEY DEFAULT ('cust-' || substr(md5(random()::text), 1, 8)),
    customer_code VARCHAR(50) UNIQUE NOT NULL,
    company_name VARCHAR(255),
    contact_person VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    region VARCHAR(100) DEFAULT 'Dar es Salaam',
    tin_number VARCHAR(50),
    vat_number VARCHAR(50),
    total_spend NUMERIC(15, 2) DEFAULT 0,
    total_orders_count INTEGER DEFAULT 0,
    total_invoices_count INTEGER DEFAULT 0,
    outstanding_receivables NUMERIC(15, 2) DEFAULT 0,
    payment_terms VARCHAR(50) DEFAULT 'Net 30',
    category VARCHAR(100) DEFAULT 'Corporate Enterprise',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'on_hold')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CRM ACTIVITIES (Engagements & Interactions Feed)
CREATE TABLE IF NOT EXISTS public.crm_activities (
    id TEXT PRIMARY KEY DEFAULT ('act-' || substr(md5(random()::text), 1, 8)),
    type VARCHAR(50) NOT NULL CHECK (type IN ('call', 'meeting', 'email', 'note', 'task', 'site_visit')),
    subject VARCHAR(255) NOT NULL,
    description TEXT,
    related_to_type VARCHAR(50) CHECK (related_to_type IN ('lead', 'deal', 'customer', 'order', 'quotation')),
    related_to_id TEXT,
    related_to_title VARCHAR(255),
    performed_by_name VARCHAR(255) NOT NULL,
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS POLICIES FOR ALL 10 ERP TABLES
ALTER TABLE public.chart_of_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.supplier_bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_serials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN SELECT unnest(ARRAY[
        'chart_of_accounts', 'bank_accounts', 'journal_entries', 'supplier_bills',
        'stock_adjustments', 'inventory_serials', 'crm_leads', 'crm_deals',
        'crm_contacts', 'crm_activities'
    ]) LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all read on %I" ON public.%I;', tbl, tbl);
        EXECUTE format('DROP POLICY IF EXISTS "Allow all write on %I" ON public.%I;', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow all read on %I" ON public.%I FOR SELECT USING (true);', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow all write on %I" ON public.%I FOR ALL USING (true);', tbl, tbl);
    END LOOP;
END $$;
