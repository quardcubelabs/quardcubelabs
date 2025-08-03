-- Insert current services data from lib/data.ts into the services table
-- This migration preserves the existing services displayed on the website

-- First, clear existing sample data to avoid duplicates
DELETE FROM services WHERE title IN (
  'Web Development', 
  'Mobile App Development', 
  'UI/UX Design', 
  'Digital Marketing', 
  'Consulting Services'
);

-- Insert the actual services from the website
-- Use INSERT ... ON CONFLICT to handle duplicate slugs
INSERT INTO services (
  title, 
  description, 
  short_description, 
  category, 
  status, 
  features, 
  image_url, 
  order_index,
  meta_title,
  meta_description,
  slug
) VALUES 

-- Custom Software Development
(
  'Custom Software Development',
  'Our expert development team creates custom software solutions that address your unique business challenges. From enterprise applications to specialized tools, we deliver high-quality, scalable software that drives efficiency and growth.',
  'Tailored software solutions designed to meet your specific business requirements.',
  'development',
  'active',
  '["Requirements gathering and analysis", "Solution architecture and design", "Agile development and testing", "Deployment and integration", "Ongoing support and maintenance"]',
  '/placeholder.svg?height=600&width=800',
  1,
  'Custom Software Development | QuardCube Labs',
  'Expert custom software development services. Tailored solutions for your business needs using modern technologies.',
  'custom-software-development'
),

-- Web Design & Development
(
  'Web Design & Development',
  'We create visually appealing, user-friendly websites that represent your brand and engage your audience. Our web solutions are responsive, accessible, and optimized for performance across all devices and platforms.',
  'Stunning, responsive websites with modern UI/UX that captivate your audience.',
  'design',
  'active',
  '["Discovery and strategy planning", "Wireframing and prototyping", "Visual design and branding", "Frontend and backend development", "Testing, launch, and post-launch support"]',
  '/placeholder.svg?height=600&width=800',
  2,
  'Web Design & Development | QuardCube Labs',
  'Professional web design and development services. Responsive, modern websites that drive results.',
  'web-design-development'
),

-- Power Management Solutions
(
  'Power Management Solutions',
  'Our power management solutions help businesses optimize energy usage, reduce costs, and ensure uninterrupted operations. We provide comprehensive services from assessment to implementation and ongoing monitoring.',
  'Reliable power management systems to keep your infrastructure running efficiently.',
  'consulting',
  'active',
  '["Energy audit and assessment", "Solution design and planning", "Equipment procurement and installation", "System integration and testing", "Monitoring and maintenance"]',
  '/placeholder.svg?height=600&width=800',
  3,
  'Power Management Solutions | QuardCube Labs',
  'Advanced power management solutions for optimal energy efficiency and cost reduction.',
  'power-management-solutions'
),

-- Cybersecurity Services
(
  'Cybersecurity Services',
  'Our cybersecurity services provide robust protection for your digital infrastructure, data, and applications. We implement multi-layered security strategies to defend against evolving threats and ensure business continuity.',
  'Comprehensive security solutions to protect your digital assets from threats.',
  'consulting',
  'active',
  '["Security assessment and vulnerability scanning", "Security architecture design", "Implementation of security controls", "Security monitoring and incident response", "Security awareness training"]',
  '/placeholder.svg?height=600&width=800',
  4,
  'Cybersecurity Services | QuardCube Labs',
  'Comprehensive cybersecurity services to protect your business from digital threats and ensure data security.',
  'cybersecurity-services'
),

-- Network Infrastructure
(
  'Network Infrastructure',
  'We design, implement, and manage network infrastructure that provides reliable, high-performance connectivity for your business. Our solutions scale with your needs and incorporate the latest technologies for optimal performance.',
  'Robust networking solutions that ensure seamless connectivity across your organization.',
  'consulting',
  'active',
  '["Network assessment and planning", "Architecture design", "Equipment selection and procurement", "Implementation and configuration", "Network monitoring and management"]',
  '/placeholder.svg?height=600&width=800',
  5,
  'Network Infrastructure | QuardCube Labs',
  'Professional network infrastructure services for reliable, high-performance business connectivity.',
  'network-infrastructure'
),

-- IT Consulting & Support
(
  'IT Consulting & Support',
  'Our IT consulting and support services provide strategic guidance and technical expertise to help you leverage technology for business success. We offer proactive support, problem resolution, and strategic planning to optimize your IT investments.',
  'Expert IT consulting and support services for your business technology needs.',
  'consulting',
  'active',
  '["IT assessment and discovery", "Strategic planning and roadmap development", "Solution recommendation and implementation", "Ongoing support and maintenance", "Regular review and optimization"]',
  '/placeholder.svg?height=600&width=800',
  6,
  'IT Consulting & Support | QuardCube Labs',
  'Expert IT consulting and support services to optimize your technology investments and drive business success.',
  'it-consulting-support'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  short_description = EXCLUDED.short_description,
  category = EXCLUDED.category,
  status = EXCLUDED.status,
  features = EXCLUDED.features,
  image_url = EXCLUDED.image_url,
  order_index = EXCLUDED.order_index,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();

-- Add additional technologies as JSONB for each service
UPDATE services SET 
  features = features || '["React", "Node.js", "Python", "Java", "AWS", "Azure", ".NET", "MongoDB", "PostgreSQL"]'::jsonb
WHERE title = 'Custom Software Development';

UPDATE services SET 
  features = features || '["HTML5", "CSS3", "JavaScript", "React", "Next.js", "WordPress", "Shopify", "Tailwind CSS", "GraphQL"]'::jsonb
WHERE title = 'Web Design & Development';

UPDATE services SET 
  features = features || '["Smart Grid Technology", "Energy Management Systems", "UPS Systems", "Power Distribution Units", "Renewable Energy Integration"]'::jsonb
WHERE title = 'Power Management Solutions';

UPDATE services SET 
  features = features || '["Firewall Systems", "Intrusion Detection", "Endpoint Protection", "Data Encryption", "Identity Management", "SIEM"]'::jsonb
WHERE title = 'Cybersecurity Services';

UPDATE services SET 
  features = features || '["Cisco Systems", "SD-WAN", "Network Virtualization", "Cloud Networking", "Wireless Solutions", "VPN Technologies"]'::jsonb
WHERE title = 'Network Infrastructure';

UPDATE services SET 
  features = features || '["Help Desk Systems", "Remote Monitoring", "IT Service Management", "Cloud Migration", "Digital Transformation"]'::jsonb
WHERE title = 'IT Consulting & Support';

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS idx_services_slug ON services(slug);
CREATE INDEX IF NOT EXISTS idx_services_order_index ON services(order_index);
CREATE INDEX IF NOT EXISTS idx_services_status ON services(status);
CREATE INDEX IF NOT EXISTS idx_services_category ON services(category);
