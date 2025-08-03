-- Create projects table with all required fields for QuardCube Labs
-- This script creates the complete projects table structure to match the migration data

-- Drop table if it exists (be careful with this in production)
DROP TABLE IF EXISTS projects CASCADE;

-- Create the projects table with all required columns
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  client VARCHAR(255),
  description TEXT,
  short_description TEXT,
  technologies JSONB DEFAULT '[]'::jsonb,
  category VARCHAR(100) NOT NULL,
  status VARCHAR(50) DEFAULT 'completed' CHECK (status IN ('completed', 'in_progress', 'planned', 'cancelled')),
  project_url TEXT,
  github_url TEXT,
  image_url TEXT,
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

-- Create indexes for better performance
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_category ON projects(category);
CREATE INDEX idx_projects_featured ON projects(featured);
CREATE INDEX idx_projects_order_index ON projects(order_index);
CREATE INDEX idx_projects_slug ON projects(slug);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at column
CREATE TRIGGER update_projects_updated_at 
    BEFORE UPDATE ON projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments to the table and important columns
COMMENT ON TABLE projects IS 'Portfolio projects for QuardCube Labs - stores all project information including client details, technologies, and metadata';
COMMENT ON COLUMN projects.id IS 'Unique identifier for each project';
COMMENT ON COLUMN projects.title IS 'Project title/name';
COMMENT ON COLUMN projects.client IS 'Client company or organization name';
COMMENT ON COLUMN projects.description IS 'Full project description';
COMMENT ON COLUMN projects.short_description IS 'Brief project summary for listings';
COMMENT ON COLUMN projects.technologies IS 'JSON array of technologies used in the project';
COMMENT ON COLUMN projects.category IS 'Project category (e.g., Software Development, Web Designing, etc.)';
COMMENT ON COLUMN projects.status IS 'Project status: completed, in_progress, planned, or cancelled';
COMMENT ON COLUMN projects.project_url IS 'Live project URL if available';
COMMENT ON COLUMN projects.github_url IS 'GitHub repository URL if available';
COMMENT ON COLUMN projects.image_url IS 'Main project image/thumbnail URL';
COMMENT ON COLUMN projects.start_date IS 'Project start date';
COMMENT ON COLUMN projects.end_date IS 'Project completion date';
COMMENT ON COLUMN projects.budget IS 'Project budget in USD';
COMMENT ON COLUMN projects.team_size IS 'Number of team members who worked on the project';
COMMENT ON COLUMN projects.featured IS 'Whether this project is featured on the homepage';
COMMENT ON COLUMN projects.order_index IS 'Display order for sorting projects';
COMMENT ON COLUMN projects.meta_title IS 'SEO meta title for project page';
COMMENT ON COLUMN projects.meta_description IS 'SEO meta description for project page';
COMMENT ON COLUMN projects.slug IS 'URL-friendly identifier for the project';
COMMENT ON COLUMN projects.created_at IS 'Timestamp when the project record was created';
COMMENT ON COLUMN projects.updated_at IS 'Timestamp when the project record was last updated';

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- Show table constraints
SELECT 
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'projects';

-- Show indexes
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'projects';

COMMENT ON SCRIPT IS 'Projects table creation script for QuardCube Labs - Created on August 3, 2025';
