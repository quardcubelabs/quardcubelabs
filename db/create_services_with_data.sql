-- Create and populate services table with actual data from the public services page
-- QuardCube Labs Services Database Schema and Data Migration
-- Created: August 3, 2025

-- Drop existing services table if it exists (use with caution in production)
-- DROP TABLE IF EXISTS services CASCADE;

-- Create services table
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  price_range VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  features JSONB DEFAULT '[]',
  technologies JSONB DEFAULT '[]',
  process JSONB DEFAULT '[]',
  case_studies JSONB DEFAULT '[]',
  image_url TEXT,
  icon VARCHAR(100),
  order_index INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_order_index ON services(order_index);
CREATE INDEX IF NOT EXISTS idx_services_title ON services(title);

-- Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_services_updated_at ON services;
CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Clear any existing data to prevent duplicates
DELETE FROM services;

-- Insert actual services data from the public services page
INSERT INTO services (
  title, 
  description, 
  short_description, 
  category, 
  status, 
  process,
  technologies,
  case_studies,
  image_url, 
  order_index,
  meta_title,
  meta_description,
  slug
) VALUES 

-- Service 1: Custom Software Development
(
  'Custom Software Development',
  'Our expert development team creates custom software solutions that address your unique business challenges. From enterprise applications to specialized tools, we deliver high-quality, scalable software that drives efficiency and growth.',
  'Tailored software solutions designed to meet your specific business requirements.',
  'development',
  'active',
  '["Requirements gathering and analysis", "Solution architecture and design", "Agile development and testing", "Deployment and integration", "Ongoing support and maintenance"]'::jsonb,
  '["React", "Node.js", "Python", "Java", "AWS", "Azure", ".NET", "MongoDB", "PostgreSQL"]'::jsonb,
  '[
    {
      "title": "Enterprise Resource Planning System",
      "client": "Manufacturing Company",
      "outcome": "40% increase in operational efficiency"
    },
    {
      "title": "Customer Relationship Management Tool",
      "client": "Financial Services Provider",
      "outcome": "65% improvement in customer retention"
    }
  ]'::jsonb,
  '/placeholder.svg?height=600&width=800',
  1,
  'Custom Software Development | QuardCube Labs',
  'Expert custom software development services. Tailored solutions for your business needs using modern technologies like React, Node.js, Python, and cloud platforms.',
  'custom-software-development'
),

-- Service 2: Web Design & Development
(
  'Web Design & Development',
  'We create visually appealing, user-friendly websites that represent your brand and engage your audience. Our web solutions are responsive, accessible, and optimized for performance across all devices and platforms.',
  'Stunning, responsive websites with modern UI/UX that captivate your audience.',
  'design',
  'active',
  '["Discovery and strategy planning", "Wireframing and prototyping", "Visual design and branding", "Frontend and backend development", "Testing, launch, and post-launch support"]'::jsonb,
  '["HTML5", "CSS3", "JavaScript", "React", "Next.js", "WordPress", "Shopify", "Tailwind CSS", "GraphQL"]'::jsonb,
  '[
    {
      "title": "E-commerce Platform Redesign",
      "client": "Retail Chain",
      "outcome": "35% increase in conversion rate"
    },
    {
      "title": "Corporate Website Overhaul",
      "client": "Legal Firm",
      "outcome": "120% increase in lead generation"
    }
  ]'::jsonb,
  '/placeholder.svg?height=600&width=800',
  2,
  'Web Design & Development | QuardCube Labs',
  'Professional web design and development services. Responsive, modern websites with HTML5, CSS3, React, and Next.js that drive results.',
  'web-design-development'
),

-- Service 3: Power Management Solutions
(
  'Power Management Solutions',
  'Our power management solutions help businesses optimize energy usage, reduce costs, and ensure uninterrupted operations. We provide comprehensive services from assessment to implementation and ongoing monitoring.',
  'Reliable power management systems to keep your infrastructure running efficiently.',
  'consulting',
  'active',
  '["Energy audit and assessment", "Solution design and planning", "Equipment procurement and installation", "System integration and testing", "Monitoring and maintenance"]'::jsonb,
  '["Smart Grid Technology", "Energy Management Systems", "UPS Systems", "Power Distribution Units", "Renewable Energy Integration"]'::jsonb,
  '[
    {
      "title": "Smart Grid Power Management",
      "client": "Commercial Building Complex",
      "outcome": "25% reduction in power consumption"
    },
    {
      "title": "Data Center Power Optimization",
      "client": "Cloud Service Provider",
      "outcome": "30% improvement in energy efficiency"
    }
  ]'::jsonb,
  '/placeholder.svg?height=600&width=800',
  3,
  'Power Management Solutions | QuardCube Labs',
  'Advanced power management solutions for optimal energy efficiency and cost reduction using smart grid technology and renewable energy integration.',
  'power-management-solutions'
),

