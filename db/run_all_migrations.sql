-- Run all database migrations for services, projects, positions, and blogs

-- Check if the update_updated_at_column function already exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Run Services Migration
\i db/migrations/0004_add_services_table.sql

-- Run Projects Migration  
\i db/migrations/0005_add_projects_table.sql

-- Run Positions Migration
\i db/migrations/0006_add_positions_table.sql

-- Run Blogs Migration
\i db/migrations/0007_add_blogs_table.sql

-- Run Blog Views Function
\i db/migrations/0008_add_blog_views_function.sql

-- Verify tables were created
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('services', 'projects', 'positions', 'blogs');

-- Show sample data
SELECT 'Services' as table_name, count(*) as row_count FROM services
UNION ALL
SELECT 'Projects' as table_name, count(*) as row_count FROM projects  
UNION ALL
SELECT 'Positions' as table_name, count(*) as row_count FROM positions
UNION ALL
SELECT 'Blogs' as table_name, count(*) as row_count FROM blogs;
