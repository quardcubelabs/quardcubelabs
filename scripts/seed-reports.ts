import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const sampleReports = [
  {
    id: 'monthly-sales-001',
    title: 'Monthly Sales Report',
    description: 'Comprehensive sales performance analysis for the current month',
    category: 'Sales',
    formats: ['pdf', 'excel'],
    lastgenerated: '2024-01-15T08:30:00Z',
    status: 'ready',
    size: '2.5 MB',
    downloads: 12
  },
  {
    id: 'customer-analytics-001',
    title: 'Customer Analytics Dashboard',
    description: 'Customer behavior and engagement metrics analysis',
    category: 'Analytics',
    formats: ['pdf', 'csv'],
    lastgenerated: '2024-01-14T14:20:00Z',
    status: 'ready',
    size: '1.8 MB',
    downloads: 8
  },
  {
    id: 'financial-summary-001',
    title: 'Quarterly Financial Summary',
    description: 'Financial performance overview for Q4 2023',
    category: 'Financial',
    formats: ['pdf', 'excel'],
    lastgenerated: '2024-01-10T09:15:00Z',
    status: 'ready',
    size: '3.2 MB',
    downloads: 15
  },
  {
    id: 'inventory-report-001',
    title: 'Inventory Management Report',
    description: 'Current stock levels and inventory turnover analysis',
    category: 'Operations',
    formats: ['pdf', 'csv'],
    lastgenerated: '2024-01-12T11:45:00Z',
    status: 'ready',
    size: '1.2 MB',
    downloads: 6
  },
  {
    id: 'project-progress-001',
    title: 'Project Progress Report',
    description: 'Status update on all active development projects',
    category: 'Projects',
    formats: ['pdf'],
    lastgenerated: '2024-01-13T16:30:00Z',
    status: 'ready',
    size: '4.1 MB',
    downloads: 9
  },
  {
    id: 'user-engagement-001',
    title: 'User Engagement Metrics',
    description: 'Platform usage and user interaction analysis',
    category: 'Analytics',
    formats: ['pdf', 'csv'],
    lastgenerated: '2024-01-11T10:20:00Z',
    status: 'ready',
    size: '2.3 MB',
    downloads: 11
  },
  {
    id: 'security-audit-001',
    title: 'Security Audit Report',
    description: 'Comprehensive security assessment and recommendations',
    category: 'Security',
    formats: ['pdf'],
    lastgenerated: '2024-01-09T13:00:00Z',
    status: 'ready',
    size: '5.7 MB',
    downloads: 4
  },
  {
    id: 'marketing-campaign-001',
    title: 'Marketing Campaign Analysis',
    description: 'Performance metrics for recent marketing initiatives',
    category: 'Marketing',
    formats: ['pdf', 'excel'],
    lastgenerated: '2024-01-08T15:45:00Z',
    status: 'ready',
    size: '2.9 MB',
    downloads: 7
  },
  {
    id: 'weekly-ops-001',
    title: 'Weekly Operations Summary',
    description: 'Operational KPIs and performance indicators',
    category: 'Operations',
    formats: ['pdf', 'csv'],
    lastgenerated: null,
    status: 'generating',
    size: '0 MB',
    downloads: 0
  },
  {
    id: 'data-backup-001',
    title: 'Data Backup Status Report',
    description: 'Database backup verification and integrity check',
    category: 'Technical',
    formats: ['pdf'],
    lastgenerated: '2024-01-07T07:30:00Z',
    status: 'ready',
    size: '1.5 MB',
    downloads: 3
  }
]

async function seedReports() {
  try {
    
    // First, clear existing data
    const { error: deleteError } = await supabase
      .from('reports')
      .delete()
      .neq('id', 'non-existent-id') // Delete all records
    
    if (deleteError) {
      console.error('Error clearing existing reports:', deleteError)
    } else {
    }
    
    // Insert sample data
    const { data, error } = await supabase
      .from('reports')
      .insert(sampleReports)
    
    if (error) {
      console.error('Error seeding reports:', error)
      process.exit(1)
    }
    
    
  } catch (error) {
    console.error('Unexpected error:', error)
    process.exit(1)
  }
}

seedReports().then(() => {
  process.exit(0)
}).catch((error) => {
  console.error('Seeding failed:', error)
  process.exit(1)
})