-- Service 4: Cybersecurity Services
(
  'Cybersecurity Services',
  'Our cybersecurity services provide robust protection for your digital infrastructure, data, and applications. We implement multi-layered security strategies to defend against evolving threats and ensure business continuity.',
  'Comprehensive security solutions to protect your digital assets from threats.',
  'consulting',
  'active',
  '["Security assessment and vulnerability scanning", "Security architecture design", "Implementation of security controls", "Security monitoring and incident response", "Security awareness training"]'::jsonb,
  '["Firewall Systems", "Intrusion Detection", "Endpoint Protection", "Data Encryption", "Identity Management", "Security Information and Event Management (SIEM)"]'::jsonb,
  '[
    {
      "title": "Secure Banking Infrastructure",
      "client": "Regional Bank",
      "outcome": "Zero security breaches since implementation"
    },
    {
      "title": "Healthcare Data Protection",
      "client": "Medical Center",
      "outcome": "Achieved HIPAA compliance with enhanced security"
    }
  ]'::jsonb,
  '/placeholder.svg?height=600&width=800',
  4,
  'Cybersecurity Services | QuardCube Labs',
  'Comprehensive cybersecurity services to protect your business from digital threats using firewall systems, intrusion detection, and SIEM solutions.',
  'cybersecurity-services'
),

-- Service 5: Network Infrastructure
(
  'Network Infrastructure',
  'We design, implement, and manage network infrastructure that provides reliable, high-performance connectivity for your business. Our solutions scale with your needs and incorporate the latest technologies for optimal performance.',
  'Robust networking solutions that ensure seamless connectivity across your organization.',
  'consulting',
  'active',
  '["Network assessment and planning", "Architecture design", "Equipment selection and procurement", "Implementation and configuration", "Network monitoring and management"]'::jsonb,
  '["Cisco Systems", "SD-WAN", "Network Virtualization", "Cloud Networking", "Wireless Solutions", "VPN Technologies"]'::jsonb,
  '[
    {
      "title": "Corporate Network Infrastructure",
      "client": "Multinational Corporation",
      "outcome": "99.99% network uptime across 20+ locations"
    },
    {
      "title": "Campus-wide WiFi Deployment",
      "client": "University",
      "outcome": "Seamless connectivity for 15,000+ simultaneous users"
    }
  ]'::jsonb,
  '/placeholder.svg?height=600&width=800',
  5,
  'Network Infrastructure | QuardCube Labs',
  'Professional network infrastructure services for reliable, high-performance business connectivity using Cisco systems, SD-WAN, and cloud networking.',
  'network-infrastructure'
),

-- Service 6: IT Consulting & Support
(
  'IT Consulting & Support',
  'Our IT consulting and support services provide strategic guidance and technical expertise to help you leverage technology for business success. We offer proactive support, problem resolution, and strategic planning to optimize your IT investments.',
  'Expert IT consulting and support services for your business technology needs.',
  'consulting',
  'active',
  '["IT assessment and discovery", "Strategic planning and roadmap development", "Solution recommendation and implementation", "Ongoing support and maintenance", "Regular review and optimization"]'::jsonb,
  '["Help Desk Systems", "Remote Monitoring", "IT Service Management", "Cloud Migration", "Digital Transformation"]'::jsonb,
  '[
    {
      "title": "IT Infrastructure Modernization",
      "client": "Accounting Firm",
      "outcome": "50% reduction in IT-related downtime"
    },
    {
      "title": "Cloud Migration Strategy",
      "client": "Insurance Company",
      "outcome": "35% reduction in IT operational costs"
    }
  ]'::jsonb,
  '/placeholder.svg?height=600&width=800',
  6,
  'IT Consulting & Support | QuardCube Labs',
  'Expert IT consulting and support services to optimize your technology investments and drive business success through cloud migration and digital transformation.',
  'it-consulting-support'
);

-- Update features column with combined process and technologies for admin compatibility
UPDATE services SET features = (
  COALESCE(process, '[]'::jsonb) || COALESCE(technologies, '[]'::jsonb)
) WHERE features = '[]'::jsonb OR features IS NULL;

-- Verify the data was inserted correctly
SELECT 
  id,
  title,
  category,
  status,
  order_index,
  slug,
  jsonb_array_length(COALESCE(features, '[]'::jsonb)) as features_count,
  jsonb_array_length(COALESCE(technologies, '[]'::jsonb)) as technologies_count,
  jsonb_array_length(COALESCE(case_studies, '[]'::jsonb)) as case_studies_count,
  created_at
FROM services 
ORDER BY order_index;

-- Display summary
SELECT 
  COUNT(*) as total_services,
  COUNT(CASE WHEN status = 'active' THEN 1 END) as active_services,
  COUNT(DISTINCT category) as categories
FROM services;

COMMENT ON TABLE services IS 'Services offered by QuardCube Labs - migrated from static data to database on August 3, 2025';
COMMENT ON COLUMN services.process IS 'Service delivery process steps stored as JSONB array';
COMMENT ON COLUMN services.technologies IS 'Technologies used for this service stored as JSONB array';
COMMENT ON COLUMN services.case_studies IS 'Case studies and success stories stored as JSONB array of objects';
COMMENT ON COLUMN services.features IS 'Combined features, process, and technologies for admin interface compatibility';
