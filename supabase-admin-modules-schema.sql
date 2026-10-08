-- ==============================================================================
-- QUARDCUBE LABS - ENTERPRISE MODULES DATABASE SCHEMA
-- Modules: Suppliers, Expenses, Staff Members, Roles & Permissions, Branches, Purchase Orders & Goods Receipts
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1.1 PRE-MIGRATION CLEANUP & TYPE UNIFICATION
-- Safely drop legacy foreign key & check constraints and convert ALL UUID columns to TEXT
-- ==============================================================================
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop legacy foreign keys
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.constraint_type = 'FOREIGN KEY'
          AND tc.table_schema = 'public'
          AND tc.table_name IN ('goods_receipts', 'purchase_orders', 'expenses', 'staff_members', 'suppliers', 'branches', 'system_roles')
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I CASCADE;', r.table_schema, r.table_name, r.constraint_name);
    END LOOP;

    -- Drop legacy check constraints
    FOR r IN (
        SELECT tc.table_schema, tc.table_name, tc.constraint_name
        FROM information_schema.table_constraints AS tc
        WHERE tc.constraint_type = 'CHECK'
          AND tc.table_schema = 'public'
          AND tc.table_name IN ('goods_receipts', 'purchase_orders', 'expenses', 'staff_members', 'suppliers', 'branches', 'system_roles')
          AND tc.constraint_name NOT LIKE '%_not_null'
    ) LOOP
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I CASCADE;', r.table_schema, r.table_name, r.constraint_name);
    END LOOP;
END $$;

-- Convert ALL UUID columns to TEXT across all admin tables
DO $$
DECLARE
    col RECORD;
BEGIN
    FOR col IN (
        SELECT c.table_name, c.column_name
        FROM information_schema.columns c
        WHERE c.table_schema = 'public'
          AND (c.data_type = 'uuid' OR c.udt_name = 'uuid')
          AND c.table_name IN ('goods_receipts', 'purchase_orders', 'expenses', 'staff_members', 'suppliers', 'branches', 'system_roles')
    ) LOOP
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP DEFAULT;', col.table_name, col.column_name);
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I TYPE TEXT USING %I::text;', col.table_name, col.column_name, col.column_name);
    END LOOP;
END $$;

-- Convert any GENERATED columns (e.g. balance_due) to standard columns across admin tables
DO $$
DECLARE
    gen_col RECORD;
BEGIN
    FOR gen_col IN (
        SELECT table_name, column_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND is_generated = 'ALWAYS'
          AND table_name IN ('goods_receipts', 'purchase_orders', 'expenses', 'staff_members', 'suppliers', 'branches', 'system_roles')
    ) LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I ALTER COLUMN %I DROP EXPRESSION IF EXISTS;', gen_col.table_name, gen_col.column_name);
        EXCEPTION WHEN OTHERS THEN
            NULL;
        END;
    END LOOP;
END $$;

-- Set default ID generators for primary keys if tables already exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'branches') THEN
        ALTER TABLE public.branches ALTER COLUMN id SET DEFAULT ('br-' || substr(md5(random()::text), 1, 8));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'staff_members') THEN
        ALTER TABLE public.staff_members ALTER COLUMN id SET DEFAULT ('stf-' || substr(md5(random()::text), 1, 8));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'suppliers') THEN
        ALTER TABLE public.suppliers ALTER COLUMN id SET DEFAULT ('sup-' || substr(md5(random()::text), 1, 8));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'expenses') THEN
        ALTER TABLE public.expenses ALTER COLUMN id SET DEFAULT ('exp-' || substr(md5(random()::text), 1, 8));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'purchase_orders') THEN
        ALTER TABLE public.purchase_orders ALTER COLUMN id SET DEFAULT ('po-' || substr(md5(random()::text), 1, 8));
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'goods_receipts') THEN
        ALTER TABLE public.goods_receipts ALTER COLUMN id SET DEFAULT ('grn-' || substr(md5(random()::text), 1, 8));
    END IF;
