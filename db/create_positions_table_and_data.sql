-- Create positions table for QuardCube Labs careers
-- This script creates the table structure and inserts positions from the careers page

-- Create the positions table
CREATE TABLE IF NOT EXISTS positions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  employment_type VARCHAR(50) DEFAULT 'full_time' CHECK (employment_type IN ('full_time', 'part_time', 'contract', 'internship')),
  experience_level VARCHAR(50) DEFAULT 'mid' CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead')),
  description TEXT,
  requirements JSONB DEFAULT '[]'::jsonb,
  responsibilities JSONB DEFAULT '[]'::jsonb,
  benefits JSONB DEFAULT '[]'::jsonb,
  salary_range VARCHAR(100),
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'closed', 'draft')),
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_positions_status ON positions(status);
CREATE INDEX IF NOT EXISTS idx_positions_department ON positions(department);
CREATE INDEX IF NOT EXISTS idx_positions_employment_type ON positions(employment_type);
CREATE INDEX IF NOT EXISTS idx_positions_experience_level ON positions(experience_level);
CREATE INDEX IF NOT EXISTS idx_positions_featured ON positions(featured);
CREATE INDEX IF NOT EXISTS idx_positions_order_index ON positions(order_index);
CREATE INDEX IF NOT EXISTS idx_positions_slug ON positions(slug);
CREATE INDEX IF NOT EXISTS idx_positions_location ON positions(location);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_positions_updated_at 
    BEFORE UPDATE ON positions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert the positions from the careers page
INSERT INTO positions (
  title,
  department,
  location,
  employment_type,
  experience_level,
  description,
  requirements,
  responsibilities,
  benefits,
  salary_range,
  status,
  remote_allowed,
  featured,
  order_index,
  meta_title,
  meta_description,
  slug
) VALUES 

-- Senior Software Engineer
(
  'Senior Software Engineer',
  'Engineering',
  'Dar es Salaam, Tanzania',
  'full_time',
  'senior',
  'We''re looking for an experienced software engineer to join our core development team. You''ll be responsible for designing and implementing scalable software solutions, mentoring junior developers, and contributing to our technical architecture decisions.',
  '["5+ years of software development experience", "Proficiency in modern programming languages (Python, JavaScript, Java, etc.)", "Experience with cloud platforms (AWS, Azure, GCP)", "Strong knowledge of databases and data modeling", "Experience with containerization and microservices", "Excellent problem-solving and communication skills"]'::jsonb,
  '["Design and develop high-quality software solutions", "Collaborate with cross-functional teams to define requirements", "Mentor junior developers and conduct code reviews", "Participate in technical architecture decisions", "Optimize application performance and scalability", "Stay up-to-date with emerging technologies and best practices"]'::jsonb,
  '["Competitive salary and equity package", "Comprehensive health insurance", "Professional development budget", "Flexible working hours", "Remote work options", "Modern development tools and equipment"]'::jsonb,
  '$60,000 - $80,000',
  'open',
  false,
  true,
  1,
  'Senior Software Engineer | Careers | QuardCube Labs',
  'Join our engineering team as a Senior Software Engineer in Dar es Salaam. Lead development projects and mentor junior developers.',
  'senior-software-engineer'
),

-- UX/UI Designer
(
  'UX/UI Designer',
  'Design',
  'Remote',
  'full_time',
  'mid',
  'Join our design team to create beautiful and intuitive user experiences. You''ll work closely with product managers and developers to design user-centered solutions that delight our clients and their customers.',
  '["3+ years of UX/UI design experience", "Proficiency in design tools (Figma, Sketch, Adobe Creative Suite)", "Strong understanding of user-centered design principles", "Experience with design systems and component libraries", "Knowledge of web and mobile design best practices", "Portfolio demonstrating design thinking and problem-solving"]'::jsonb,
  '["Create wireframes, prototypes, and high-fidelity designs", "Conduct user research and usability testing", "Collaborate with product and engineering teams", "Develop and maintain design systems", "Present design concepts to stakeholders", "Ensure consistent brand experience across all touchpoints"]'::jsonb,
  '["Competitive salary package", "Health and wellness benefits", "Professional development opportunities", "Latest design tools and software", "Flexible remote work environment", "Creative and collaborative team culture"]'::jsonb,
  '$40,000 - $55,000',
  'open',
  true,
  true,
  2,
  'UX/UI Designer | Careers | QuardCube Labs',
  'Remote UX/UI Designer position. Create beautiful user experiences and join our innovative design team.',
  'ux-ui-designer'
),

