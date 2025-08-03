-- Add missing columns to projects table

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add short_description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'short_description') THEN
        ALTER TABLE projects ADD COLUMN short_description TEXT;
    END IF;

    -- Add slug column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'slug') THEN
        ALTER TABLE projects ADD COLUMN slug VARCHAR(255) UNIQUE;
    END IF;

    -- Add order_index column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'order_index') THEN
        ALTER TABLE projects ADD COLUMN order_index INTEGER DEFAULT 0;
    END IF;

    -- Add budget column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'budget') THEN
        ALTER TABLE projects ADD COLUMN budget DECIMAL(10,2);
    END IF;

    -- Add team_size column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'team_size') THEN
        ALTER TABLE projects ADD COLUMN team_size INTEGER;
    END IF;

    -- Add featured column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'featured') THEN
        ALTER TABLE projects ADD COLUMN featured BOOLEAN DEFAULT false;
    END IF;

    -- Add project_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'project_url') THEN
        ALTER TABLE projects ADD COLUMN project_url TEXT;
    END IF;

    -- Add github_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'github_url') THEN
        ALTER TABLE projects ADD COLUMN github_url TEXT;
    END IF;

    -- Add meta_title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'meta_title') THEN
        ALTER TABLE projects ADD COLUMN meta_title VARCHAR(255);
    END IF;

    -- Add meta_description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'meta_description') THEN
        ALTER TABLE projects ADD COLUMN meta_description TEXT;
    END IF;

    -- Add challenge column (JSONB for rich content)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'challenge') THEN
        ALTER TABLE projects ADD COLUMN challenge TEXT;
    END IF;

    -- Add solution column (JSONB for rich content)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'solution') THEN
        ALTER TABLE projects ADD COLUMN solution TEXT;
    END IF;

    -- Add results column (JSONB for array of results)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'results') THEN
        ALTER TABLE projects ADD COLUMN results JSONB DEFAULT '[]';
    END IF;

    -- Add gallery column (JSONB for array of images)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'gallery') THEN
        ALTER TABLE projects ADD COLUMN gallery JSONB DEFAULT '[]';
    END IF;

    -- Add testimonial column (JSONB for testimonial object)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'testimonial') THEN
        ALTER TABLE projects ADD COLUMN testimonial JSONB;
    END IF;

    -- Add location column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'location') THEN
        ALTER TABLE projects ADD COLUMN location VARCHAR(255);
    END IF;

    -- Add duration column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'duration') THEN
        ALTER TABLE projects ADD COLUMN duration VARCHAR(100);
    END IF;

    -- Add year column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projects' AND column_name = 'year') THEN
        ALTER TABLE projects ADD COLUMN year INTEGER;
    END IF;

END $$;

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_projects_slug ON projects(slug);
CREATE INDEX IF NOT EXISTS idx_projects_order_index ON projects(order_index);
CREATE INDEX IF NOT EXISTS idx_projects_featured ON projects(featured);
CREATE INDEX IF NOT EXISTS idx_projects_year ON projects(year);

