-- Migration: Create products and categories tables
-- QuardCube Labs - Products and Categories Schema
-- Run this migration in your Supabase SQL Editor

-- Create categories table first (products references it)
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  image TEXT NOT NULL,
  description TEXT,
  features TEXT[] DEFAULT '{}',
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  rating DECIMAL(3,2) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
  swatch_images TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key constraint (optional - can be category name instead of ID)
-- ALTER TABLE products ADD CONSTRAINT fk_products_category 
-- FOREIGN KEY (category) REFERENCES categories(name) ON UPDATE CASCADE;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_name ON products(name);
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS) for Supabase
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access (shop page)
CREATE POLICY "Allow anonymous read access to categories" ON categories
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read access to products" ON products
    FOR SELECT TO anon USING (true);

-- Create policies for authenticated users (authenticated users can read)
CREATE POLICY "Allow authenticated read access to categories" ON categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated read access to products" ON products
    FOR SELECT TO authenticated USING (true);

-- Create policies for admin users (admin can do everything)
-- Note: You'll need to set up user roles/claims in Supabase for admin access
CREATE POLICY "Allow admin full access to categories" ON categories
    FOR ALL TO authenticated USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    );

CREATE POLICY "Allow admin full access to products" ON products
    FOR ALL TO authenticated USING (
        (auth.jwt() ->> 'user_metadata')::jsonb ->> 'role' = 'admin'
    );

-- Insert some default categories
INSERT INTO categories (name) VALUES
('Laptops'),
('Desktops'),
('Gaming'),
('Components'),
('Peripherals'),
('Storage'),
('Networking'),
('Monitors'),
('Printers'),
('Accessories')
ON CONFLICT (name) DO NOTHING;

-- Verify tables were created successfully
SELECT 'Categories table created with' as info, COUNT(*) as count FROM categories;
SELECT 'Products table structure:' as info;
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;