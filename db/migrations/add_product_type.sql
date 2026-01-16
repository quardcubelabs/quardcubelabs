-- Add product type column to products table
-- This migration adds a type field to distinguish between physical and service products

-- Add the type column with a default value
ALTER TABLE products 
ADD COLUMN type VARCHAR(20) DEFAULT 'physical' CHECK (type IN ('physical', 'service'));

-- Update existing products based on their categories
-- You can adjust these categories based on your actual data
UPDATE products 
SET type = 'service' 
WHERE category IN ('Web Development', 'Mobile Development', 'Cloud Solutions', 'IT Consulting', 'Digital Marketing', 'UI/UX Design');

UPDATE products 
SET type = 'physical' 
WHERE category IN ('Networking', 'Hardware', 'Security', 'Power Solutions', 'Computers', 'Accessories');

-- Make the type column NOT NULL after setting values
ALTER TABLE products 
ALTER COLUMN type SET NOT NULL;