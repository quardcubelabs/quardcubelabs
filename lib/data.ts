export const products = [
  {
    id: 1,
    name: "Enterprise Security Suite",
    category: "Security Products",
    price: 1299.99,
    image: "/placeholder.svg?height=300&width=300",
    description:
      "Comprehensive security solution for enterprise networks with advanced threat detection and prevention.",
    features: [
      "Advanced firewall protection",
      "Intrusion detection and prevention",
      "Malware and ransomware protection",
      "24/7 security monitoring",
      "Regular security updates",
    ],
    stock: 15,
    rating: 4.8,
  },
  {
    id: 2,
    name: "Smart Power Manager",
    category: "Power Solutions",
    price: 899.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Intelligent power management system for optimizing energy consumption in commercial buildings.",
    features: [
      "Real-time power monitoring",
      "Automated load balancing",
      "Energy usage analytics",
      "Remote management via mobile app",
      "Integration with smart building systems",
    ],
    stock: 8,
    rating: 4.6,
  },
  {
    id: 3,
    name: "Network Pro Router",
    category: "Connectivity & Networking",
    price: 349.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "High-performance router for business environments with advanced security features.",
    features: [
      "Gigabit Ethernet ports",
      "Dual-band WiFi 6 support",
      "VPN server capabilities",
      "Advanced QoS settings",
      "Guest network isolation",
    ],
    stock: 23,
    rating: 4.9,
  },
  {
    id: 4,
    name: "Cloud Backup Solution",
    category: "IT Products & Services",
    price: 199.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Secure cloud backup solution with automatic syncing and version control.",
    features: [
      "Automatic data backup",
      "End-to-end encryption",
      "Version history and recovery",
      "Cross-platform compatibility",
      "Scalable storage options",
    ],
    stock: 50,
    rating: 4.7,
  },
  {
    id: 5,
    name: "Business Analytics Dashboard",
    category: "Software Development",
    price: 1499.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Customizable analytics dashboard for visualizing business metrics and KPIs.",
    features: [
      "Real-time data visualization",
      "Customizable widgets and reports",
      "Data integration from multiple sources",
      "Export and sharing capabilities",
      "User role management",
    ],
    stock: 12,
    rating: 4.5,
  },
  {
    id: 6,
    name: "Smart Office Kit",
    category: "IT Products & Services",
    price: 2499.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Complete smart office solution including hardware and software for modern workplaces.",
    features: [
      "Smart lighting and climate control",
      "Meeting room booking system",
      "Visitor management system",
      "Employee access control",
      "Energy usage optimization",
    ],
    stock: 5,
    rating: 4.9,
  },
  {
    id: 7,
    name: "Data Center Cooling System",
    category: "Power Solutions",
    price: 3999.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Energy-efficient cooling solution designed specifically for data centers and server rooms.",
    features: [
      "Precision temperature control",
      "Humidity management",
      "Energy-efficient operation",
      "Remote monitoring capabilities",
      "Redundant cooling paths",
    ],
    stock: 3,
    rating: 4.8,
  },
  {
    id: 8,
    name: "Managed IT Service Package",
    category: "IT Products & Services",
    price: 599.99,
    image: "/placeholder.svg?height=300&width=300",
    description: "Monthly subscription for comprehensive IT management and support for small to medium businesses.",
    features: [
      "24/7 technical support",
      "Network monitoring and management",
      "Security patch management",
      "Backup and disaster recovery",
      "IT consulting and planning",
    ],
    stock: 100,
    rating: 4.7,
  },
]

