-- Enhanced projects table migration with all fields from the website
-- This creates a comprehensive projects table with all necessary fields

-- Drop existing table if needed (use with caution in production)
-- DROP TABLE IF EXISTS projects CASCADE;

-- Create enhanced projects table
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  description TEXT,
  short_description TEXT,
  technologies JSONB DEFAULT '[]',
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'planned', 'cancelled')),
  project_url TEXT,
  github_url TEXT,
  image_url TEXT,
  images JSONB DEFAULT '[]',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  team_size INTEGER,
  featured BOOLEAN DEFAULT false,
  order_index INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255) UNIQUE,
  -- Additional detailed fields
  challenge TEXT,
  solution TEXT,
  results JSONB DEFAULT '[]',
  gallery JSONB DEFAULT '[]',
  testimonial JSONB DEFAULT NULL,
  location VARCHAR(255),
  duration VARCHAR(100),
  year INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_order_index ON projects(order_index);
CREATE INDEX IF NOT EXISTS idx_projects_year ON projects(year);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_projects_updated_at ON projects;
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Clear existing data
DELETE FROM projects;

-- Insert comprehensive project data
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
  slug,
  challenge,
  solution,
  results,
  gallery,
  testimonial,
  location,
  duration,
  year
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
  'enterprise-resource-planning-system',
  'The client was struggling with siloed data across multiple legacy systems, leading to inefficiencies, data inconsistencies, and delayed decision-making. They needed a unified solution that could handle complex manufacturing processes while providing real-time visibility across the organization.',
  'We designed a custom ERP system tailored to the client''s specific manufacturing processes. The solution included modules for production planning, inventory management, supply chain, quality control, sales, and financial management. We implemented a phased approach to minimize disruption and ensure successful adoption.',
  '["40% increase in operational efficiency", "25% reduction in inventory costs", "60% faster reporting and analytics", "Seamless integration across 12 international locations", "ROI achieved within 14 months of full implementation"]'::jsonb,
  '["/images/projects/erp-system-1.jpg", "/images/projects/erp-system-2.jpg", "/images/projects/erp-system-3.jpg"]'::jsonb,
  '{"quote": "The ERP system has transformed our operations and given us unprecedented visibility into our business processes.", "author": "John Smith", "position": "CIO", "company": "Global Manufacturing Corporation"}'::jsonb,
  'Chicago, IL',
  '18 months',
  2022
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
  'ecommerce-platform-redesign',
  'The client''s existing e-commerce platform had poor mobile performance, high cart abandonment rates, and an outdated design that didn''t reflect their brand identity.',
  'We redesigned the entire platform with a mobile-first approach, implemented a new design system, and optimized the checkout process. We also integrated advanced product filtering and search capabilities.',
  '["35% increase in conversion rate", "50% improvement in mobile engagement", "40% reduction in cart abandonment", "25% increase in average order value", "Improved customer satisfaction scores"]'::jsonb,
  '["/images/projects/ecommerce-1.jpg", "/images/projects/ecommerce-2.jpg", "/images/projects/ecommerce-3.jpg"]'::jsonb,
  '{"quote": "The new platform has significantly improved our online sales and customer experience.", "author": "Sarah Johnson", "position": "E-commerce Director", "company": "Fashion Retail Brand"}'::jsonb,
  'New York, NY',
  '6 months',
  2023
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
  'secure-banking-infrastructure',
  'The client faced increasing cybersecurity threats and needed to strengthen their security posture while complying with stringent financial regulations. They required a solution that provided robust protection without impacting system performance or user experience.',
  'We developed a multi-layered security architecture that included network segmentation, advanced firewall protection, encryption for data at rest and in transit, and a comprehensive identity and access management system. We also implemented a security operations center for 24/7 monitoring and incident response.',
  '["Zero security breaches since implementation", "100% compliance with banking regulations", "90% reduction in security incidents", "Streamlined authentication process for employees", "Enhanced customer trust through improved security measures"]'::jsonb,
  '["/images/projects/banking-1.jpg", "/images/projects/banking-2.jpg", "/images/projects/banking-3.jpg"]'::jsonb,
  '{"quote": "The security infrastructure has given us peace of mind and helped us maintain our customers'' trust.", "author": "Michael Brown", "position": "CISO", "company": "Regional Banking Network"}'::jsonb,
  'Boston, MA',
  '12 months',
  2022
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
  'smart-grid-power-management',
  'The client needed to reduce energy costs and carbon footprint while maintaining reliable power supply across multiple properties. They required a solution that could integrate with existing infrastructure and provide real-time monitoring.',
  'We designed a comprehensive smart grid solution that included IoT sensors, energy management systems, solar integration, and battery storage. The system uses AI/ML algorithms to optimize energy distribution and predict maintenance needs.',
  '["25% reduction in overall power consumption", "40% decrease in energy costs", "30% reduction in carbon emissions", "Real-time visibility into energy usage patterns", "Enhanced resilience against power outages"]'::jsonb,
  '["/images/projects/smart-grid-1.jpg", "/images/projects/smart-grid-2.jpg", "/images/projects/smart-grid-3.jpg"]'::jsonb,
  '{"quote": "The smart grid system has revolutionized our energy management and significantly reduced our operational costs.", "author": "David Wilson", "position": "Facilities Director", "company": "Commercial Real Estate Developer"}'::jsonb,
  'San Francisco, CA',
  '15 months',
  2023
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
  'corporate-network-infrastructure',
  'The client''s existing network was struggling to support their growing global operations and increasing reliance on cloud applications. They needed a solution that could provide consistent performance across all locations while supporting their hybrid work model.',
  'We implemented a software-defined wide area network (SD-WAN) architecture that optimized traffic routing across their global offices. The solution included redundant internet connections, quality of service controls, and integrated security features. We also deployed a global VPN solution to support remote workers with secure access to corporate resources.',
  '["99.99% network uptime across all locations", "60% improvement in application performance", "Seamless support for 5,000+ remote workers", "Simplified network management through centralized controls", "Reduced network operating costs by 35%"]'::jsonb,
  '["/images/projects/network-1.jpg", "/images/projects/network-2.jpg", "/images/projects/network-3.jpg"]'::jsonb,
  '{"quote": "The new network infrastructure has transformed our global operations and enabled seamless remote work.", "author": "Emma Thompson", "position": "IT Director", "company": "Global Consulting Firm"}'::jsonb,
  'London, UK',
  '8 months',
  2022
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
  'healthcare-it-system-integration',
  'The healthcare provider was using multiple disconnected systems for patient records, scheduling, billing, and analytics. This led to inefficiencies, data inconsistencies, and challenges in providing coordinated care.',
  'We developed an integrated healthcare IT platform that connected all existing systems through standardized APIs and a central data warehouse. The solution included a unified patient portal, clinical decision support tools, and advanced analytics capabilities.',
  '["Unified patient records across 12 facilities", "45% reduction in administrative data entry", "70% faster access to complete patient information", "Improved care coordination and reduced duplicate testing", "Full compliance with HIPAA and other healthcare regulations"]'::jsonb,
  '["/images/projects/healthcare-1.jpg", "/images/projects/healthcare-2.jpg", "/images/projects/healthcare-3.jpg"]'::jsonb,
  '{"quote": "The integrated system has significantly improved our ability to provide coordinated care and reduced administrative burden.", "author": "Dr. Lisa Chen", "position": "Chief Medical Information Officer", "company": "Regional Healthcare Provider"}'::jsonb,
  'Toronto, Canada',
  '10 months',
  2023
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
  year,
  duration,
  location,
  jsonb_array_length(COALESCE(technologies, '[]'::jsonb)) as tech_count,
  jsonb_array_length(COALESCE(results, '[]'::jsonb)) as results_count,
  jsonb_array_length(COALESCE(gallery, '[]'::jsonb)) as gallery_count,
  CASE WHEN testimonial IS NOT NULL THEN 'Yes' ELSE 'No' END as has_testimonial
FROM projects 
ORDER BY order_index;

-- Display summary
SELECT 
  COUNT(*) as total_projects,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_projects,
  COUNT(CASE WHEN featured = true THEN 1 END) as featured_projects,
  COUNT(DISTINCT category) as categories,
  AVG(budget) as avg_budget,
  AVG(team_size) as avg_team_size
FROM projects;

COMMENT ON TABLE projects IS 'Complete portfolio projects for QuardCube Labs with detailed information - migrated from static data to database on August 3, 2025';
COMMENT ON COLUMN projects.challenge IS 'The business challenge or problem that the project addressed';
COMMENT ON COLUMN projects.solution IS 'The solution approach and implementation strategy';
COMMENT ON COLUMN projects.results IS 'Measurable outcomes and achievements from the project';
COMMENT ON COLUMN projects.gallery IS 'Additional project images for gallery display';
COMMENT ON COLUMN projects.testimonial IS 'Client testimonial with quote, author, position, and company';
