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
        title: 'Jarvis AI Assistant',
        client: 'QuardCube Labs',
        description: 'An intelligent AI-powered virtual assistant that handles natural language conversations, task automation, and smart home control. Jarvis uses advanced NLP models to understand context, execute commands, and provide personalized responses through voice and text interfaces.',
        technologies: ['Python', 'OpenAI', 'NLP', 'Voice Recognition', 'TensorFlow', 'WebSockets'],
        category: 'Software Development',
        status: 'completed',
        image_url: '/images/projects/jarvis-ai.jpg',
        start_date: '2024-01-15',
        end_date: '2024-08-30'
      },
      {
        title: 'Car Wash App',
        client: 'QuardCube Labs',
        description: 'A mobile application that lets users request on-demand car wash services at their location. Features real-time service provider tracking, scheduling, multiple wash packages, secure payments, and ratings system for quality assurance.',
        technologies: ['React Native', 'Node.js', 'Google Maps API', 'Stripe', 'Firebase', 'Push Notifications'],
        category: 'Software Development',
        status: 'completed',
        image_url: '/images/projects/car-wash-app.jpg',
        start_date: '2024-03-01',
        end_date: '2024-09-30'
      },
      {
        title: 'ShopGram',
        client: 'QuardCube Labs',
        description: 'An e-commerce mobile app with an Instagram-style interface where users discover, share, and purchase products through a visually engaging social feed. Features include stories, reels for product showcases, influencer storefronts, and seamless checkout.',
        technologies: ['React Native', 'Firebase', 'Node.js', 'Stripe', 'Algolia Search', 'Cloud Storage'],
        category: 'Software Development',
        status: 'completed',
        image_url: '/images/projects/shopgram.jpg',
        start_date: '2024-02-01',
        end_date: '2024-10-31'
      },
      {
        title: 'CHMS - Church Management System',
        client: 'QuardCube Labs',
        description: 'A comprehensive church management system for member registration, attendance tracking, event scheduling, tithe and offering management, small group coordination, and multi-channel communication with congregants.',
        technologies: ['Next.js', 'PostgreSQL', 'Tailwind CSS', 'Auth.js', 'SMS API', 'Report Generation'],
        category: 'Software Development',
        status: 'completed',
        image_url: '/images/projects/chms.jpg',
        start_date: '2024-04-01',
        end_date: '2024-11-30'
      },
      {
        title: 'Loan Management System',
        client: 'QuardCube Labs',
        description: 'A complete loan management platform for processing applications, tracking repayments, calculating interest with multiple schemes, managing collateral, generating financial reports, and automated payment reminders.',
        technologies: ['React', 'Node.js', 'PostgreSQL', 'Finance API', 'PDF Generation', 'SMS Notifications'],
        category: 'Software Development',
        status: 'completed',
        image_url: '/images/projects/loan-management.jpg',
        start_date: '2024-05-01',
        end_date: '2024-12-31'
      },
      {
        title: 'Finance Tracker App',
        client: 'QuardCube Labs',
        description: 'A personal finance tracking application for managing budgets, categorizing expenses, setting savings goals, and visualizing spending patterns with interactive charts and AI-powered financial insights.',
        technologies: ['React Native', 'Node.js', 'Charts.js', 'Analytics', 'Plaid API', 'Machine Learning'],
        category: 'Software Development',
        status: 'completed',
        image_url: '/images/projects/finance-tracker.jpg',
        start_date: '2024-06-01',
        end_date: '2025-01-31'
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