-- DevOps Engineer
(
  'DevOps Engineer',
  'Engineering',
  'Dar es Salaam, Tanzania',
  'full_time',
  'mid',
  'Help us build and maintain our cloud infrastructure and deployment pipelines. You''ll be responsible for ensuring our applications are scalable, secure, and highly available while implementing best practices for continuous integration and deployment.',
  '["3+ years of DevOps or infrastructure experience", "Experience with cloud platforms (AWS, Azure, GCP)", "Proficiency in containerization (Docker, Kubernetes)", "Knowledge of CI/CD tools (Jenkins, GitLab CI, GitHub Actions)", "Experience with infrastructure as code (Terraform, CloudFormation)", "Strong scripting skills (Bash, Python, PowerShell)"]'::jsonb,
  '["Design and implement CI/CD pipelines", "Manage cloud infrastructure and services", "Monitor application performance and availability", "Implement security best practices", "Automate deployment and scaling processes", "Collaborate with development teams on infrastructure needs"]'::jsonb,
  '["Competitive salary and benefits", "Health insurance coverage", "Professional certification support", "Cutting-edge technology stack", "Flexible working arrangements", "Growth opportunities in cloud technologies"]'::jsonb,
  '$50,000 - $65,000',
  'open',
  false,
  true,
  3,
  'DevOps Engineer | Careers | QuardCube Labs',
  'DevOps Engineer position in Dar es Salaam. Build and maintain cloud infrastructure and deployment pipelines.',
  'devops-engineer'
),

-- Technical Project Manager
(
  'Technical Project Manager',
  'Project Management',
  'Remote',
  'full_time',
  'senior',
  'Lead technical projects and ensure successful delivery of our solutions. You''ll coordinate between technical teams, clients, and stakeholders to deliver projects on time, within budget, and to the highest quality standards.',
  '["5+ years of technical project management experience", "PMP, Scrum Master, or similar certification preferred", "Strong understanding of software development lifecycle", "Experience with project management tools (Jira, Asana, Monday.com)", "Excellent communication and leadership skills", "Ability to work with cross-functional teams"]'::jsonb,
  '["Plan and execute technical projects from inception to delivery", "Coordinate with development, design, and QA teams", "Manage project timelines, budgets, and resources", "Communicate project status to stakeholders and clients", "Identify and mitigate project risks", "Ensure adherence to quality standards and best practices"]'::jsonb,
  '["Competitive salary and performance bonuses", "Comprehensive health benefits", "Professional development and certification support", "Flexible remote work environment", "Leadership development opportunities", "Access to project management tools and resources"]'::jsonb,
  '$55,000 - $70,000',
  'open',
  true,
  true,
  4,
  'Technical Project Manager | Careers | QuardCube Labs',
  'Remote Technical Project Manager role. Lead technical projects and ensure successful delivery of solutions.',
  'technical-project-manager'
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  department = EXCLUDED.department,
  location = EXCLUDED.location,
  employment_type = EXCLUDED.employment_type,
  experience_level = EXCLUDED.experience_level,
  description = EXCLUDED.description,
  requirements = EXCLUDED.requirements,
  responsibilities = EXCLUDED.responsibilities,
  benefits = EXCLUDED.benefits,
  salary_range = EXCLUDED.salary_range,
  status = EXCLUDED.status,
  remote_allowed = EXCLUDED.remote_allowed,
  featured = EXCLUDED.featured,
  order_index = EXCLUDED.order_index,
  meta_title = EXCLUDED.meta_title,
  meta_description = EXCLUDED.meta_description,
  updated_at = NOW();

-- Add table comments
COMMENT ON TABLE positions IS 'Open positions and job listings for QuardCube Labs careers page';
COMMENT ON COLUMN positions.id IS 'Unique identifier for each position';
COMMENT ON COLUMN positions.title IS 'Job title/position name';
COMMENT ON COLUMN positions.department IS 'Department or team the position belongs to';
COMMENT ON COLUMN positions.location IS 'Physical location or remote work designation';
COMMENT ON COLUMN positions.employment_type IS 'Type of employment: full_time, part_time, contract, or internship';
COMMENT ON COLUMN positions.experience_level IS 'Required experience level: entry, mid, senior, or lead';
COMMENT ON COLUMN positions.description IS 'Detailed job description';
COMMENT ON COLUMN positions.requirements IS 'JSON array of job requirements and qualifications';
COMMENT ON COLUMN positions.responsibilities IS 'JSON array of key responsibilities';
COMMENT ON COLUMN positions.benefits IS 'JSON array of benefits and perks offered';
COMMENT ON COLUMN positions.salary_range IS 'Salary range for the position';
COMMENT ON COLUMN positions.status IS 'Position status: open, closed, or draft';
COMMENT ON COLUMN positions.remote_allowed IS 'Whether remote work is allowed for this position';
COMMENT ON COLUMN positions.featured IS 'Whether this position is featured prominently';
COMMENT ON COLUMN positions.application_deadline IS 'Application deadline date';
COMMENT ON COLUMN positions.order_index IS 'Display order for sorting positions';
COMMENT ON COLUMN positions.slug IS 'URL-friendly identifier for the position';

-- Verify the data was inserted correctly
SELECT 
  id,
  title,
  department,
  location,
  employment_type,
  experience_level,
  status,
  remote_allowed,
  featured,
  order_index,
  slug
FROM positions 
ORDER BY order_index;

-- Display summary
SELECT 
  COUNT(*) as total_positions,
  COUNT(CASE WHEN status = 'open' THEN 1 END) as open_positions,
  COUNT(CASE WHEN featured = true THEN 1 END) as featured_positions,
  COUNT(CASE WHEN remote_allowed = true THEN 1 END) as remote_positions,
  COUNT(DISTINCT department) as departments
FROM positions;

COMMENT ON SCRIPT IS 'Positions table creation and data insertion script for QuardCube Labs - Created on August 3, 2025';