-- Now insert the 6 projects with all required data
INSERT INTO projects (
    title, 
    client, 
    description, 
    short_description, 
    technologies, 
    category, 
    status, 
    project_url, 
    image_url, 
    start_date, 
    end_date, 
    budget, 
    team_size, 
    featured, 
    order_index, 
    slug,
    challenge,
    solution,
    results,
    gallery,
    testimonial,
    location,
    duration,
    year
) VALUES
(
    'Enterprise Resource Planning System',
    'Global Manufacturing Corporation',
    'Developed and implemented a comprehensive ERP solution for a manufacturing company with operations in 12 countries. The system integrated production, inventory, sales, and financial data into a unified platform, providing real-time insights and streamlining operations.',
    'Comprehensive ERP solution for global manufacturing',
    '["React", "Node.js", "MongoDB", "Docker", "Kubernetes", "Azure Cloud"]'::jsonb,
    'Software Development',
    'completed',
    null,
    '/images/projects/erp-system.jpg',
    '2022-01-15',
    '2023-06-30',
    150000.00,
    8,
    true,
    1,
    'enterprise-erp-system',
    'The client struggled with disparate systems across 12 countries, leading to data silos, inefficient processes, and lack of real-time visibility into global operations.',
    'We designed and implemented a unified ERP platform that integrated all business processes, providing real-time data synchronization and comprehensive analytics across all locations.',
    '["40% reduction in operational costs", "Real-time visibility across 12 countries", "Streamlined inventory management", "Improved decision-making with unified analytics", "95% user adoption rate within 6 months"]'::jsonb,
    '["/images/projects/erp-1.jpg", "/images/projects/erp-2.jpg", "/images/projects/erp-3.jpg"]'::jsonb,
    '{"quote": "QuardCube Labs transformed our global operations. The ERP system they delivered exceeded our expectations and provided ROI within the first year.", "author": "Sarah Johnson", "position": "CTO, Global Manufacturing Corporation"}'::jsonb,
    'Global (12 Countries)',
    '18 months',
    2023
),
(
    'E-commerce Platform Redesign',
    'Fashion Retail Brand',
    'Complete redesign of an e-commerce platform for a leading fashion retail brand, focusing on user experience, mobile responsiveness, and conversion optimization.',
    'Modern e-commerce platform redesign',
    '["Next.js", "Tailwind CSS", "Shopify", "Stripe", "Algolia Search"]'::jsonb,
    'Web Designing',
    'completed',
    'https://demo-ecommerce.vercel.app',
    '/images/projects/ecommerce-redesign.jpg',
    '2023-01-01',
    '2023-06-30',
    75000.00,
    5,
    true,
    2,
    'ecommerce-platform-redesign',
    'The existing platform had poor mobile experience, slow loading times, and low conversion rates, resulting in lost sales and customer dissatisfaction.',
    'We rebuilt the platform using modern technologies, implemented responsive design, optimized performance, and integrated advanced search and payment solutions.',
    '["65% increase in mobile conversion rates", "50% faster page load times", "Enhanced user experience", "Integrated advanced search functionality", "Seamless payment processing"]'::jsonb,
    '["/images/projects/ecommerce-1.jpg", "/images/projects/ecommerce-2.jpg", "/images/projects/ecommerce-3.jpg"]'::jsonb,
    '{"quote": "The new platform has revolutionized our online presence. Mobile sales have increased dramatically, and our customers love the improved experience.", "author": "Michael Chen", "position": "Digital Director, Fashion Retail Brand"}'::jsonb,
    'New York, USA',
    '6 months',
    2023
),
(
    'Secure Banking Infrastructure',
    'Regional Banking Network',
    'Designed and implemented a comprehensive security infrastructure for a regional banking network with 50+ branches. The solution included advanced encryption, multi-factor authentication, and real-time threat monitoring.',
    'Comprehensive banking security solution',
    '["Cisco Security", "Palo Alto Networks", "Okta", "Splunk", "Encryption Technologies", "Biometric Authentication"]'::jsonb,
    'Security Products',
    'completed',
    null,
    '/images/projects/banking-security.jpg',
    '2022-03-01',
    '2023-02-28',
    200000.00,
    10,
    true,
    3,
    'secure-banking-infrastructure',
    'The banking network faced increasing cybersecurity threats and needed to meet strict regulatory compliance requirements while maintaining seamless customer experience.',
    'We implemented a multi-layered security architecture with advanced threat detection, encryption protocols, and biometric authentication systems across all branches.',
    '["99.9% threat detection rate", "Full regulatory compliance achieved", "Zero security incidents post-implementation", "Enhanced customer trust", "Streamlined authentication processes"]'::jsonb,
    '["/images/projects/banking-1.jpg", "/images/projects/banking-2.jpg", "/images/projects/banking-3.jpg"]'::jsonb,
    '{"quote": "QuardCube Labs delivered a security solution that not only protects our network but also enhances our customer experience. Their expertise is unmatched.", "author": "David Rodriguez", "position": "Chief Security Officer, Regional Banking Network"}'::jsonb,
    'Texas, USA',
    '12 months',
    2023
),
(
    'Smart Grid Power Management',
    'Commercial Real Estate Developer',
    'Developed and implemented a smart grid power management system for a large commercial real estate portfolio, integrating renewable energy sources and advanced monitoring capabilities.',
    'Smart grid power management system',
    '["IoT Sensors", "Energy Management Systems", "Solar Integration", "Battery Storage", "AI/ML Algorithms", "Cloud Analytics"]'::jsonb,
    'Power Solutions',
    'completed',
    null,
    '/images/projects/smart-grid.jpg',
    '2023-02-01',
    '2024-04-30',
    120000.00,
    6,
    true,
    4,
    'smart-grid-power-management',
    'The real estate portfolio needed to reduce energy costs, integrate renewable sources, and provide real-time monitoring across multiple properties.',
    'We designed an intelligent power management system that optimizes energy usage, integrates solar and battery storage, and provides comprehensive analytics.',
    '["30% reduction in energy costs", "Successful integration of renewable sources", "Real-time monitoring across all properties", "Predictive maintenance capabilities", "Carbon footprint reduction of 40%"]'::jsonb,
    '["/images/projects/smart-grid-1.jpg", "/images/projects/smart-grid-2.jpg", "/images/projects/smart-grid-3.jpg"]'::jsonb,
    '{"quote": "The smart grid solution has transformed our energy management. We are seeing significant cost savings and our sustainability goals are being met ahead of schedule.", "author": "Lisa Thompson", "position": "Sustainability Director, Commercial Real Estate Developer"}'::jsonb,
    'California, USA',
    '15 months',
    2024
),
(
    'Corporate Network Infrastructure',
    'Global Consulting Firm',
    'Designed and implemented a scalable network infrastructure for a multinational consulting firm with 20+ offices worldwide. The solution provided secure, high-performance connectivity while supporting remote work capabilities.',
    'Global network infrastructure solution',
    '["Cisco SD-WAN", "Meraki", "Azure Virtual WAN", "Zero Trust Security", "Cloud Connectivity", "Global VPN"]'::jsonb,
    'Connectivity & Networking',
    'completed',
    null,
    '/images/projects/network-infrastructure.jpg',
    '2022-06-01',
    '2023-01-31',
    180000.00,
    7,
    true,
    5,
    'corporate-network-infrastructure',
    'The consulting firm needed a reliable, secure network infrastructure to connect 20+ global offices while supporting an increasingly remote workforce.',
    'We implemented a comprehensive SD-WAN solution with Zero Trust security, ensuring seamless connectivity and robust security across all locations.',
    '["99.9% network uptime achieved", "Seamless remote work capabilities", "Enhanced security with Zero Trust", "50% reduction in connectivity costs", "Scalable infrastructure for future growth"]'::jsonb,
    '["/images/projects/network-1.jpg", "/images/projects/network-2.jpg", "/images/projects/network-3.jpg"]'::jsonb,
    '{"quote": "QuardCube Labs delivered a network infrastructure that supports our global operations seamlessly. The reliability and security have been exceptional.", "author": "Robert Kim", "position": "IT Director, Global Consulting Firm"}'::jsonb,
    'London, UK',
    '8 months',
    2023
),
(
    'Healthcare IT System Integration',
    'Regional Healthcare Provider',
    'Integrated various healthcare IT systems to create a unified platform for patient data management and analytics, improving care coordination and operational efficiency.',
    'Healthcare IT systems integration',
    '["HL7 FHIR", "Interoperability APIs", "Healthcare Data Warehouse", "HIPAA-Compliant Cloud", "Clinical Analytics", "Secure Messaging"]'::jsonb,
    'IT Products & Services',
    'completed',
    null,
    '/images/projects/healthcare-it.jpg',
    '2023-03-01',
    '2023-12-31',
    160000.00,
    8,
    true,
    6,
    'healthcare-it-integration',
    'The healthcare provider had multiple disconnected systems, making it difficult to access complete patient information and coordinate care effectively.',
    'We developed an integrated platform using HL7 FHIR standards, creating a unified view of patient data while ensuring HIPAA compliance and security.',
    '["Unified patient data across all systems", "Improved care coordination", "50% reduction in data retrieval time", "Enhanced clinical decision support", "Full HIPAA compliance maintained"]'::jsonb,
    '["/images/projects/healthcare-1.jpg", "/images/projects/healthcare-2.jpg", "/images/projects/healthcare-3.jpg"]'::jsonb,
    '{"quote": "The integrated system has revolutionized how we deliver patient care. Having all patient information in one place has improved our efficiency and patient outcomes.", "author": "Dr. Amanda Foster", "position": "Chief Medical Officer, Regional Healthcare Provider"}'::jsonb,
    'Florida, USA',
    '10 months',
    2023
)
ON CONFLICT (slug) DO NOTHING;
