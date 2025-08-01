-- Add professional order number to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS order_number VARCHAR(20) UNIQUE;

-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1000;

-- Create a function to generate professional order numbers
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(20) AS $$
DECLARE
    next_val INTEGER;
    current_year INTEGER;
    order_num VARCHAR(20);
BEGIN
    -- Get the current year
    current_year := EXTRACT(YEAR FROM CURRENT_DATE);
    
    -- Get the next sequence value
    next_val := nextval('order_number_seq');
    
    -- Format: QCL-YYYY-NNNN (e.g., QCL-2024-1001)
    order_num := 'QCL-' || current_year || '-' || LPAD(next_val::TEXT, 4, '0');
    
    RETURN order_num;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to automatically generate order numbers
CREATE OR REPLACE FUNCTION set_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_set_order_number ON orders;
CREATE TRIGGER trigger_set_order_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION set_order_number();

-- Update existing orders without order numbers
UPDATE orders 
SET order_number = generate_order_number() 
WHERE order_number IS NULL;
