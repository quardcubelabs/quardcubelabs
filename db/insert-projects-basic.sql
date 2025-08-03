-- Simple projects insertion without problematic columns
-- Only use columns that definitely exist in the base projects table

-- Clear existing projects first (optional)
-- DELETE FROM projects;

-- Insert the 6 projects with basic columns only
INSERT INTO projects (title, client, description, technologies, category, status, image_url, start_date, end_date) VALUES
('Enterprise Resource Planning System', 'Global Manufacturing Corporation', 'Developed and implemented a comprehensive ERP solution for a manufacturing company with operations in 12 countries. The system integrated production, inventory, sales, and financial data into a unified platform, providing real-time insights and streamlining operations.', '["React", "Node.js", "MongoDB", "Docker", "Kubernetes", "Azure Cloud"]'::jsonb, 'Software Development', 'completed', '/images/projects/erp-system.jpg', '2022-01-15', '2023-06-30'),

('E-commerce Platform Redesign', 'Fashion Retail Brand', 'Complete redesign of an e-commerce platform for a leading fashion retail brand, focusing on user experience, mobile responsiveness, and conversion optimization.', '["Next.js", "Tailwind CSS", "Shopify", "Stripe", "Algolia Search"]'::jsonb, 'Web Designing', 'completed', '/images/projects/ecommerce-redesign.jpg', '2023-01-01', '2023-06-30'),

('Secure Banking Infrastructure', 'Regional Banking Network', 'Designed and implemented a comprehensive security infrastructure for a regional banking network with 50+ branches. The solution included advanced encryption, multi-factor authentication, and real-time threat monitoring.', '["Cisco Security", "Palo Alto Networks", "Okta", "Splunk", "Encryption Technologies", "Biometric Authentication"]'::jsonb, 'Security Products', 'completed', '/images/projects/banking-security.jpg', '2022-03-01', '2023-02-28'),

('Smart Grid Power Management', 'Commercial Real Estate Developer', 'Developed and implemented a smart grid power management system for a large commercial real estate portfolio, integrating renewable energy sources and advanced monitoring capabilities.', '["IoT Sensors", "Energy Management Systems", "Solar Integration", "Battery Storage", "AI/ML Algorithms", "Cloud Analytics"]'::jsonb, 'Power Solutions', 'completed', '/images/projects/smart-grid.jpg', '2023-02-01', '2024-04-30'),

('Corporate Network Infrastructure', 'Global Consulting Firm', 'Designed and implemented a scalable network infrastructure for a multinational consulting firm with 20+ offices worldwide. The solution provided secure, high-performance connectivity while supporting remote work capabilities.', '["Cisco SD-WAN", "Meraki", "Azure Virtual WAN", "Zero Trust Security", "Cloud Connectivity", "Global VPN"]'::jsonb, 'Connectivity & Networking', 'completed', '/images/projects/network-infrastructure.jpg', '2022-06-01', '2023-01-31'),

('Healthcare IT System Integration', 'Regional Healthcare Provider', 'Integrated various healthcare IT systems to create a unified platform for patient data management and analytics, improving care coordination and operational efficiency.', '["HL7 FHIR", "Interoperability APIs", "Healthcare Data Warehouse", "HIPAA-Compliant Cloud", "Clinical Analytics", "Secure Messaging"]'::jsonb, 'IT Products & Services', 'completed', '/images/projects/healthcare-it.jpg', '2023-03-01', '2023-12-31')

ON CONFLICT (id) DO NOTHING;