export const services = [
  {
    id: 1,
    title: "Custom Software Development",
    category: "Software Development",
    image: "/placeholder.svg?height=600&width=800",
    shortDescription: "Tailored software solutions designed to meet your specific business requirements.",
    description:
      "Our expert development team creates custom software solutions that address your unique business challenges. From enterprise applications to specialized tools, we deliver high-quality, scalable software that drives efficiency and growth.",
    process: [
      "Requirements gathering and analysis",
      "Solution architecture and design",
      "Agile development and testing",
      "Deployment and integration",
      "Ongoing support and maintenance",
    ],
    technologies: ["React", "Node.js", "Python", "Java", "AWS", "Azure", ".NET", "MongoDB", "PostgreSQL"],
    caseStudies: [
      {
        title: "Enterprise Resource Planning System",
        client: "Manufacturing Company",
        outcome: "40% increase in operational efficiency",
      },
      {
        title: "Customer Relationship Management Tool",
        client: "Financial Services Provider",
        outcome: "65% improvement in customer retention",
      },
    ],
  },
  {
    id: 2,
    title: "Web Design & Development",
    category: "Web Designing",
    image: "/placeholder.svg?height=600&width=800",
    shortDescription: "Stunning, responsive websites with modern UI/UX that captivate your audience.",
    description:
      "We create visually appealing, user-friendly websites that represent your brand and engage your audience. Our web solutions are responsive, accessible, and optimized for performance across all devices and platforms.",
    process: [
      "Discovery and strategy planning",
      "Wireframing and prototyping",
      "Visual design and branding",
      "Frontend and backend development",
      "Testing, launch, and post-launch support",
    ],
    technologies: [
      "HTML5",
      "CSS3",
      "JavaScript",
      "React",
      "Next.js",
      "WordPress",
      "Shopify",
      "Tailwind CSS",
      "GraphQL",
    ],
    caseStudies: [
      {
        title: "E-commerce Platform Redesign",
        client: "Retail Chain",
        outcome: "35% increase in conversion rate",
      },
      {
        title: "Corporate Website Overhaul",
        client: "Legal Firm",
        outcome: "120% increase in lead generation",
      },
    ],
  },
  {
    id: 3,
    title: "Power Management Solutions",
    category: "Power Solutions",
    image: "/placeholder.svg?height=600&width=800",
    shortDescription: "Reliable power management systems to keep your infrastructure running efficiently.",
    description:
      "Our power management solutions help businesses optimize energy usage, reduce costs, and ensure uninterrupted operations. We provide comprehensive services from assessment to implementation and ongoing monitoring.",
    process: [
      "Energy audit and assessment",
      "Solution design and planning",
      "Equipment procurement and installation",
      "System integration and testing",
      "Monitoring and maintenance",
    ],
    technologies: [
      "Smart Grid Technology",
      "Energy Management Systems",
      "UPS Systems",
      "Power Distribution Units",
      "Renewable Energy Integration",
    ],
    caseStudies: [
      {
        title: "Smart Grid Power Management",
        client: "Commercial Building Complex",
        outcome: "25% reduction in power consumption",
      },
      {
        title: "Data Center Power Optimization",
        client: "Cloud Service Provider",
        outcome: "30% improvement in energy efficiency",
      },
    ],
  },
  {
    id: 4,
    title: "Cybersecurity Services",
    category: "Security Products",
    image: "/placeholder.svg?height=600&width=800",
    shortDescription: "Comprehensive security solutions to protect your digital assets from threats.",
    description:
      "Our cybersecurity services provide robust protection for your digital infrastructure, data, and applications. We implement multi-layered security strategies to defend against evolving threats and ensure business continuity.",
    process: [
      "Security assessment and vulnerability scanning",
      "Security architecture design",
      "Implementation of security controls",
      "Security monitoring and incident response",
      "Security awareness training",
    ],
    technologies: [
      "Firewall Systems",
      "Intrusion Detection",
      "Endpoint Protection",
      "Data Encryption",
      "Identity Management",
      "Security Information and Event Management (SIEM)",
    ],
    caseStudies: [
      {
        title: "Secure Banking Infrastructure",
        client: "Regional Bank",
        outcome: "Zero security breaches since implementation",
      },
      {
        title: "Healthcare Data Protection",
        client: "Medical Center",
        outcome: "Achieved HIPAA compliance with enhanced security",
      },
    ],
  },
  {
    id: 5,
    title: "Network Infrastructure",
    category: "Connectivity & Networking",
    image: "/placeholder.svg?height=600&width=800",
    shortDescription: "Robust networking solutions that ensure seamless connectivity across your organization.",
    description:
      "We design, implement, and manage network infrastructure that provides reliable, high-performance connectivity for your business. Our solutions scale with your needs and incorporate the latest technologies for optimal performance.",
    process: [
      "Network assessment and planning",
      "Architecture design",
      "Equipment selection and procurement",
      "Implementation and configuration",
      "Network monitoring and management",
    ],
    technologies: [
      "Cisco Systems",
      "SD-WAN",
      "Network Virtualization",
      "Cloud Networking",
      "Wireless Solutions",
      "VPN Technologies",
    ],
    caseStudies: [
      {
        title: "Corporate Network Infrastructure",
        client: "Multinational Corporation",
        outcome: "99.99% network uptime across 20+ locations",
      },
      {
        title: "Campus-wide WiFi Deployment",
        client: "University",
        outcome: "Seamless connectivity for 15,000+ simultaneous users",
      },
    ],
  },
  {
    id: 6,
    title: "IT Consulting & Support",
    category: "IT Products & Services",
    image: "/placeholder.svg?height=600&width=800",
    shortDescription: "Expert IT consulting and support services for your business technology needs.",
    description:
      "Our IT consulting and support services provide strategic guidance and technical expertise to help you leverage technology for business success. We offer proactive support, problem resolution, and strategic planning to optimize your IT investments.",
    process: [
      "IT assessment and discovery",
      "Strategic planning and roadmap development",
      "Solution recommendation and implementation",
      "Ongoing support and maintenance",
      "Regular review and optimization",
    ],
    technologies: [
      "Help Desk Systems",
      "Remote Monitoring",
      "IT Service Management",
      "Cloud Migration",
      "Digital Transformation",
    ],
    caseStudies: [
      {
        title: "IT Infrastructure Modernization",
        client: "Accounting Firm",
        outcome: "50% reduction in IT-related downtime",
      },
      {
        title: "Cloud Migration Strategy",
        client: "Insurance Company",
        outcome: "35% reduction in IT operational costs",
      },
    ],
  },
]

