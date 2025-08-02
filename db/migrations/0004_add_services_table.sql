-- Create services table for managing company services

CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  short_description TEXT,
  price_range VARCHAR(100),
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
  features JSONB DEFAULT '[]',
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

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_services_updated_at 
    BEFORE UPDATE ON services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample services data
INSERT INTO services (title, description, short_description, price_range, category, status, features, icon, order_index) VALUES
('Web Development', 'Full-stack web development services using modern technologies like React, Next.js, Node.js, and more.', 'Custom web applications and websites', '$2,000 - $15,000', 'development', 'active', '["Responsive Design", "SEO Optimization", "Performance Optimization", "Custom CMS"]', 'Code', 1),
('Mobile App Development', 'Native and cross-platform mobile application development for iOS and Android.', 'Mobile apps for all platforms', '$5,000 - $25,000', 'development', 'active', '["iOS Development", "Android Development", "React Native", "Flutter"]', 'Smartphone', 2),
('UI/UX Design', 'User interface and user experience design services for web and mobile applications.', 'Beautiful and functional designs', '$1,500 - $8,000', 'design', 'active', '["User Research", "Wireframing", "Prototyping", "Design Systems"]', 'Palette', 3),
('Digital Marketing', 'Comprehensive digital marketing solutions including SEO, social media, and content marketing.', 'Grow your online presence', '$1,000 - $5,000/month', 'marketing', 'active', '["SEO", "Social Media Marketing", "Content Creation", "Analytics"]', 'TrendingUp', 4),
('Consulting Services', 'Technology consulting and strategic planning for digital transformation.', 'Expert technology guidance', '$150 - $300/hour', 'consulting', 'active', '["Technology Strategy", "Digital Transformation", "Architecture Review", "Team Training"]', 'Users', 5);
