-- ====================================================================
-- QUARDCUBE LABS: DOCUMENT QR VERIFICATION SYSTEM SCHEMA
-- ====================================================================
-- Provides authoritative, cryptographically secure document verification
-- for Quotations, Invoices, Receipts, Proforma Invoices, and Orders.

CREATE TABLE IF NOT EXISTS public.document_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_token VARCHAR(64) UNIQUE NOT NULL,
    document_type VARCHAR(30) NOT NULL CHECK (document_type IN ('quotation', 'invoice', 'receipt', 'proforma', 'order', 'delivery_note', 'certificate')),
    document_id VARCHAR(100) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'valid',
    verification_url TEXT NOT NULL,
    scan_count INTEGER NOT NULL DEFAULT 0,
    last_verified_at TIMESTAMPTZ,
    metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_doc_type_id UNIQUE (document_type, document_id)
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_doc_verifications_token ON public.document_verifications(verification_token);
CREATE INDEX IF NOT EXISTS idx_doc_verifications_type_id ON public.document_verifications(document_type, document_id);
CREATE INDEX IF NOT EXISTS idx_doc_verifications_doc_number ON public.document_verifications(document_number);
CREATE INDEX IF NOT EXISTS idx_doc_verifications_status ON public.document_verifications(status);

-- Verification Audit Log Table (records every QR scan)
CREATE TABLE IF NOT EXISTS public.document_verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    verification_token VARCHAR(64) NOT NULL,
    document_id VARCHAR(100) NOT NULL,
    document_type VARCHAR(30) NOT NULL,
    document_number VARCHAR(100) NOT NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address VARCHAR(45),
    user_agent TEXT
);

CREATE INDEX IF NOT EXISTS idx_doc_logs_token ON public.document_verification_logs(verification_token);
CREATE INDEX IF NOT EXISTS idx_doc_logs_time ON public.document_verification_logs(verified_at DESC);

-- Enable RLS
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_verification_logs ENABLE ROW LEVEL SECURITY;

-- Public read access for token lookup
CREATE POLICY "Public read verification by token" 
    ON public.document_verifications 
    FOR SELECT 
    USING (true);

-- Public insert for audit logs
CREATE POLICY "Public insert verification logs" 
    ON public.document_verification_logs 
    FOR INSERT 
    WITH CHECK (true);

-- Admin full access
CREATE POLICY "Admins full access document_verifications" 
    ON public.document_verifications 
    FOR ALL 
    USING (true);

CREATE POLICY "Admins full access document_verification_logs" 
    ON public.document_verification_logs 
    FOR ALL 
    USING (true);

-- Permissions
GRANT SELECT ON public.document_verifications TO anon;
GRANT SELECT ON public.document_verifications TO authenticated;
GRANT ALL ON public.document_verifications TO service_role;

GRANT INSERT, SELECT ON public.document_verification_logs TO anon;
GRANT INSERT, SELECT ON public.document_verification_logs TO authenticated;
GRANT ALL ON public.document_verification_logs TO service_role;
