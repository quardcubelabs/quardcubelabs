-- Create projects table for portfolio management

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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_order_index ON projects(order_index);

-- Create trigger for updated_at
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample projects data
INSERT INTO projects (title, client, description, short_description, technologies, category, status, project_url, image_url, start_date, end_date, budget, team_size, featured, order_index) VALUES
('Enterprise Resource Planning System', 'Global Manufacturing Corporation', 'Developed and implemented a comprehensive ERP solution for a manufacturing company with operations in 12 countries. The system integrated production, inventory, sales, and financial data into a unified platform, providing real-time insights and streamlining operations.', 'Comprehensive ERP solution for global manufacturing', '["React", "Node.js", "MongoDB", "Docker", "Kubernetes", "Azure Cloud"]', 'Software Development', 'completed', null, '/images/projects/erp-system.jpg', '2022-01-15', '2023-06-30', 150000.00, 8, true, 1),
('E-commerce Platform Redesign', 'Fashion Retail Brand', 'Complete redesign of an e-commerce platform for a leading fashion retail brand, focusing on user experience, mobile responsiveness, and conversion optimization.', 'Modern e-commerce platform redesign', '["Next.js", "Tailwind CSS", "Shopify", "Stripe", "Algolia Search"]', 'Web Designing', 'completed', 'https://demo-ecommerce.vercel.app', '/images/projects/ecommerce-redesign.jpg', '2023-01-01', '2023-06-30', 75000.00, 5, true, 2),
('Secure Banking Infrastructure', 'Regional Banking Network', 'Designed and implemented a comprehensive security infrastructure for a regional banking network with 50+ branches. The solution included advanced encryption, multi-factor authentication, and real-time threat monitoring.', 'Comprehensive banking security solution', '["Cisco Security", "Palo Alto Networks", "Okta", "Splunk", "Encryption Technologies", "Biometric Authentication"]', 'Security Products', 'completed', null, '/images/projects/banking-security.jpg', '2022-03-01', '2023-02-28', 200000.00, 10, true, 3),
('Smart Grid Power Management', 'Commercial Real Estate Developer', 'Developed and implemented a smart grid power management system for a large commercial real estate portfolio, integrating renewable energy sources and advanced monitoring capabilities.', 'Smart grid power management system', '["IoT Sensors", "Energy Management Systems", "Solar Integration", "Battery Storage", "AI/ML Algorithms", "Cloud Analytics"]', 'Power Solutions', 'completed', null, '/images/projects/smart-grid.jpg', '2023-02-01', '2024-04-30', 120000.00, 6, true, 4),
('Corporate Network Infrastructure', 'Global Consulting Firm', 'Designed and implemented a scalable network infrastructure for a multinational consulting firm with 20+ offices worldwide. The solution provided secure, high-performance connectivity while supporting remote work capabilities.', 'Global network infrastructure solution', '["Cisco SD-WAN", "Meraki", "Azure Virtual WAN", "Zero Trust Security", "Cloud Connectivity", "Global VPN"]', 'Connectivity & Networking', 'completed', null, '/images/projects/network-infrastructure.jpg', '2022-06-01', '2023-01-31', 180000.00, 7, true, 5),
('Healthcare IT System Integration', 'Regional Healthcare Provider', 'Integrated various healthcare IT systems to create a unified platform for patient data management and analytics, improving care coordination and operational efficiency.', 'Healthcare IT systems integration', '["HL7 FHIR", "Interoperability APIs", "Healthcare Data Warehouse", "HIPAA-Compliant Cloud", "Clinical Analytics", "Secure Messaging"]', 'IT Products & Services', 'completed', null, '/images/projects/healthcare-it.jpg', '2023-03-01', '2023-12-31', 160000.00, 8, true, 6);
