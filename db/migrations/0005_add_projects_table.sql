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
('E-Commerce Platform', 'TechCorp Inc', 'A comprehensive e-commerce platform with advanced inventory management, payment processing, and analytics dashboard.', 'Modern e-commerce solution', '["Next.js", "React", "Node.js", "PostgreSQL", "Stripe", "Tailwind CSS"]', 'web-app', 'completed', 'https://demo-ecommerce.vercel.app', '/placeholder.jpg', '2024-01-15', '2024-04-30', 25000.00, 4, true, 1),
('Healthcare Management System', 'MedCare Solutions', 'Digital transformation of healthcare operations with patient management, appointment scheduling, and telemedicine features.', 'Healthcare digital solution', '["React", "TypeScript", "Express.js", "MongoDB", "Socket.io", "Chart.js"]', 'web-app', 'completed', 'https://medcare-demo.com', '/placeholder.jpg', '2024-02-01', '2024-06-15', 35000.00, 5, true, 2),
('Mobile Banking App', 'SecureBank', 'Secure mobile banking application with biometric authentication, real-time transactions, and financial insights.', 'Mobile banking solution', '["React Native", "Redux", "Node.js", "PostgreSQL", "JWT", "Biometrics"]', 'mobile-app', 'completed', null, '/placeholder.jpg', '2024-03-01', '2024-07-30', 45000.00, 6, true, 3),
('Real Estate Platform', 'PropertyPro', 'Property listing and management platform with virtual tours, CRM integration, and advanced search filters.', 'Real estate marketplace', '["Vue.js", "Laravel", "MySQL", "Google Maps API", "AWS S3"]', 'web-app', 'in_progress', 'https://propertypro-beta.com', '/placeholder.jpg', '2024-06-01', '2024-10-30', 30000.00, 4, false, 4),
('Food Delivery App', 'QuickEats', 'On-demand food delivery application with real-time tracking, payment integration, and restaurant management.', 'Food delivery platform', '["Flutter", "Firebase", "Node.js", "Google Maps", "Stripe", "Socket.io"]', 'mobile-app', 'planned', null, '/placeholder.jpg', '2024-09-01', '2024-12-31', 28000.00, 3, false, 5);