export const projects = [
  {
    id: 1,
    title: "Enterprise Resource Planning System",
    category: "Software Development",
    client: "Global Manufacturing Corporation",
    duration: "18 months",
    year: 2022,
    location: "Chicago, IL",
    description:
      "Developed and implemented a comprehensive ERP solution for a manufacturing company with operations in 12 countries. The system integrated production, inventory, sales, and financial data into a unified platform, providing real-time insights and streamlining operations.",
    challenge:
      "The client was struggling with siloed data across multiple legacy systems, leading to inefficiencies, data inconsistencies, and delayed decision-making. They needed a unified solution that could handle complex manufacturing processes while providing real-time visibility across the organization.",
    solution:
      "We designed a custom ERP system tailored to the client's specific manufacturing processes. The solution included modules for production planning, inventory management, supply chain, quality control, sales, and financial management. We implemented a phased approach to minimize disruption and ensure successful adoption.",
    results: [
      "40% increase in operational efficiency",
      "25% reduction in inventory costs",
      "60% faster reporting and analytics",
      "Seamless integration across 12 international locations",
      "ROI achieved within 14 months of full implementation",
    ],
    technologies: ["React", "Node.js", "MongoDB", "Docker", "Kubernetes", "Azure Cloud"],
    image: "/placeholder.svg?height=600&width=800",
    gallery: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    testimonial: {
      quote:
        "The ERP system developed by QuardCubeLabs has transformed our operations. We now have real-time visibility across our entire organization, enabling faster and more informed decision-making.",
      author: "Sarah Johnson",
      position: "CIO, Global Manufacturing Corporation",
    },
  },
  {
    id: 2,
    title: "E-commerce Platform Redesign",
    category: "Web Designing",
    client: "Luxury Retail Brand",
    duration: "6 months",
    year: 2023,
    location: "New York, NY",
    description:
      "Completely redesigned and rebuilt the e-commerce platform for a luxury retail brand, focusing on enhanced user experience, mobile responsiveness, and seamless checkout process. The new platform integrated with their inventory and CRM systems.",
    challenge:
      "The client's existing e-commerce site had an outdated design, poor mobile experience, and high cart abandonment rates. They needed a modern, responsive platform that reflected their luxury brand identity while providing a frictionless shopping experience.",
    solution:
      "We redesigned the entire user interface with a focus on brand storytelling, product visualization, and intuitive navigation. The new platform featured high-quality imagery, personalized recommendations, and a streamlined checkout process. We also implemented advanced analytics to track user behavior and optimize the conversion funnel.",
    results: [
      "35% increase in conversion rate",
      "50% reduction in cart abandonment",
      "120% increase in mobile sales",
      "28% increase in average order value",
      "Improved SEO rankings for key product categories",
    ],
    technologies: ["Next.js", "Tailwind CSS", "Shopify", "Algolia", "Contentful", "AWS"],
    image: "/placeholder.svg?height=600&width=800",
    gallery: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    testimonial: {
      quote:
        "The redesigned e-commerce platform perfectly captures our brand essence while delivering an exceptional shopping experience. The results have exceeded our expectations, with significant improvements in conversion rates and customer satisfaction.",
      author: "Michael Chen",
      position: "Marketing Director, Luxury Retail Brand",
    },
  },
  {
    id: 3,
    title: "Secure Banking Infrastructure",
    category: "Security Products",
    client: "Regional Banking Network",
    duration: "12 months",
    year: 2022,
    location: "Boston, MA",
    description:
      "Designed and implemented a comprehensive security infrastructure for a regional banking network with 50+ branches. The solution included advanced encryption, multi-factor authentication, and real-time threat monitoring.",
    challenge:
      "The client faced increasing cybersecurity threats and needed to strengthen their security posture while complying with stringent financial regulations. They required a solution that provided robust protection without impacting system performance or user experience.",
    solution:
      "We developed a multi-layered security architecture that included network segmentation, advanced firewall protection, encryption for data at rest and in transit, and a comprehensive identity and access management system. We also implemented a security operations center for 24/7 monitoring and incident response.",
    results: [
      "Zero security breaches since implementation",
      "100% compliance with banking regulations",
      "90% reduction in security incidents",
      "Streamlined authentication process for employees",
      "Enhanced customer trust through improved security measures",
    ],
    technologies: [
      "Cisco Security",
      "Palo Alto Networks",
      "Okta",
      "Splunk",
      "Encryption Technologies",
      "Biometric Authentication",
    ],
    image: "/placeholder.svg?height=600&width=800",
    gallery: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    testimonial: {
      quote:
        "QuardCubeLabs delivered a security solution that has given us peace of mind. Their expertise in financial security is evident in the comprehensive system they designed, which protects our data while maintaining operational efficiency.",
      author: "David Rodriguez",
      position: "CISO, Regional Banking Network",
    },
  },
  {
    id: 4,
    title: "Smart Grid Power Management",
    category: "Power Solutions",
    client: "Commercial Real Estate Developer",
    duration: "9 months",
    year: 2023,
    location: "San Francisco, CA",
    description:
      "Developed and implemented a smart grid power management system for a commercial building complex, integrating renewable energy sources, automated load balancing, and real-time monitoring to optimize energy usage.",
    challenge:
      "The client wanted to reduce energy costs and carbon footprint across their portfolio of commercial buildings while ensuring reliable power for critical systems. They needed a solution that could intelligently manage diverse power sources and respond to changing demand patterns.",
    solution:
      "We designed a smart grid system that integrated solar panels, battery storage, and traditional power sources with an intelligent management platform. The system uses AI algorithms to predict usage patterns, optimize load balancing, and automatically switch between power sources based on efficiency and cost considerations.",
    results: [
      "25% reduction in overall power consumption",
      "40% decrease in energy costs",
      "30% reduction in carbon emissions",
      "Real-time visibility into energy usage patterns",
      "Enhanced resilience against power outages",
    ],
    technologies: [
      "IoT Sensors",
      "Energy Management Systems",
      "Solar Integration",
      "Battery Storage",
      "AI/ML Algorithms",
      "Cloud Analytics",
    ],
    image: "/placeholder.svg?height=600&width=800",
    gallery: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    testimonial: {
      quote:
        "The smart grid solution has transformed how we manage energy across our properties. We've seen substantial cost savings while significantly reducing our environmental impact. The real-time monitoring capabilities have been invaluable for identifying further optimization opportunities.",
      author: "Jennifer Lee",
      position: "Sustainability Director, Commercial Real Estate Developer",
    },
  },
  {
    id: 5,
    title: "Corporate Network Infrastructure",
    category: "Connectivity & Networking",
    client: "Global Consulting Firm",
    duration: "8 months",
    year: 2022,
    location: "London, UK",
    description:
      "Designed and implemented a scalable network infrastructure for a multinational consulting firm with 20+ offices worldwide. The solution provided secure, high-performance connectivity while supporting remote work capabilities.",
    challenge:
      "The client's existing network was struggling to support their growing global operations and increasing reliance on cloud applications. They needed a solution that could provide consistent performance across all locations while supporting their hybrid work model.",
    solution:
      "We implemented a software-defined wide area network (SD-WAN) architecture that optimized traffic routing across their global offices. The solution included redundant internet connections, quality of service controls, and integrated security features. We also deployed a global VPN solution to support remote workers with secure access to corporate resources.",
    results: [
      "99.99% network uptime across all locations",
      "60% improvement in application performance",
      "Seamless support for 5,000+ remote workers",
      "Simplified network management through centralized controls",
      "Reduced network operating costs by 35%",
    ],
    technologies: [
      "Cisco SD-WAN",
      "Meraki",
      "Azure Virtual WAN",
      "Zero Trust Security",
      "Cloud Connectivity",
      "Global VPN",
    ],
    image: "/placeholder.svg?height=600&width=800",
    gallery: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    testimonial: {
      quote:
        "QuardCubeLabs delivered a network infrastructure that has transformed our global operations. The performance and reliability have been exceptional, and their solution has seamlessly adapted to our hybrid work environment.",
      author: "Robert Thompson",
      position: "Global IT Director, Global Consulting Firm",
    },
  },
  {
    id: 6,
    title: "Healthcare IT System Integration",
    category: "IT Products & Services",
    client: "Regional Healthcare Provider",
    duration: "15 months",
    year: 2023,
    location: "Dallas, TX",
    description:
      "Integrated various healthcare IT systems to create a unified platform for patient data management, clinical workflows, and analytics across a network of hospitals and clinics.",
    challenge:
      "The client operated multiple facilities with different legacy systems, creating data silos that hindered care coordination and administrative efficiency. They needed a unified solution that maintained compliance with healthcare regulations while improving data accessibility and clinical workflows.",
    solution:
      "We developed an integration platform that connected electronic health records, laboratory systems, radiology information systems, and administrative applications. The solution included data normalization, a master patient index, and role-based access controls to ensure appropriate data access while maintaining privacy and security.",
    results: [
      "Unified patient records across 12 facilities",
      "45% reduction in administrative data entry",
      "70% faster access to complete patient information",
      "Improved care coordination and reduced duplicate testing",
      "Full compliance with HIPAA and other healthcare regulations",
    ],
    technologies: [
      "HL7 FHIR",
      "Interoperability APIs",
      "Healthcare Data Warehouse",
      "HIPAA-Compliant Cloud",
      "Clinical Analytics",
      "Secure Messaging",
    ],
    image: "/placeholder.svg?height=600&width=800",
    gallery: [
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
      "/placeholder.svg?height=600&width=800",
    ],
    testimonial: {
      quote:
        "The integrated healthcare IT system has revolutionized how we deliver care. Our clinicians now have immediate access to complete patient information, enabling better decision-making and more coordinated care across our entire network.",
      author: "Dr. Emily Wilson",
      position: "Chief Medical Information Officer, Regional Healthcare Provider",
    },
  },
]

