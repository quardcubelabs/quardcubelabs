-- Sample data for analytics dashboard
-- This file creates sample orders to demonstrate the analytics functionality

-- First, let's create some sample orders with realistic data
INSERT INTO orders (
  id,
  user_id,
  date,
  status,
  items,
  total,
  "customerName",
  "customerEmail",
  "shippingAddress",
  created_at
) VALUES 
-- Recent orders (last 30 days)
(
  gen_random_uuid(),
  'sample-user-1',
  CURRENT_TIMESTAMP - INTERVAL '2 days',
  'completed',
  '[
    {"name": "Website Development Package", "price": 2500, "quantity": 1},
    {"name": "SEO Optimization", "price": 500, "quantity": 1}
  ]'::jsonb,
  '3000',
  'John Smith',
  'john.smith@example.com',
  '123 Main St, Dar es Salaam, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '2 days'
),
(
  gen_random_uuid(),
  'sample-user-2',
  CURRENT_TIMESTAMP - INTERVAL '5 days',
  'processing',
  '[
    {"name": "Mobile App Development", "price": 5000, "quantity": 1}
  ]'::jsonb,
  '5000',
  'Sarah Johnson',
  'sarah.johnson@example.com',
  '456 Business Ave, Arusha, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '5 days'
),
(
  gen_random_uuid(),
  'sample-user-3',
  CURRENT_TIMESTAMP - INTERVAL '7 days',
  'completed',
  '[
    {"name": "E-commerce Platform", "price": 3500, "quantity": 1},
    {"name": "Payment Integration", "price": 800, "quantity": 1}
  ]'::jsonb,
  '4300',
  'Michael Brown',
  'michael.brown@example.com',
  '789 Tech Plaza, Mwanza, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '7 days'
),
(
  gen_random_uuid(),
  'sample-user-4',
  CURRENT_TIMESTAMP - INTERVAL '10 days',
  'completed',
  '[
    {"name": "Brand Identity Design", "price": 1200, "quantity": 1},
    {"name": "Logo Design", "price": 500, "quantity": 1}
  ]'::jsonb,
  '1700',
  'Emily Davis',
  'emily.davis@example.com',
  '321 Creative St, Dodoma, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '10 days'
),
(
  gen_random_uuid(),
  'sample-user-5',
  CURRENT_TIMESTAMP - INTERVAL '12 days',
  'pending',
  '[
    {"name": "Digital Marketing Strategy", "price": 2000, "quantity": 1}
  ]'::jsonb,
  '2000',
  'David Wilson',
  'david.wilson@example.com',
  '654 Marketing Blvd, Mbeya, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '12 days'
),
(
  gen_random_uuid(),
  'sample-user-6',
  CURRENT_TIMESTAMP - INTERVAL '15 days',
  'completed',
  '[
    {"name": "Custom Software Development", "price": 7500, "quantity": 1}
  ]'::jsonb,
  '7500',
  'Lisa Anderson',
  'lisa.anderson@example.com',
  '987 Software Park, Morogoro, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '15 days'
),
(
  gen_random_uuid(),
  'sample-user-7',
  CURRENT_TIMESTAMP - INTERVAL '18 days',
  'completed',
  '[
    {"name": "Website Redesign", "price": 1800, "quantity": 1},
    {"name": "Content Management System", "price": 1200, "quantity": 1}
  ]'::jsonb,
  '3000',
  'Robert Taylor',
  'robert.taylor@example.com',
  '147 Design District, Iringa, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '18 days'
),
(
  gen_random_uuid(),
  'sample-user-8',
  CURRENT_TIMESTAMP - INTERVAL '20 days',
  'processing',
  '[
    {"name": "Data Analytics Platform", "price": 4500, "quantity": 1}
  ]'::jsonb,
  '4500',
  'Jennifer Martinez',
  'jennifer.martinez@example.com',
  '258 Analytics Ave, Shinyanga, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '20 days'
),
(
  gen_random_uuid(),
  'sample-user-9',
  CURRENT_TIMESTAMP - INTERVAL '22 days',
  'completed',
  '[
    {"name": "Cloud Infrastructure Setup", "price": 3200, "quantity": 1},
    {"name": "Security Audit", "price": 800, "quantity": 1}
  ]'::jsonb,
  '4000',
  'Christopher Lee',
  'christopher.lee@example.com',
  '369 Cloud Street, Singida, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '22 days'
),
(
  gen_random_uuid(),
  'sample-user-10',
  CURRENT_TIMESTAMP - INTERVAL '25 days',
  'completed',
  '[
    {"name": "Mobile App UI/UX Design", "price": 2200, "quantity": 1}
  ]'::jsonb,
  '2200',
  'Amanda White',
  'amanda.white@example.com',
  '741 Design Hub, Tabora, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '25 days'
),

