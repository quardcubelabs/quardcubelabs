-- Create applications table for job applications
-- This script creates the table structure for managing job applications

-- Create the applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position_id UUID NOT NULL REFERENCES positions(id) ON DELETE CASCADE,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  location VARCHAR(255),
  linkedin_url TEXT,
  portfolio_url TEXT,
  resume_url TEXT,
  cover_letter TEXT,
  experience_years INTEGER,
  current_salary VARCHAR(50),
  expected_salary VARCHAR(50),
  availability_date DATE,
  status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'interview_scheduled', 'interview_completed', 'rejected', 'hired')),
  notes TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  interview_date TIMESTAMP WITH TIME ZONE,
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_applications_position_id ON applications(position_id);
CREATE INDEX IF NOT EXISTS idx_applications_status ON applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_email ON applications(email);
CREATE INDEX IF NOT EXISTS idx_applications_applied_at ON applications(applied_at);
CREATE INDEX IF NOT EXISTS idx_applications_reviewed_at ON applications(reviewed_at);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_applications_updated_at 
    BEFORE UPDATE ON applications 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add table comments
COMMENT ON TABLE applications IS 'Job applications submitted through the careers page';
COMMENT ON COLUMN applications.id IS 'Unique identifier for each application';
COMMENT ON COLUMN applications.position_id IS 'Foreign key reference to the position being applied for';
COMMENT ON COLUMN applications.first_name IS 'Applicant first name';
COMMENT ON COLUMN applications.last_name IS 'Applicant last name';
COMMENT ON COLUMN applications.email IS 'Applicant email address';
COMMENT ON COLUMN applications.phone IS 'Applicant phone number';
COMMENT ON COLUMN applications.location IS 'Applicant current location';
COMMENT ON COLUMN applications.linkedin_url IS 'LinkedIn profile URL';
COMMENT ON COLUMN applications.portfolio_url IS 'Portfolio or personal website URL';
COMMENT ON COLUMN applications.resume_url IS 'URL to uploaded resume file';
COMMENT ON COLUMN applications.cover_letter IS 'Cover letter text';
COMMENT ON COLUMN applications.experience_years IS 'Years of relevant experience';
COMMENT ON COLUMN applications.current_salary IS 'Current salary range';
COMMENT ON COLUMN applications.expected_salary IS 'Expected salary range';
COMMENT ON COLUMN applications.availability_date IS 'Date when applicant can start';
COMMENT ON COLUMN applications.status IS 'Application status in the hiring process';
COMMENT ON COLUMN applications.notes IS 'Internal notes about the application';
COMMENT ON COLUMN applications.reviewed_by IS 'HR/Manager who reviewed the application';
COMMENT ON COLUMN applications.reviewed_at IS 'When the application was reviewed';
COMMENT ON COLUMN applications.interview_date IS 'Scheduled interview date and time';
COMMENT ON COLUMN applications.applied_at IS 'When the application was submitted';

-- Create a view for applications with position details
CREATE OR REPLACE VIEW applications_with_positions AS
SELECT 
  a.*,
  p.title as position_title,
  p.department as position_department,
  p.location as position_location,
  p.employment_type as position_employment_type,
  p.experience_level as position_experience_level
FROM applications a
JOIN positions p ON a.position_id = p.id;

COMMENT ON VIEW applications_with_positions IS 'Applications joined with position details for easier querying';

-- Verify table structure
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'applications' 
ORDER BY ordinal_position;

COMMENT ON SCRIPT IS 'Applications table creation script for QuardCube Labs careers - Created on August 3, 2025';
