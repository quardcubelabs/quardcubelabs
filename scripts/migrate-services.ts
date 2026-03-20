import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables from .env file manually
const envPath = join(__dirname, '..', '.env')
const envContent = readFileSync(envPath, 'utf8')
const envVars: Record<string, string> = {}
envContent.split('\n').forEach(line => {
  const [key, value] = line.split('=')
  if (key && value) {
    envVars[key.trim()] = value.replace(/"/g, '').trim()
  }
})

const supabaseUrl = envVars.SUPABASE_URL
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runMigration() {
  try {
    
    // First, clear existing sample data to avoid duplicates
    const { error: deleteError } = await supabase
      .from('services')
      .delete()
      .in('title', [
        'Web Development', 
        'Mobile App Development', 
        'UI/UX Design', 
        'Digital Marketing', 
        'Consulting Services'
      ])
    
    if (deleteError) {
      console.error('Error clearing sample data:', deleteError)
    } else {
    }

    // Insert the actual services from the website
    const servicesData = [
      {
        title: 'Custom Software Development',
        description: 'Our expert development team creates custom software solutions that address your unique business challenges. From enterprise applications to specialized tools, we deliver high-quality, scalable software that drives efficiency and growth.',
        short_description: 'Tailored software solutions designed to meet your specific business requirements.',
        category: 'development',
        status: 'active' as const,
        features: [
          'Requirements gathering and analysis', 
          'Solution architecture and design', 
          'Agile development and testing', 
          'Deployment and integration', 
          'Ongoing support and maintenance',
          'React', 'Node.js', 'Python', 'Java', 'AWS', 'Azure', '.NET', 'MongoDB', 'PostgreSQL'
        ],
        image_url: '/placeholder.svg?height=600&width=800',
        order_index: 1,
        meta_title: 'Custom Software Development | QuardCube Labs',
        meta_description: 'Expert custom software development services. Tailored solutions for your business needs using modern technologies.',
        slug: 'custom-software-development'
      },
      {
        title: 'Web Design & Development',
        description: 'We create visually appealing, user-friendly websites that represent your brand and engage your audience. Our web solutions are responsive, accessible, and optimized for performance across all devices and platforms.',
        short_description: 'Stunning, responsive websites with modern UI/UX that captivate your audience.',
        category: 'design',
        status: 'active' as const,
        features: [
          'Discovery and strategy planning', 
          'Wireframing and prototyping', 
          'Visual design and branding', 
          'Frontend and backend development', 
          'Testing, launch, and post-launch support',
          'HTML5', 'CSS3', 'JavaScript', 'React', 'Next.js', 'WordPress', 'Shopify', 'Tailwind CSS', 'GraphQL'
        ],
        image_url: '/placeholder.svg?height=600&width=800',
        order_index: 2,
        meta_title: 'Web Design & Development | QuardCube Labs',
        meta_description: 'Professional web design and development services. Responsive, modern websites that drive results.',
        slug: 'web-design-development'
      },
      {
        title: 'Power Management Solutions',
        description: 'Our power management solutions help businesses optimize energy usage, reduce costs, and ensure uninterrupted operations. We provide comprehensive services from assessment to implementation and ongoing monitoring.',
        short_description: 'Reliable power management systems to keep your infrastructure running efficiently.',
        category: 'consulting',
        status: 'active' as const,
        features: [
          'Energy audit and assessment', 
          'Solution design and planning', 
          'Equipment procurement and installation', 
          'System integration and testing', 
          'Monitoring and maintenance',
          'Smart Grid Technology', 'Energy Management Systems', 'UPS Systems', 'Power Distribution Units', 'Renewable Energy Integration'
        ],
        image_url: '/placeholder.svg?height=600&width=800',
        order_index: 3,
        meta_title: 'Power Management Solutions | QuardCube Labs',
        meta_description: 'Advanced power management solutions for optimal energy efficiency and cost reduction.',
        slug: 'power-management-solutions'
      },
      {
        title: 'Cybersecurity Services',
        description: 'Our cybersecurity services provide robust protection for your digital infrastructure, data, and applications. We implement multi-layered security strategies to defend against evolving threats and ensure business continuity.',
        short_description: 'Comprehensive security solutions to protect your digital assets from threats.',
        category: 'consulting',
        status: 'active' as const,
        features: [
          'Security assessment and vulnerability scanning', 
          'Security architecture design', 
          'Implementation of security controls', 
          'Security monitoring and incident response', 
          'Security awareness training',
          'Firewall Systems', 'Intrusion Detection', 'Endpoint Protection', 'Data Encryption', 'Identity Management', 'SIEM'
        ],
        image_url: '/placeholder.svg?height=600&width=800',
        order_index: 4,
        meta_title: 'Cybersecurity Services | QuardCube Labs',
        meta_description: 'Comprehensive cybersecurity services to protect your business from digital threats and ensure data security.',
        slug: 'cybersecurity-services'
      },
      {
        title: 'Network Infrastructure',
        description: 'We design, implement, and manage network infrastructure that provides reliable, high-performance connectivity for your business. Our solutions scale with your needs and incorporate the latest technologies for optimal performance.',
        short_description: 'Robust networking solutions that ensure seamless connectivity across your organization.',
        category: 'consulting',
        status: 'active' as const,
        features: [
          'Network assessment and planning', 
          'Architecture design', 
          'Equipment selection and procurement', 
          'Implementation and configuration', 
          'Network monitoring and management',
          'Cisco Systems', 'SD-WAN', 'Network Virtualization', 'Cloud Networking', 'Wireless Solutions', 'VPN Technologies'
        ],
        image_url: '/placeholder.svg?height=600&width=800',
        order_index: 5,
        meta_title: 'Network Infrastructure | QuardCube Labs',
        meta_description: 'Professional network infrastructure services for reliable, high-performance business connectivity.',
        slug: 'network-infrastructure'
      },
      {
        title: 'IT Consulting & Support',
        description: 'Our IT consulting and support services provide strategic guidance and technical expertise to help you leverage technology for business success. We offer proactive support, problem resolution, and strategic planning to optimize your IT investments.',
        short_description: 'Expert IT consulting and support services for your business technology needs.',
        category: 'consulting',
        status: 'active' as const,
        features: [
          'IT assessment and discovery', 
          'Strategic planning and roadmap development', 
          'Solution recommendation and implementation', 
          'Ongoing support and maintenance', 
          'Regular review and optimization',
          'Help Desk Systems', 'Remote Monitoring', 'IT Service Management', 'Cloud Migration', 'Digital Transformation'
        ],
        image_url: '/placeholder.svg?height=600&width=800',
        order_index: 6,
        meta_title: 'IT Consulting & Support | QuardCube Labs',
        meta_description: 'Expert IT consulting and support services to optimize your technology investments and drive business success.',
        slug: 'it-consulting-support'
      }
    ]

    const { data, error } = await supabase
      .from('services')
      .insert(servicesData)
      .select()

    if (error) {
      console.error('Error inserting services:', error)
      process.exit(1)
    }

    data.forEach(service => {
    })

    
  } catch (error) {
    console.error('Migration failed:', error)
    process.exit(1)
  }
}

runMigration()