-- Older orders (30-60 days ago) for growth comparison
(
  gen_random_uuid(),
  'sample-user-11',
  CURRENT_TIMESTAMP - INTERVAL '35 days',
  'completed',
  '[
    {"name": "Website Development Package", "price": 2500, "quantity": 1}
  ]'::jsonb,
  '2500',
  'Mark Thompson',
  'mark.thompson@example.com',
  '852 Previous Month St, Kigoma, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '35 days'
),
(
  gen_random_uuid(),
  'sample-user-12',
  CURRENT_TIMESTAMP - INTERVAL '40 days',
  'completed',
  '[
    {"name": "E-commerce Platform", "price": 3500, "quantity": 1}
  ]'::jsonb,
  '3500',
  'Rachel Green',
  'rachel.green@example.com',
  '963 Past Order Ave, Rukwa, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '40 days'
),
(
  gen_random_uuid(),
  'sample-user-13',
  CURRENT_TIMESTAMP - INTERVAL '45 days',
  'completed',
  '[
    {"name": "Brand Identity Design", "price": 1200, "quantity": 1}
  ]'::jsonb,
  '1200',
  'Kevin Miller',
  'kevin.miller@example.com',
  '159 Growth Street, Katavi, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '45 days'
),
(
  gen_random_uuid(),
  'sample-user-14',
  CURRENT_TIMESTAMP - INTERVAL '50 days',
  'cancelled',
  '[
    {"name": "Digital Marketing Strategy", "price": 2000, "quantity": 1}
  ]'::jsonb,
  '2000',
  'Nicole Johnson',
  'nicole.johnson@example.com',
  '357 Cancelled Order Rd, Njombe, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '50 days'
),
(
  gen_random_uuid(),
  'sample-user-15',
  CURRENT_TIMESTAMP - INTERVAL '55 days',
  'completed',
  '[
    {"name": "Custom Software Development", "price": 7500, "quantity": 1}
  ]'::jsonb,
  '7500',
  'Steven Davis',
  'steven.davis@example.com',
  '468 Previous Period Blvd, Songwe, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '55 days'
),

-- Some refunded orders
(
  gen_random_uuid(),
  'sample-user-16',
  CURRENT_TIMESTAMP - INTERVAL '8 days',
  'refunded',
  '[
    {"name": "Website Development Package", "price": 2500, "quantity": 1}
  ]'::jsonb,
  '2500',
  'Michelle Wilson',
  'michelle.wilson@example.com',
  '579 Refund Street, Geita, Tanzania',
  CURRENT_TIMESTAMP - INTERVAL '8 days'
);

-- Update the order_number column for all sample orders
UPDATE orders 
SET order_number = 'QCL-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM created_at)::text, 3, '0') || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 4, '0')
WHERE order_number IS NULL;

-- Create some additional monthly revenue data by inserting historical orders
INSERT INTO orders (
  id,
  user_id,
  date,
  status,
  items,
  total,
  "customerName",
  "customerEmail",
  "shippingAddress",
  created_at
) VALUES 
-- November 2024 data
(
  gen_random_uuid(),
  'sample-user-nov-1',
  '2024-11-15'::timestamp,
  'completed',
  '[{"name": "Website Development Package", "price": 2500, "quantity": 1}]'::jsonb,
  '2500',
  'November Customer 1',
  'nov1@example.com',
  'November Address 1',
  '2024-11-15'::timestamp
),
(
  gen_random_uuid(),
  'sample-user-nov-2',
  '2024-11-20'::timestamp,
  'completed',
  '[{"name": "Mobile App Development", "price": 5000, "quantity": 1}]'::jsonb,
  '5000',
  'November Customer 2',
  'nov2@example.com',
  'November Address 2',
  '2024-11-20'::timestamp
),

-- December 2024 data
(
  gen_random_uuid(),
  'sample-user-dec-1',
  '2024-12-10'::timestamp,
  'completed',
  '[{"name": "E-commerce Platform", "price": 3500, "quantity": 1}]'::jsonb,
  '3500',
  'December Customer 1',
  'dec1@example.com',
  'December Address 1',
  '2024-12-10'::timestamp
),
(
  gen_random_uuid(),
  'sample-user-dec-2',
  '2024-12-25'::timestamp,
  'completed',
  '[{"name": "Brand Identity Design", "price": 1200, "quantity": 1}, {"name": "Logo Design", "price": 500, "quantity": 1}]'::jsonb,
  '1700',
  'December Customer 2',
  'dec2@example.com',
  'December Address 2',
  '2024-12-25'::timestamp
),

-- January 2025 data
(
  gen_random_uuid(),
  'sample-user-jan-1',
  '2025-01-05'::timestamp,
  'completed',
  '[{"name": "Digital Marketing Strategy", "price": 2000, "quantity": 1}]'::jsonb,
  '2000',
  'January Customer 1',
  'jan1@example.com',
  'January Address 1',
  '2025-01-05'::timestamp
),
(
  gen_random_uuid(),
  'sample-user-jan-2',
  '2025-01-20'::timestamp,
  'completed',
  '[{"name": "Custom Software Development", "price": 7500, "quantity": 1}]'::jsonb,
  '7500',
  'January Customer 2',
  'jan2@example.com',
  'January Address 2',
  '2025-01-20'::timestamp
);

-- Update order numbers for historical data as well
UPDATE orders 
SET order_number = 'QCL-' || TO_CHAR(date, 'YYYY') || '-' || LPAD(EXTRACT(DOY FROM date)::text, 3, '0') || '-' || LPAD((ROW_NUMBER() OVER (ORDER BY date))::text, 4, '0')
WHERE order_number IS NULL;