export const teamMembers = [
  {
    id: 1,
    name: "Eng. Furaha Mndeme",
    role: "Founder & CEO",
    image: "/placeholder.svg?height=400&width=400",
    bio: "Mndeme founded QuardCubeLabs in 2008 with a vision to transform how businesses leverage technology. With a Ph.D. in Computer Science and over 25 years of industry experience, he leads the company's strategic direction and innovation initiatives.",
    expertise: ["Strategic Leadership", "Technology Innovation", "Enterprise Architecture", "Digital Transformation"],
    education: "M.S. in Computer Engineering, MIT",
    socialMedia: {
      whatsapp: "https://wa.me/+255652540496",
      instagram: "https://instagram.com/framan_reubinstein",
      twitter: "https://twitter.com/framan007",
    },
  },
  {
    id: 2,
    name: "Fadhili Mndeme",
    role: "Chief Technology Officer",
    image: "/placeholder.svg?height=400&width=400",
    bio: "Fadhili oversees all technical aspects of the company, from software development to infrastructure solutions. Her background in both software engineering and systems architecture enables her to bridge complex technical concepts with practical business applications.",
    expertise: ["Software Architecture", "Cloud Computing", "AI & Machine Learning", "Cybersecurity"],
    education: "M.S. in Computer Engineering, Stanford University",
    socialMedia: {
      whatsapp: "https://wa.me/1234567891",
      instagram: "https://instagram.com/sarahchen",
      twitter: "https://twitter.com/sarahchen",
    },
  },
  {
    id: 3,
    name: "Dr. Hossiana Walter",
    role: "Operations Manager",
    image: "/hosie.jpeg",
    bio: "Hossiana leads our security practice, ensuring that all solutions meet the highest standards of security and compliance. With a background in cybersecurity and risk management, he has helped numerous organizations protect their critical assets from evolving threats.",
    expertise: ["Cybersecurity Strategy", "Risk Management", "Compliance", "Security Architecture"],
    education: "M.S. in Information Security, Carnegie Mellon University",
    socialMedia: {
      whatsapp: "https://wa.me/+255679933463",
      instagram: "https://instagram.com/hossianawalter",
      twitter: "https://twitter.com/hossianawalter",
    },
  },
]

