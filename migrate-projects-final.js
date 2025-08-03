const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function main() {
  try {
    console.log('=== QuardCube Labs Projects Migration ===')
    
    // Read environment variables
    const env = fs.readFileSync('env.txt', 'utf8')
    const lines = env.split('\n')
    const supabaseUrl = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim()
    const supabaseKey = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim()

    console.log('✓ Environment variables loaded')
    console.log('✓ Connecting to Supabase...')
    
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Test connection by checking current projects
    console.log('✓ Testing database connection...')
    const { data: currentProjects, error: testError } = await supabase
      .from('projects')
      .select('id, title')
      .limit(5)

    if (testError) {
      console.error('✗ Database connection failed:', testError)
      return
    }

    console.log('✓ Database connection successful')
    console.log('✓ Current projects count:', currentProjects ? currentProjects.length : 0)

    if (currentProjects && currentProjects.length > 0) {
      console.log('Current projects:')
      currentProjects.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title}`)
      })
    }

    // Check if we already have 6 projects
    if (currentProjects && currentProjects.length >= 6) {
      console.log('✓ Already have 6 or more projects. Migration not needed.')
      return
    }

    console.log('\\n=== Starting Projects Migration ===')

    // Define the 6 projects with basic fields only
    const projects = [
      {
        title: 'Enterprise Resource Planning System',
        client: 'Global Manufacturing Corporation',
        description: 'Developed and implemented a comprehensive ERP solution for a manufacturing company with operations in 12 countries. The system integrated production, inventory, sales, and financial data into a unified platform, providing real-time insights and streamlining operations.',
        technologies: ['React', 'Node.js', 'MongoDB', 'Docker', 'Kubernetes', 'Azure Cloud'],
        category: 'Software Development',
        status: 'completed',
        image_url: '/images/projects/erp-system.jpg',
        start_date: '2022-01-15',
        end_date: '2023-06-30'
      },
      {
        title: 'E-commerce Platform Redesign',
        client: 'Fashion Retail Brand',
        description: 'Complete redesign of an e-commerce platform for a leading fashion retail brand, focusing on user experience, mobile responsiveness, and conversion optimization.',
        technologies: ['Next.js', 'Tailwind CSS', 'Shopify', 'Stripe', 'Algolia Search'],
        category: 'Web Designing',
        status: 'completed',
        image_url: '/images/projects/ecommerce-redesign.jpg',
        start_date: '2023-01-01',
        end_date: '2023-06-30'
      },
      {
        title: 'Secure Banking Infrastructure',
        client: 'Regional Banking Network',
        description: 'Designed and implemented a comprehensive security infrastructure for a regional banking network with 50+ branches. The solution included advanced encryption, multi-factor authentication, and real-time threat monitoring.',
        technologies: ['Cisco Security', 'Palo Alto Networks', 'Okta', 'Splunk', 'Encryption Technologies', 'Biometric Authentication'],
        category: 'Security Products',
        status: 'completed',
        image_url: '/images/projects/banking-security.jpg',
        start_date: '2022-03-01',
        end_date: '2023-02-28'
      },
      {
        title: 'Smart Grid Power Management',
        client: 'Commercial Real Estate Developer',
        description: 'Developed and implemented a smart grid power management system for a large commercial real estate portfolio, integrating renewable energy sources and advanced monitoring capabilities.',
        technologies: ['IoT Sensors', 'Energy Management Systems', 'Solar Integration', 'Battery Storage', 'AI/ML Algorithms', 'Cloud Analytics'],
        category: 'Power Solutions',
        status: 'completed',
        image_url: '/images/projects/smart-grid.jpg',
        start_date: '2023-02-01',
        end_date: '2024-04-30'
      },
      {
        title: 'Corporate Network Infrastructure',
        client: 'Global Consulting Firm',
        description: 'Designed and implemented a scalable network infrastructure for a multinational consulting firm with 20+ offices worldwide. The solution provided secure, high-performance connectivity while supporting remote work capabilities.',
        technologies: ['Cisco SD-WAN', 'Meraki', 'Azure Virtual WAN', 'Zero Trust Security', 'Cloud Connectivity', 'Global VPN'],
        category: 'Connectivity & Networking',
        status: 'completed',
        image_url: '/images/projects/network-infrastructure.jpg',
        start_date: '2022-06-01',
        end_date: '2023-01-31'
      },
      {
        title: 'Healthcare IT System Integration',
        client: 'Regional Healthcare Provider',
        description: 'Integrated various healthcare IT systems to create a unified platform for patient data management and analytics, improving care coordination and operational efficiency.',
        technologies: ['HL7 FHIR', 'Interoperability APIs', 'Healthcare Data Warehouse', 'HIPAA-Compliant Cloud', 'Clinical Analytics', 'Secure Messaging'],
        category: 'IT Products & Services',
        status: 'completed',
        image_url: '/images/projects/healthcare-it.jpg',
        start_date: '2023-03-01',
        end_date: '2023-12-31'
      }
    ]

    console.log('✓ Inserting', projects.length, 'projects...')

    // Insert projects one by one
    let successCount = 0
    for (let i = 0; i < projects.length; i++) {
      const project = projects[i]
      console.log(`  Inserting ${i + 1}/${projects.length}: ${project.title}`)
      
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert([project])
          .select('id, title')

        if (error) {
          console.error(`  ✗ Error inserting ${project.title}:`, error.message)
        } else {
          console.log(`  ✓ Successfully inserted: ${project.title}`)
          successCount++
        }
      } catch (err) {
        console.error(`  ✗ Exception inserting ${project.title}:`, err.message)
      }
    }

    console.log('\\n=== Migration Results ===')
    console.log('✓ Successfully inserted:', successCount, 'projects')
    console.log('✗ Failed to insert:', projects.length - successCount, 'projects')

    // Verify final state
    console.log('\\n=== Verification ===')
    const { data: finalProjects, error: verifyError } = await supabase
      .from('projects')
      .select('id, title, category')
      .order('created_at')

    if (verifyError) {
      console.error('✗ Verification failed:', verifyError)
    } else {
      console.log('✓ Final projects count:', finalProjects ? finalProjects.length : 0)
      console.log('✓ All projects in database:')
      finalProjects?.forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.title} (${p.category})`)
      })
    }

    console.log('\\n=== Migration Complete ===')

  } catch (error) {
    console.error('✗ Migration failed:', error)
  }
}

main()
