-- Seed data for reports table
INSERT INTO reports (id, title, description, category, formats, lastGenerated, status, size, downloads) VALUES
('monthly-sales-001', 'Monthly Sales Report', 'Comprehensive sales performance analysis for the current month', 'Sales', ARRAY['pdf', 'excel'], '2024-01-15T08:30:00Z', 'ready', '2.5 MB', 12),
('customer-analytics-001', 'Customer Analytics Dashboard', 'Customer behavior and engagement metrics analysis', 'Analytics', ARRAY['pdf', 'csv'], '2024-01-14T14:20:00Z', 'ready', '1.8 MB', 8),
('financial-summary-001', 'Quarterly Financial Summary', 'Financial performance overview for Q4 2023', 'Financial', ARRAY['pdf', 'excel'], '2024-01-10T09:15:00Z', 'ready', '3.2 MB', 15),
('inventory-report-001', 'Inventory Management Report', 'Current stock levels and inventory turnover analysis', 'Operations', ARRAY['pdf', 'csv'], '2024-01-12T11:45:00Z', 'ready', '1.2 MB', 6),
('project-progress-001', 'Project Progress Report', 'Status update on all active development projects', 'Projects', ARRAY['pdf'], '2024-01-13T16:30:00Z', 'ready', '4.1 MB', 9),
('user-engagement-001', 'User Engagement Metrics', 'Platform usage and user interaction analysis', 'Analytics', ARRAY['pdf', 'csv'], '2024-01-11T10:20:00Z', 'ready', '2.3 MB', 11),
('security-audit-001', 'Security Audit Report', 'Comprehensive security assessment and recommendations', 'Security', ARRAY['pdf'], '2024-01-09T13:00:00Z', 'ready', '5.7 MB', 4),
('marketing-campaign-001', 'Marketing Campaign Analysis', 'Performance metrics for recent marketing initiatives', 'Marketing', ARRAY['pdf', 'excel'], '2024-01-08T15:45:00Z', 'ready', '2.9 MB', 7),
('weekly-ops-001', 'Weekly Operations Summary', 'Operational KPIs and performance indicators', 'Operations', ARRAY['pdf', 'csv'], NULL, 'generating', '0 MB', 0),
('data-backup-001', 'Data Backup Status Report', 'Database backup verification and integrity check', 'Technical', ARRAY['pdf'], '2024-01-07T07:30:00Z', 'ready', '1.5 MB', 3);

-- Update the sequence to ensure future inserts don't conflict
-- This is PostgreSQL specific, adjust if using different database
SELECT setval(pg_get_serial_sequence('reports', 'created_at'), (SELECT MAX(extract(epoch from created_at)) FROM reports));