export const companyHistory = [
  {
    year: 2008,
    title: "Foundation",
    description:
      "QuardCubeLabs was founded by Dr. James Wilson with a vision to provide innovative technology solutions for businesses of all sizes.",
  },
  {
    year: 2010,
    title: "First Major Client",
    description:
      "Secured our first enterprise client, a regional bank that needed a comprehensive security infrastructure overhaul.",
  },
  {
    year: 2012,
    title: "Expansion of Services",
    description:
      "Expanded our service offerings to include software development and web design, broadening our ability to serve clients' diverse needs.",
  },
  {
    year: 2014,
    title: "New Headquarters",
    description:
      "Moved to our current headquarters, a state-of-the-art facility designed to foster collaboration and innovation.",
  },
  {
    year: 2016,
    title: "International Expansion",
    description: "Opened our first international office in London, UK, extending our reach to European markets.",
  },
  {
    year: 2018,
    title: "Technology Innovation Award",
    description:
      "Received the prestigious Technology Innovation Award for our work in developing secure, scalable enterprise solutions.",
  },
  {
    year: 2020,
    title: "Remote Work Solutions",
    description:
      "Developed specialized solutions to help businesses transition to remote work environments during the global pandemic.",
  },
  {
    year: 2022,
    title: "AI & Machine Learning Practice",
    description:
      "Established a dedicated AI and Machine Learning practice to help clients leverage these transformative technologies.",
  },
  {
    year: 2023,
    title: "Sustainability Initiative",
    description:
      "Launched our sustainability initiative, focusing on developing technology solutions that reduce environmental impact.",
  },
]

