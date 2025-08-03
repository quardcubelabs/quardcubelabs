-- Update projects table with complete data from the actual website
-- This script inserts all 6 projects from lib/data.ts into the database

-- First clear existing data
DELETE FROM projects;

-- Insert all 6 projects with complete data
INSERT INTO projects (
  title, 
  client, 
  description, 
  short_description, 
  technologies, 
  category, 
  status, 
  project_url, 
  github_url, 
  image_url, 
  start_date, 
  end_date, 
  budget, 
  team_size, 
  featured, 
  order_index,
  meta_title,
  meta_description,
  slug
) VALUES 

-- Project 1: Enterprise Resource Planning System
(
  'Enterprise Resource Planning System',
  'Global Manufacturing Corporation',
  'Developed and implemented a comprehensive ERP solution for a manufacturing company with operations in 12 countries. The system integrated production, inventory, sales, and financial data into a unified platform, providing real-time insights and streamlining operations.',
  'Comprehensive ERP solution for global manufacturing operations',
  '["React", "Node.js", "MongoDB", "Docker", "Kubernetes", "Azure Cloud"]'::jsonb,
  'Software Development',
  'completed',
  null,
  null,
  '/images/projects/erp-system.jpg',
  '2022-01-15',
  '2023-06-30',
  150000.00,
  8,
  true,
  1,
  'Enterprise Resource Planning System | QuardCube Labs',
  'Comprehensive ERP solution for global manufacturing with 40% efficiency increase and 25% cost reduction.',
  'enterprise-resource-planning-system'
),

-- Project 2: E-commerce Platform Redesign
(
  'E-commerce Platform Redesign',
  'Fashion Retail Brand',
  'Complete redesign of an e-commerce platform for a leading fashion retail brand, focusing on user experience, mobile responsiveness, and conversion optimization.',
  'Modern e-commerce platform redesign with mobile-first approach',
  '["Next.js", "Tailwind CSS", "Shopify", "Stripe", "Algolia Search"]'::jsonb,
  'Web Designing',
  'completed',
  'https://demo-ecommerce.vercel.app',
  null,
  '/images/projects/ecommerce-redesign.jpg',
  '2023-01-01',
  '2023-06-30',
  75000.00,
  5,
  true,
  2,
  'E-commerce Platform Redesign | QuardCube Labs',
  'Fashion retail e-commerce redesign with 35% conversion rate increase and 50% mobile engagement improvement.',
  'ecommerce-platform-redesign'
),

-- Project 3: Secure Banking Infrastructure
(
  'Secure Banking Infrastructure',
  'Regional Banking Network',
  'Designed and implemented a comprehensive security infrastructure for a regional banking network with 50+ branches. The solution included advanced encryption, multi-factor authentication, and real-time threat monitoring.',
  'Comprehensive banking security infrastructure with advanced encryption',
  '["Cisco Security", "Palo Alto Networks", "Okta", "Splunk", "Encryption Technologies", "Biometric Authentication"]'::jsonb,
  'Security Products',
  'completed',
  null,
  null,
  '/images/projects/banking-security.jpg',
  '2022-03-01',
  '2023-02-28',
  200000.00,
  10,
  true,
  3,
  'Secure Banking Infrastructure | QuardCube Labs',
  'Regional banking security infrastructure with zero breaches and 100% compliance.',
  'secure-banking-infrastructure'
),

-- Project 4: Smart Grid Power Management
(
  'Smart Grid Power Management',
  'Commercial Real Estate Developer',
  'Developed and implemented a smart grid power management system for a large commercial real estate portfolio, integrating renewable energy sources and advanced monitoring capabilities.',
  'Smart grid power management with renewable energy integration',
  '["IoT Sensors", "Energy Management Systems", "Solar Integration", "Battery Storage", "AI/ML Algorithms", "Cloud Analytics"]'::jsonb,
  'Power Solutions',
  'completed',
  null,
  null,
  '/images/projects/smart-grid.jpg',
  '2023-02-01',
  '2024-04-30',
  120000.00,
  6,
  true,
  4,
  'Smart Grid Power Management | QuardCube Labs',
  'Smart grid power management with 25% consumption reduction and 40% cost savings.',
  'smart-grid-power-management'
),

-- Project 5: Corporate Network Infrastructure
(
  'Corporate Network Infrastructure',
  'Global Consulting Firm',
  'Designed and implemented a scalable network infrastructure for a multinational consulting firm with 20+ offices worldwide. The solution provided secure, high-performance connectivity while supporting remote work capabilities.',
  'Global network infrastructure with SD-WAN and remote work support',
  '["Cisco SD-WAN", "Meraki", "Azure Virtual WAN", "Zero Trust Security", "Cloud Connectivity", "Global VPN"]'::jsonb,
  'Connectivity & Networking',
  'completed',
  null,
  null,
  '/images/projects/network-infrastructure.jpg',
  '2022-06-01',
  '2023-01-31',
  180000.00,
  7,
  true,
  5,
  'Corporate Network Infrastructure | QuardCube Labs',
  'Global network infrastructure with 99.99% uptime and 60% performance improvement.',
  'corporate-network-infrastructure'
),

-- Project 6: Healthcare IT System Integration
(
  'Healthcare IT System Integration',
  'Regional Healthcare Provider',
  'Integrated various healthcare IT systems to create a unified platform for patient data management and analytics, improving care coordination and operational efficiency.',
  'Healthcare IT systems integration with unified patient data platform',
  '["HL7 FHIR", "Interoperability APIs", "Healthcare Data Warehouse", "HIPAA-Compliant Cloud", "Clinical Analytics", "Secure Messaging"]'::jsonb,
  'IT Products & Services',
  'completed',
  null,
  null,
  '/images/projects/healthcare-it.jpg',
  '2023-03-01',
  '2023-12-31',
  160000.00,
  8,
  true,
  6,
  'Healthcare IT System Integration | QuardCube Labs',
  'Healthcare IT integration with 45% admin reduction and 70% faster patient data access.',
  'healthcare-it-system-integration'
);

-- Update any missing slugs
UPDATE projects SET slug = LOWER(REPLACE(REPLACE(title, ' ', '-'), '&', 'and')) WHERE slug IS NULL;

-- Verify the data was inserted correctly
SELECT 
  id,
  title,
  client,
  category,
  status,
  featured,
  order_index,
  slug,
  jsonb_array_length(COALESCE(technologies, '[]'::jsonb)) as tech_count,
  start_date,
  end_date,
  budget,
  team_size
FROM projects 
ORDER BY order_index;

-- Display summary
SELECT 
  COUNT(*) as total_projects,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
  COUNT(CASE WHEN featured = true THEN 1 END) as featured_projects,
  COUNT(DISTINCT category) as categories
FROM projects;

COMMENT ON TABLE projects IS 'Portfolio projects for QuardCube Labs - migrated from static data to database on August 3, 2025';
