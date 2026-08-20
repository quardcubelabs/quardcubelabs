-- Create quotations table for admin-created customer quotations
-- Run this script in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS quotations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    quote_number VARCHAR(50) UNIQUE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    items JSONB NOT NULL DEFAULT '[]',
    total DECIMAL(15, 2) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'declined', 'expired')),
    customer_name VARCHAR(255) NOT NULL,
    customer_email VARCHAR(255) NOT NULL,
    customer_phone VARCHAR(50),
    customer_address TEXT,
    notes TEXT,
    valid_until TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_quote_number ON quotations(quote_number);

-- Enable Row Level Security
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Policy for admins to manage all quotations
CREATE POLICY "Admins can manage all quotations" ON quotations
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data->>'role' = 'admin' 
                 OR auth.users.raw_user_meta_data->>'is_admin' = 'true')
        )
    );

-- Policy for users to view their own quotations
CREATE POLICY "Users can view their own quotations" ON quotations
    FOR SELECT
    USING (auth.uid() = user_id);

-- Create trigger to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_quotations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_quotations_updated_at
    BEFORE UPDATE ON quotations
    FOR EACH ROW
    EXECUTE FUNCTION update_quotations_updated_at();

-- Grant necessary permissions
GRANT ALL ON quotations TO authenticated;
GRANT ALL ON quotations TO service_role;

-- Comment on table
COMMENT ON TABLE quotations IS 'Admin-created quotations for customer products and services';
COMMENT ON COLUMN quotations.quote_number IS 'Unique quotation number (e.g., QCL-QT-YYYY-XXXX)';
COMMENT ON COLUMN quotations.items IS 'JSON array of quote items with id, name, type (product/service/custom), quantity, price, image/description';
COMMENT ON COLUMN quotations.status IS 'Quotation status: draft, sent, accepted, declined, expired';
