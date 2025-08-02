-- Create positions table for job/career management

CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  experience_level VARCHAR(50) DEFAULT 'mid' CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  description TEXT,
  requirements JSONB DEFAULT '[]',
  responsibilities JSONB DEFAULT '[]',
  benefits JSONB DEFAULT '[]',
  salary_range VARCHAR(100),
  status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
  remote_allowed BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  application_deadline DATE,
  order_index INTEGER DEFAULT 0,
  meta_title VARCHAR(255),
  meta_description TEXT,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department);
CREATE INDEX IF NOT EXISTS idx_positions_employment_type ON positions(employment_type);
CREATE INDEX IF NOT EXISTS idx_positions_featured ON positions(featured);
CREATE INDEX IF NOT EXISTS idx_positions_slug ON positions(slug);
CREATE INDEX IF NOT EXISTS idx_positions_order_index ON positions(order_index);

-- Create trigger for updated_at
CREATE TRIGGER update_positions_updated_at 
    BEFORE UPDATE ON positions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample positions data
INSERT INTO positions (title, department, location, employment_type, experience_level, description, requirements, responsibilities, benefits, salary_range, status, remote_allowed, featured, application_deadline, order_index) VALUES
('Senior Full Stack Developer', 'Engineering', 'Remote / Hybrid', 'full_time', 'senior', 'We are looking for an experienced Full Stack Developer to join our dynamic team and help build innovative web applications.', '["5+ years of web development experience", "Expert in React and Node.js", "Experience with TypeScript", "Knowledge of PostgreSQL", "Familiarity with cloud platforms (AWS/Vercel)"]', '["Develop and maintain web applications", "Collaborate with design and product teams", "Write clean, maintainable code", "Mentor junior developers", "Participate in code reviews"]', '["Competitive salary", "Health insurance", "Flexible working hours", "Remote work options", "Professional development budget"]', '$80,000 - $120,000', 'open', true, true, '2024-12-31', 1),
('UI/UX Designer', 'Design', 'New York, NY', 'full_time', 'mid', 'Join our design team to create beautiful and intuitive user experiences for our web and mobile applications.', '["3+ years of UI/UX design experience", "Proficiency in Figma and Adobe Creative Suite", "Understanding of responsive design", "Experience with design systems", "Strong portfolio showcasing web/mobile designs"]', '["Design user interfaces for web and mobile", "Create wireframes and prototypes", "Conduct user research and testing", "Collaborate with developers on implementation", "Maintain and evolve design systems"]', '["Competitive salary", "Health and dental insurance", "401k matching", "Design tools and equipment", "Conference and training budget"]', '$65,000 - $95,000', 'open', false, false, '2024-11-30', 2),
('DevOps Engineer', 'Engineering', 'San Francisco, CA', 'full_time', 'senior', 'We need a DevOps Engineer to help scale our infrastructure and improve our deployment processes.', '["4+ years of DevOps experience", "Experience with AWS/GCP/Azure", "Proficiency in Docker and Kubernetes", "Knowledge of CI/CD pipelines", "Scripting skills (Python, Bash)"]', '["Manage cloud infrastructure", "Implement CI/CD pipelines", "Monitor system performance", "Ensure security best practices", "Automate deployment processes"]', '["Competitive salary", "Stock options", "Health insurance", "Flexible PTO", "Home office stipend"]', '$90,000 - $130,000', 'open', true, false, '2024-12-15', 3),
('Marketing Specialist', 'Marketing', 'Chicago, IL', 'full_time', 'mid', 'Looking for a creative Marketing Specialist to help grow our brand and drive customer acquisition.', '["2+ years of digital marketing experience", "Experience with SEO and SEM", "Social media marketing skills", "Content creation abilities", "Analytics and reporting experience"]', '["Develop and execute marketing campaigns", "Manage social media channels", "Create engaging content", "Analyze campaign performance", "Collaborate with sales team"]', '["Competitive salary", "Health insurance", "Professional development", "Marketing tools and software", "Flexible working arrangements"]', '$50,000 - $70,000', 'open', false, false, '2024-11-20', 4),
('Junior Software Developer', 'Engineering', 'Austin, TX', 'full_time', 'entry', 'Great opportunity for a recent graduate or career changer to join our engineering team and grow their skills.', '["Bachelor''s degree in Computer Science or related field", "Basic knowledge of JavaScript/Python", "Understanding of web development fundamentals", "Strong problem-solving skills", "Eagerness to learn and grow"]', '["Assist in developing web applications", "Write and test code under supervision", "Participate in team meetings and planning", "Learn from senior developers", "Contribute to documentation"]', '["Competitive entry-level salary", "Health insurance", "Mentorship program", "Learning and development budget", "Career growth opportunities"]', '$55,000 - $75,000', 'open', false, true, '2024-12-01', 5);
