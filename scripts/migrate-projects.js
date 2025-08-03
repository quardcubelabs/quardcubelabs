const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function migrateProjects() {
  try {
    // Read environment variables
    const env = fs.readFileSync('env.txt', 'utf8');
    const lines = env.split('\n');
    const supabaseUrl = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_URL=')).split('=')[1].trim();
    const supabaseKey = lines.find(l => l.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')).split('=')[1].trim();

    console.log('Connecting to Supabase...');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check current projects
    const { data: existingProjects, error: checkError } = await supabase
      .from('projects')
      .select('id, title');
      
    if (checkError) {
      console.error('Error checking projects:', checkError);
      return;
    }
    
    console.log('Current projects count:', existingProjects ? existingProjects.length : 0);
    
    // Insert projects with only the columns that exist
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
    ];

    console.log('Inserting', projects.length, 'projects...');
    
    // Try inserting one by one to identify issues
    let successCount = 0;
    for (const project of projects) {
      try {
        const { data, error } = await supabase
          .from('projects')
          .insert([project])
          .select();

        if (error) {
          console.error('Error inserting', project.title, ':', error);
        } else {
          console.log('✓ Inserted:', project.title);
          successCount++;
        }
      } catch (err) {
        console.error('Exception inserting', project.title, ':', err);
      }
    }

    console.log('Successfully inserted', successCount, 'projects');
    
    // Verify final count
    const { data: finalProjects, error: finalError } = await supabase
      .from('projects')
      .select('id, title')
      .order('created_at');
      
    if (!finalError) {
      console.log('Final projects count:', finalProjects ? finalProjects.length : 0);
      console.log('All projects:');
      finalProjects?.forEach((p, i) => console.log(i + 1 + '.', p.title));
    }

  } catch (err) {
    console.error('Exception:', err);
  }
}

migrateProjects();
