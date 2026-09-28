-- Proforma Invoices Table
CREATE TABLE IF NOT EXISTS public.proforma_invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    proforma_number TEXT NOT NULL UNIQUE,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(5, 2) DEFAULT 0.00,
    tax_amount NUMERIC(15, 2) DEFAULT 0.00,
    discount NUMERIC(15, 2) DEFAULT 0.00,
    total NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'converted', 'expired')),
    template_id TEXT NOT NULL DEFAULT 'modern-corporate',
    valid_until TIMESTAMPTZ,
    payment_terms TEXT,
    notes TEXT,
    converted_invoice_id TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Receipts Table
CREATE TABLE IF NOT EXISTS public.receipts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receipt_number TEXT NOT NULL UNIQUE,
    user_id TEXT,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT,
    customer_address TEXT,
    invoice_number TEXT,
    order_number TEXT,
    amount_paid NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    payment_method TEXT NOT NULL DEFAULT 'M-Pesa' CHECK (payment_method IN ('M-Pesa', 'Airtel Money', 'Tigo Pesa', 'Bank Transfer', 'Credit Card', 'Cash', 'Direct Settlement')),
    transaction_ref TEXT,
    payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    notes TEXT,
    template_id TEXT NOT NULL DEFAULT 'modern-corporate',
    status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'refunded', 'voided')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.proforma_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.receipts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated admin full access to proforma_invoices" 
    ON public.proforma_invoices FOR ALL USING (true);

CREATE POLICY "Allow authenticated admin full access to receipts" 
    ON public.receipts FOR ALL USING (true);