export const faqs = [
  {
    question: "What industries does QuardCubeLabs serve?",
    answer:
      "We serve a wide range of industries including finance, healthcare, manufacturing, retail, education, and professional services. Our solutions are adaptable to the specific needs and regulatory requirements of each industry.",
  },
  {
    question: "How does your software development process work?",
    answer:
      "Our software development process follows an agile methodology, with regular client touchpoints and iterative development cycles. We begin with a thorough discovery phase to understand your requirements, followed by design, development, testing, and deployment phases. Throughout the process, we maintain transparent communication and adapt to changing needs.",
  },
  {
    question: "What security certifications does QuardCubeLabs hold?",
    answer:
      "QuardCubeLabs maintains several industry-standard security certifications including ISO 27001, SOC 2 Type II, and PCI DSS. Our security professionals also hold individual certifications such as CISSP, CEH, and CISM. We regularly undergo third-party security audits to ensure our practices meet the highest standards.",
  },
  {
    question: "Can you work with our existing IT infrastructure?",
    answer:
      "Yes, we specialize in integrating with existing IT infrastructures. Our solutions are designed to complement and enhance your current systems, minimizing disruption while maximizing value. We conduct thorough assessments of your existing environment before recommending integration approaches.",
  },
  {
    question: "What support options do you offer after project completion?",
    answer:
      "We offer various support options including 24/7 technical support, scheduled maintenance, regular updates, and ongoing optimization. Our support packages can be tailored to your specific needs, whether you require basic assistance or comprehensive managed services. We also provide training for your team to ensure they can effectively use the implemented solutions.",
  },
  {
    question: "How do you handle data privacy and compliance?",
    answer:
      "We take data privacy and compliance very seriously. Our solutions are designed with privacy by design principles and comply with relevant regulations such as GDPR, HIPAA, and CCPA. We implement robust data protection measures, maintain detailed documentation, and provide transparency about data handling practices. Our team stays current with evolving regulations to ensure ongoing compliance.",
  },
  {
    question: "What is your approach to project management?",
    answer:
      "Our project management approach combines agile methodologies with clear communication and accountability. Each project is assigned a dedicated project manager who serves as your primary point of contact. We use collaborative tools for transparency, conduct regular status meetings, and provide detailed progress reports. Our goal is to deliver projects on time, within budget, and to your complete satisfaction.",
  },
  {
    question: "Can you scale solutions as our business grows?",
    answer:
      "Absolutely. Scalability is a core consideration in all our solutions. We design systems with future growth in mind, using modular architectures and scalable technologies. Our cloud-based solutions can easily adapt to increasing demands, and our on-premises implementations include capacity planning for future expansion. We also provide roadmap planning to help you anticipate and prepare for technology needs as your business evolves.",
  },
]

export const categories = [
  "All",
  "Software Development",
  "Web Designing",
  "Security Products",
  "Power Solutions",
  "Connectivity & Networking",
  "IT Products & Services",
]

export const cartItems = []