END $$;

-- ==============================================================================
-- 2. BRANCHES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.branches (
    id TEXT PRIMARY KEY DEFAULT ('br-' || substr(md5(random()::text), 1, 8)),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    manager_name VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    region VARCHAR(100) DEFAULT 'Dar es Salaam',
    is_main BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    staff_count INTEGER DEFAULT 0,
    inventory_val NUMERIC(15, 2) DEFAULT 0,
    daily_sales NUMERIC(15, 2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS manager_name VARCHAR(255);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Dar es Salaam';
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS region VARCHAR(100) DEFAULT 'Dar es Salaam';
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS is_main BOOLEAN DEFAULT FALSE;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS staff_count INTEGER DEFAULT 0;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS inventory_val NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS daily_sales NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.branches ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 3. STAFF MEMBERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.staff_members (
    id TEXT PRIMARY KEY DEFAULT ('stf-' || substr(md5(random()::text), 1, 8)),
    staff_code VARCHAR(50) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    role VARCHAR(50) NOT NULL DEFAULT 'cashier',
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    branch_name VARCHAR(255),
    status VARCHAR(20) DEFAULT 'active', -- active, inactive, suspended
    joined_date DATE DEFAULT CURRENT_DATE,
    last_active VARCHAR(100) DEFAULT 'Just now',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS staff_code VARCHAR(50);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS full_name VARCHAR(255);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'cashier';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS branch_name VARCHAR(255);
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS joined_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS last_active VARCHAR(100) DEFAULT 'Just now';
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.staff_members ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 4. SYSTEM ROLES & PERMISSIONS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.system_roles (
    id VARCHAR(50) PRIMARY KEY, -- owner_admin, manager, accountant, stock_manager, cashier
    name VARCHAR(100) NOT NULL,
    description TEXT,
    badge VARCHAR(50),
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    is_system BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS name VARCHAR(100);
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS badge VARCHAR(50);
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT TRUE;
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.system_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 5. SUPPLIERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.suppliers (
    id TEXT PRIMARY KEY DEFAULT ('sup-' || substr(md5(random()::text), 1, 8)),
    supplier_code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    company_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    city VARCHAR(100) DEFAULT 'Dar es Salaam',
    country VARCHAR(100) DEFAULT 'Tanzania',
    tin_number VARCHAR(100),
    vat_number VARCHAR(100),
    payment_terms VARCHAR(100) DEFAULT 'Net 30',
    opening_balance NUMERIC(15, 2) DEFAULT 0,
    current_balance NUMERIC(15, 2) DEFAULT 0,
    total_purchases_amount NUMERIC(15, 2) DEFAULT 0,
    total_orders_count INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active', -- active, inactive
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS supplier_code VARCHAR(50);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS name VARCHAR(255);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS company_name VARCHAR(255);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS phone VARCHAR(50);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS city VARCHAR(100) DEFAULT 'Dar es Salaam';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS country VARCHAR(100) DEFAULT 'Tanzania';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS tin_number VARCHAR(100);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS vat_number VARCHAR(100);
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS payment_terms VARCHAR(100) DEFAULT 'Net 30';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS opening_balance NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS current_balance NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS total_purchases_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS total_orders_count INTEGER DEFAULT 0;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active';
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.suppliers ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 6. BUSINESS EXPENSES TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.expenses (
    id TEXT PRIMARY KEY DEFAULT ('exp-' || substr(md5(random()::text), 1, 8)),
    expense_number VARCHAR(50) UNIQUE NOT NULL,
    category VARCHAR(100) NOT NULL,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    expense_date DATE DEFAULT CURRENT_DATE,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    vendor_name VARCHAR(255),
    payment_method VARCHAR(100) DEFAULT 'Bank Transfer',
    payment_reference VARCHAR(255),
    description TEXT NOT NULL,
    receipt_url TEXT,
    status VARCHAR(20) DEFAULT 'paid', -- paid, pending, cancelled
    is_billable BOOLEAN DEFAULT FALSE,
    recorded_by VARCHAR(255) DEFAULT 'Administrator',
    branch_id TEXT REFERENCES public.branches(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_number VARCHAR(50);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS expense_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS vendor_name VARCHAR(255);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_method VARCHAR(100) DEFAULT 'Bank Transfer';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(255);
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS receipt_url TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'paid';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT FALSE;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS recorded_by VARCHAR(255) DEFAULT 'Administrator';
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS branch_id TEXT;
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.expenses ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 7. PURCHASE ORDERS TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.purchase_orders (
    id TEXT PRIMARY KEY DEFAULT ('po-' || substr(md5(random()::text), 1, 8)),
    po_number VARCHAR(50) UNIQUE NOT NULL,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    supplier_email VARCHAR(255),
    supplier_phone VARCHAR(50),
    supplier_address TEXT,
    warehouse_id VARCHAR(100) DEFAULT 'wh-dar-main',
    warehouse_name VARCHAR(255) DEFAULT 'QuardCube Central Hub — Kigamboni',
    order_date DATE DEFAULT CURRENT_DATE,
    expected_delivery_date DATE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0,
    tax_rate NUMERIC(5, 2) DEFAULT 0,
    tax_amount NUMERIC(15, 2) DEFAULT 0,
    discount_amount NUMERIC(15, 2) DEFAULT 0,
    shipping_amount NUMERIC(15, 2) DEFAULT 0,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0,
    amount_paid NUMERIC(15, 2) DEFAULT 0,
    balance_due NUMERIC(15, 2) DEFAULT 0,
    status VARCHAR(30) DEFAULT 'draft', -- draft, pending, approved, ordered, partially_received, received, cancelled
    payment_status VARCHAR(30) DEFAULT 'unpaid', -- unpaid, partial, paid
    notes TEXT,
    terms_conditions TEXT,
    created_by VARCHAR(255) DEFAULT 'Administrator',
    verification_token VARCHAR(255),
    verification_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist if table was previously created
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS po_number VARCHAR(50);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supplier_email VARCHAR(255);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supplier_phone VARCHAR(50);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS supplier_address TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(100) DEFAULT 'wh-dar-main';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(255) DEFAULT 'QuardCube Central Hub — Kigamboni';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS order_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS expected_delivery_date DATE;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(5, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS total NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS amount_paid NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS balance_due NUMERIC(15, 2) DEFAULT 0;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'draft';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(30) DEFAULT 'unpaid';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS terms_conditions TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS created_by VARCHAR(255) DEFAULT 'Administrator';
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS verification_url TEXT;
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.purchase_orders ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ==============================================================================
-- 8. GOODS RECEIPTS (GRN) TABLE
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.goods_receipts (
    id TEXT PRIMARY KEY DEFAULT ('grn-' || substr(md5(random()::text), 1, 8)),
    grn_number VARCHAR(50) UNIQUE NOT NULL,
    po_id TEXT REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    purchase_order_id TEXT REFERENCES public.purchase_orders(id) ON DELETE CASCADE,
    po_number VARCHAR(50) NOT NULL,
    supplier_id TEXT REFERENCES public.suppliers(id) ON DELETE SET NULL,
    supplier_name VARCHAR(255) NOT NULL,
    warehouse_id VARCHAR(100) DEFAULT 'wh-dar-main',
    warehouse_name VARCHAR(255) DEFAULT 'QuardCube Central Hub — Kigamboni',
    receipt_date DATE DEFAULT CURRENT_DATE,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    received_items JSONB NOT NULL DEFAULT '[]'::jsonb,
    delivery_note_number VARCHAR(100),
    carrier_name VARCHAR(255),
    received_by VARCHAR(255) DEFAULT 'Administrator',
    notes TEXT,
    status VARCHAR(30) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure all columns exist if goods_receipts table was previously created with an older schema
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS grn_number VARCHAR(50);
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS po_id TEXT;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS purchase_order_id TEXT;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS po_number VARCHAR(50);
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS supplier_id TEXT;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255);
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS warehouse_id VARCHAR(100) DEFAULT 'wh-dar-main';
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS warehouse_name VARCHAR(255) DEFAULT 'QuardCube Central Hub — Kigamboni';
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS receipt_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS received_items JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS delivery_note_number VARCHAR(100);
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS carrier_name VARCHAR(255);
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS received_by VARCHAR(255) DEFAULT 'Administrator';
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS status VARCHAR(30) DEFAULT 'completed';
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.goods_receipts ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Sync po_id and purchase_order_id if one is set and the other is null (with explicit casting)
UPDATE public.goods_receipts SET po_id = purchase_order_id::text WHERE po_id IS NULL AND purchase_order_id IS NOT NULL;
UPDATE public.goods_receipts SET purchase_order_id = po_id::text WHERE purchase_order_id IS NULL AND po_id IS NOT NULL;

-- ==============================================================================
-- 9. PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_branches_is_active ON public.branches(is_active);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON public.staff_members(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_role ON public.staff_members(role);
CREATE INDEX IF NOT EXISTS idx_staff_status ON public.staff_members(status);
CREATE INDEX IF NOT EXISTS idx_suppliers_status ON public.suppliers(status);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.expenses(expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON public.expenses(category);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier ON public.expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_supplier_id ON public.purchase_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_po_status ON public.purchase_orders(status);
CREATE INDEX IF NOT EXISTS idx_grn_po_id ON public.goods_receipts(po_id);
CREATE INDEX IF NOT EXISTS idx_grn_purchase_order_id ON public.goods_receipts(purchase_order_id);

-- ==============================================================================
-- 10. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchase_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goods_receipts ENABLE ROW LEVEL SECURITY;

-- Allow public read & full admin access (service role / admin session)
DROP POLICY IF EXISTS "Allow all read on branches" ON public.branches;
DROP POLICY IF EXISTS "Allow all write on branches" ON public.branches;
CREATE POLICY "Allow all read on branches" ON public.branches FOR SELECT USING (true);
CREATE POLICY "Allow all write on branches" ON public.branches FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all read on staff_members" ON public.staff_members;
DROP POLICY IF EXISTS "Allow all write on staff_members" ON public.staff_members;
CREATE POLICY "Allow all read on staff_members" ON public.staff_members FOR SELECT USING (true);
CREATE POLICY "Allow all write on staff_members" ON public.staff_members FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all read on system_roles" ON public.system_roles;
DROP POLICY IF EXISTS "Allow all write on system_roles" ON public.system_roles;
CREATE POLICY "Allow all read on system_roles" ON public.system_roles FOR SELECT USING (true);
CREATE POLICY "Allow all write on system_roles" ON public.system_roles FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all read on suppliers" ON public.suppliers;
DROP POLICY IF EXISTS "Allow all write on suppliers" ON public.suppliers;
CREATE POLICY "Allow all read on suppliers" ON public.suppliers FOR SELECT USING (true);
CREATE POLICY "Allow all write on suppliers" ON public.suppliers FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all read on expenses" ON public.expenses;
DROP POLICY IF EXISTS "Allow all write on expenses" ON public.expenses;
CREATE POLICY "Allow all read on expenses" ON public.expenses FOR SELECT USING (true);
CREATE POLICY "Allow all write on expenses" ON public.expenses FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all read on purchase_orders" ON public.purchase_orders;
DROP POLICY IF EXISTS "Allow all write on purchase_orders" ON public.purchase_orders;
CREATE POLICY "Allow all read on purchase_orders" ON public.purchase_orders FOR SELECT USING (true);
CREATE POLICY "Allow all write on purchase_orders" ON public.purchase_orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Allow all read on goods_receipts" ON public.goods_receipts;
DROP POLICY IF EXISTS "Allow all write on goods_receipts" ON public.goods_receipts;
CREATE POLICY "Allow all read on goods_receipts" ON public.goods_receipts FOR SELECT USING (true);
CREATE POLICY "Allow all write on goods_receipts" ON public.goods_receipts FOR ALL USING (true);

-- ==============================================================================
-- 11. INITIAL SEED DATA
-- ==============================================================================

-- Seed Branches
INSERT INTO public.branches (id, code, name, manager_name, phone, email, address, city, region, is_main, is_active, staff_count, inventory_val, daily_sales)
VALUES
('br-01', 'BR-HQ01', 'QuardCube HQ & Innovation Hub', 'Framani Mwamba', '+255623893383', 'hq@quardcubelabs.co.tz', 'Kigamboni Tech Avenue, Plot 42', 'Dar es Salaam', 'Dar es Salaam', TRUE, TRUE, 8, 145000000, 12500000),
('br-02', 'BR-CT02', 'City Mall Flagship Store', 'Sarah Kweka', '+255754123456', 'citymall@quardcubelabs.co.tz', 'Shop 14, 1st Floor, City Mall, Bibi Titi Rd', 'Dar es Salaam', 'Dar es Salaam', FALSE, TRUE, 5, 85000000, 8200000),
('br-03', 'BR-KK03', 'Kariakoo Wholesale Depot', 'Bakari Juma', '+255788990011', 'kariakoo@quardcubelabs.co.tz', 'Msimbazi & Uhuru Street Crossing', 'Dar es Salaam', 'Dar es Salaam', FALSE, TRUE, 6, 210000000, 18400000),
('br-04', 'BR-AR04', 'Arusha Northern Branch', 'Grace Mollel', '+255762334455', 'arusha@quardcubelabs.co.tz', 'Sokoine Road, Opposite Clock Tower', 'Arusha', 'Arusha', FALSE, TRUE, 4, 62000000, 5100000)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  manager_name = EXCLUDED.manager_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  region = EXCLUDED.region,
  is_main = EXCLUDED.is_main,
  is_active = EXCLUDED.is_active,
  staff_count = EXCLUDED.staff_count,
  inventory_val = EXCLUDED.inventory_val,
  daily_sales = EXCLUDED.daily_sales;

-- Seed Staff Members
INSERT INTO public.staff_members (id, staff_code, full_name, email, phone, role, branch_id, branch_name, status, joined_date, last_active)
VALUES
('stf-01', 'STF-101', 'Framani Mwamba', 'framani@quardcubelabs.co.tz', '+255623893383', 'owner_admin', 'br-01', 'QuardCube HQ & Innovation Hub', 'active', '2024-01-15', 'Just now'),
('stf-02', 'STF-102', 'Sarah Kweka', 'sarah.k@quardcubelabs.co.tz', '+255754123456', 'manager', 'br-02', 'City Mall Flagship Store', 'active', '2024-03-10', '10 mins ago'),
('stf-03', 'STF-103', 'David Kimaro', 'david.k@quardcubelabs.co.tz', '+255762112233', 'accountant', 'br-01', 'QuardCube HQ & Innovation Hub', 'active', '2024-02-01', '25 mins ago'),
('stf-04', 'STF-104', 'Bakari Juma', 'bakari.j@quardcubelabs.co.tz', '+255788990011', 'stock_manager', 'br-03', 'Kariakoo Wholesale Depot', 'active', '2024-04-18', '1 hour ago'),
('stf-05', 'STF-105', 'Amina Rashid', 'amina.r@quardcubelabs.co.tz', '+255714556677', 'cashier', 'br-02', 'City Mall Flagship Store', 'active', '2024-06-01', '5 mins ago'),
('stf-06', 'STF-106', 'Grace Mollel', 'grace.m@quardcubelabs.co.tz', '+255762334455', 'manager', 'br-04', 'Arusha Northern Branch', 'active', '2024-05-12', '2 hours ago'),
('stf-07', 'STF-107', 'Kelvin Mushi', 'kelvin.m@quardcubelabs.co.tz', '+255755889900', 'cashier', 'br-01', 'QuardCube HQ & Innovation Hub', 'active', '2024-07-20', '15 mins ago'),
('stf-08', 'STF-108', 'Neema Lyimo', 'neema.l@quardcubelabs.co.tz', '+255768223344', 'cashier', 'br-03', 'Kariakoo Wholesale Depot', 'active', '2024-08-10', '30 mins ago')
ON CONFLICT (staff_code) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  role = EXCLUDED.role,
  branch_id = EXCLUDED.branch_id,
  branch_name = EXCLUDED.branch_name,
  status = EXCLUDED.status;

-- Seed System Roles
INSERT INTO public.system_roles (id, name, description, badge, permissions, is_system)
VALUES
(
  'owner_admin',
  'Owner / Executive Admin',
  'Unrestricted master access to all enterprise infrastructure, financials, staff, security, and configurations.',
  'Master',
  '["dashboard:view", "analytics:view", "cctv:view", "cctv:manage", "bonds:view", "bonds:manage", "reports:view", "reports:generate", "blogs:view", "blogs:manage", "users:view", "users:manage", "products:view", "products:manage", "orders:view", "orders:manage", "invoices:view", "invoices:manage", "proforma:view", "proforma:manage", "receipts:view", "receipts:manage", "quotations:view", "quotations:manage", "services:view", "services:manage", "inventory:view", "inventory:manage", "purchases:view", "purchases:manage", "suppliers:view", "suppliers:manage", "expenses:view", "expenses:manage", "projects:view", "projects:manage", "positions:view", "positions:manage", "applications:view", "applications:manage", "branches:view", "branches:manage", "staff:view", "staff:manage", "roles:view", "roles:manage", "settings:view", "settings:manage"]'::jsonb,
  TRUE
),
(
  'manager',
  'Operations Manager',
  'Supervises multi-branch retail sales, orders, quotations, field installations, inventory, and staff rosters.',
  'Managerial',
  '["dashboard:view", "analytics:view", "cctv:view", "cctv:manage", "reports:view", "reports:generate", "users:view", "users:manage", "products:view", "products:manage", "orders:view", "orders:manage", "invoices:view", "invoices:manage", "proforma:view", "proforma:manage", "receipts:view", "quotations:view", "quotations:manage", "services:view", "services:manage", "inventory:view", "inventory:manage", "purchases:view", "suppliers:view", "expenses:view", "branches:view", "staff:view"]'::jsonb,
  TRUE
),
(
  'accountant',
  'Financial Controller / Accountant',
  'Complete access over invoices, proformas, receipts, expense vouchers, vendor bills, and financial ledger reports.',
  'Finance',
  '["dashboard:view", "analytics:view", "reports:view", "reports:generate", "orders:view", "invoices:view", "invoices:manage", "proforma:view", "proforma:manage", "receipts:view", "receipts:manage", "quotations:view", "expenses:view", "expenses:manage", "purchases:view", "suppliers:view", "suppliers:manage", "branches:view"]'::jsonb,
  TRUE
),
(
  'stock_manager',
  'Warehouse & Inventory Controller',
  'Manages warehouse stock movements, purchase order receiving (GRN), transfers, and supplier logistics.',
  'Logistics',
  '["dashboard:view", "products:view", "products:manage", "inventory:view", "inventory:manage", "purchases:view", "purchases:manage", "suppliers:view", "branches:view"]'::jsonb,
  TRUE
),
(
  'cashier',
  'Point of Sale (POS) Cashier',
  'Processes walk-in and retail sales, receives client payments, and prints official receipts and invoices.',
  'Front Office',
  '["dashboard:view", "products:view", "orders:view", "orders:manage", "invoices:view", "receipts:view", "receipts:manage", "quotations:view"]'::jsonb,
  TRUE
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  badge = EXCLUDED.badge,
  permissions = EXCLUDED.permissions;

-- Seed Suppliers
INSERT INTO public.suppliers (id, supplier_code, name, company_name, email, phone, address, city, country, tin_number, vat_number, payment_terms, opening_balance, current_balance, total_purchases_amount, total_orders_count, status)
VALUES
('sup-hik-001', 'SUP-HIK-001', 'Hikvision East Africa Logistics', 'Hikvision Digital Technology Co.', 'sales.ea@hikvision.com', '+255 768 111 222', 'Ali Hassan Mwinyi Rd, Victoria', 'Dar es Salaam', 'Tanzania', '102-394-881', 'VRN-40019283', 'Net 30', 0, 4500000, 42000000, 14, 'active'),
('sup-asus-002', 'SUP-ASUS-002', 'ASUS Middle East & Africa FZE', 'ASUSTeK Computer Inc.', 'distribution@asus.me', '+971 4 299 1234', 'JAFZA South Zone 4', 'Dubai', 'UAE', '990-234-112', 'VRN-99882211', 'Net 45', 0, 12800000, 28500000, 8, 'active'),
('sup-tplink-003', 'SUP-TPLINK-003', 'TP-Link Tanzania Official Distributor', 'TP-Link Technologies Africa', 'orders.tz@tp-link.com', '+255 712 345 678', 'Nyerere Road, Industrial Area', 'Dar es Salaam', 'Tanzania', '110-554-992', 'VRN-40098213', 'Net 15', 0, 1800000, 14200000, 6, 'active'),
('sup-dahua-004', 'SUP-DAHUA-004', 'Dahua Technology Tanzania Depot', 'Zhejiang Dahua Technology Co.', 'tanzania@dahuatech.com', '+255 744 555 666', 'Bagamoyo Road, Mwenge', 'Dar es Salaam', 'Tanzania', '105-882-334', 'VRN-40055211', 'Net 30', 0, 0, 15200000, 5, 'active')
ON CONFLICT (supplier_code) DO UPDATE SET
  name = EXCLUDED.name,
  company_name = EXCLUDED.company_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  address = EXCLUDED.address,
  city = EXCLUDED.city,
  country = EXCLUDED.country,
  tin_number = EXCLUDED.tin_number,
  vat_number = EXCLUDED.vat_number,
  payment_terms = EXCLUDED.payment_terms,
  current_balance = EXCLUDED.current_balance,
  total_purchases_amount = EXCLUDED.total_purchases_amount,
  total_orders_count = EXCLUDED.total_orders_count,
  status = EXCLUDED.status;

-- Seed Expenses
INSERT INTO public.expenses (id, expense_number, category, amount, tax_amount, expense_date, vendor_name, payment_method, payment_reference, description, status, is_billable, recorded_by, branch_id)
VALUES
('exp-001', 'QCL-EXP-2026-0101', 'Internet & Telecom', 450000, 81000, CURRENT_DATE - INTERVAL '5 days', 'Liquid Intelligent Technologies / TTCL', 'Bank Transfer', 'TX-INTERNET-SEP26', 'Dedicated optical fiber broadband and static IP block subscription', 'paid', FALSE, 'Administrator', 'br-01'),
('exp-002', 'QCL-EXP-2026-0102', 'Electricity & Water', 320000, 0, CURRENT_DATE - INTERVAL '12 days', 'TANESCO LUKU Commercial', 'Mobile Money', 'MP-LUKU-992812', 'Hub and testing lab three-phase prepaid power tokens', 'paid', FALSE, 'Administrator', 'br-01'),
('exp-003', 'QCL-EXP-2026-0103', 'Software & Cloud Services', 680000, 0, CURRENT_DATE - INTERVAL '18 days', 'Supabase & AWS Cloud Infrastructure', 'Credit Card', 'CC-AWS-009212', 'Cloud database hosting, telemetry ingestion, and S3 storage', 'paid', FALSE, 'Administrator', 'br-01'),
('exp-004', 'QCL-EXP-2026-0104', 'Logistics & Fuel', 280000, 0, CURRENT_DATE - INTERVAL '22 days', 'Puma Energy Tanzania', 'Cash', 'RCP-PUMA-1029', 'Field engineering vehicle fuel & transport logistics', 'paid', FALSE, 'Administrator', 'br-03'),
('exp-005', 'QCL-EXP-2026-0105', 'Hardware Maintenance', 540000, 0, CURRENT_DATE - INTERVAL '28 days', 'Precision Calibration Labs', 'Bank Transfer', 'TX-CALIB-8821', 'Fiber fusion splicer and OTDR precision calibration', 'paid', FALSE, 'Administrator', 'br-01')
ON CONFLICT (expense_number) DO UPDATE SET
  category = EXCLUDED.category,
  amount = EXCLUDED.amount,
  tax_amount = EXCLUDED.tax_amount,
  expense_date = EXCLUDED.expense_date,
  vendor_name = EXCLUDED.vendor_name,
  payment_method = EXCLUDED.payment_method,
  payment_reference = EXCLUDED.payment_reference,
  description = EXCLUDED.description,
  status = EXCLUDED.status;

-- Seed Purchase Orders
INSERT INTO public.purchase_orders (id, po_number, supplier_id, supplier_name, supplier_email, supplier_phone, warehouse_id, warehouse_name, order_date, expected_delivery_date, items, subtotal, tax_rate, tax_amount, discount_amount, shipping_amount, total, amount_paid, balance_due, status, payment_status, notes, terms_conditions, created_by)
VALUES
(
  'po-001',
  'QCL-PO-2026-1001',
  'sup-hik-001',
  'Hikvision East Africa Logistics',
  'sales.ea@hikvision.com',
  '+255 768 111 222',
  'wh-dar-main',
  'QuardCube Central Hub — Kigamboni',
  CURRENT_DATE - INTERVAL '10 days',
  CURRENT_DATE + INTERVAL '5 days',
  '[{"id": "item-1", "name": "Hikvision 4K AcuSense ColorVu IP Dome Camera", "quantity": 10, "unit_cost": 285000, "total_cost": 2850000, "received_quantity": 10}, {"id": "item-2", "name": "Hikvision 16-Channel 4K NVR Network Video Recorder", "quantity": 2, "unit_cost": 850000, "total_cost": 1700000, "received_quantity": 2}]'::jsonb,
  4550000,
  18,
  819000,
  0,
  50000,
  5419000,
  5419000,
  0,
  'received',
  'paid',
  'Direct container shipment for commercial surveillance installations',
  'Standard Manufacturer 2-Year Replacement Warranty',
  'Administrator'
),
(
  'po-002',
  'QCL-PO-2026-1002',
  'sup-asus-002',
  'ASUS Middle East & Africa FZE',
  'distribution@asus.me',
  '+971 4 299 1234',
  'wh-dar-main',
  'QuardCube Central Hub — Kigamboni',
  CURRENT_DATE - INTERVAL '3 days',
  CURRENT_DATE + INTERVAL '12 days',
  '[{"id": "item-3", "name": "ASUS ExpertCenter D7 Mini Tower Core i7 Workstation", "quantity": 5, "unit_cost": 1850000, "total_cost": 9250000, "received_quantity": 0}]'::jsonb,
  9250000,
  18,
  1665000,
  200000,
  150000,
  10865000,
  5000000,
  5865000,
  'ordered',
  'partially_paid',
  'Air freight dispatch via Dubai Logistics Hub',
  'Standard ASUS Commercial 3-Year On-Site Service Warranty',
  'Administrator'
)
ON CONFLICT (po_number) DO UPDATE SET
  supplier_name = EXCLUDED.supplier_name,
  items = EXCLUDED.items,
  subtotal = EXCLUDED.subtotal,
  tax_amount = EXCLUDED.tax_amount,
  total = EXCLUDED.total,
  amount_paid = EXCLUDED.amount_paid,
  balance_due = EXCLUDED.balance_due,
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status;
