-- Migration: Add 3 new services to QuardCube Labs
-- Services: Corporate AI Automation, Personalized AI Automations, CCTV Camera Installations
-- Run this in your Supabase SQL Editor

INSERT INTO services (
  title, 
  description, 
  short_description, 
  category, 
  status, 
  process,
  technologies,
  case_studies,
  image_url, 
  order_index,
  meta_title,
  meta_description,
  slug
) VALUES 

-- Service 7: Corporate AI Automation
(
  'Corporate AI Automation',
  'Our corporate AI automation services help businesses transform their operations with intelligent automation. From automating repetitive tasks to implementing AI-driven decision-making systems, we deliver solutions that reduce costs, improve accuracy, and free your team to focus on strategic work.',
  'Enterprise-grade AI automation solutions that streamline workflows and boost productivity.',
  'ai-automation',
  'active',
  '["Business process analysis and automation audit", "AI solution design and strategy", "Model development and integration", "Testing and deployment", "Monitoring, optimization, and scaling"]'::jsonb,
  '["OpenAI", "LangChain", "Robotic Process Automation", "Machine Learning", "Natural Language Processing", "Computer Vision"]'::jsonb,
  '[
    {
      "title": "Automated Invoice Processing",
      "client": "Logistics Company",
      "outcome": "80% reduction in manual data entry time"
    },
    {
      "title": "AI-Powered Customer Support",
      "client": "Telecom Provider",
      "outcome": "60% faster resolution time with AI chatbot"
    }
  ]'::jsonb,
  '/images/services/corporate-ai-automation.jpg',
  7,
  'Corporate AI Automation | QuardCube Labs',
  'Enterprise-grade AI automation services to streamline workflows, reduce costs, and boost productivity using OpenAI, LangChain, and RPA technologies.',
  'corporate-ai-automation'
),

-- Service 8: Personalized AI Automations
(
  'Personalized AI Automations',
  'We build personalized AI automation solutions designed specifically for your individual or small business needs. Whether it''s a custom chatbot, an intelligent virtual assistant, automated document processing, or AI-enhanced content creation, we create solutions that fit your exact workflow.',
  'Custom AI-powered automation tailored to your unique needs and workflows.',
  'ai-automation',
  'active',
  '["Needs assessment and use case discovery", "Custom AI model selection and design", "Prototype development and iteration", "Integration with existing tools and platforms", "Training, handoff, and ongoing support"]'::jsonb,
  '["ChatGPT API", "Custom AI Models", "Zapier Integration", "Voice Assistants", "Document AI", "Workflow Automation"]'::jsonb,
  '[
    {
      "title": "AI Writing Assistant",
      "client": "Content Agency",
      "outcome": "3x increase in content output with consistent quality"
    },
    {
      "title": "Smart Appointment Scheduler",
      "client": "Medical Practice",
      "outcome": "90% reduction in scheduling conflicts"
    }
  ]'::jsonb,
  '/images/services/personalized-ai-automation.jpg',
  8,
  'Personalized AI Automations | QuardCube Labs',
  'Custom AI-powered automation solutions tailored to your unique needs — chatbots, virtual assistants, document processing, and workflow automation.',
  'personalized-ai-automations'
),

-- Service 9: CCTV Camera Installations
(
  'CCTV Camera Installations',
  'We provide end-to-end CCTV camera installation services for homes, offices, and commercial properties. Our solutions include HD and IP cameras, night vision, motion detection, remote viewing via mobile app, and cloud storage — ensuring your premises are secure 24/7.',
  'Professional CCTV installation services with remote monitoring and HD surveillance.',
  'security',
  'active',
  '["Site survey and security assessment", "Camera placement planning and design", "Equipment procurement and installation", "Network setup and remote access configuration", "Testing, training, and maintenance support"]'::jsonb,
  '["IP Cameras", "HD/4K Surveillance", "Night Vision", "Motion Detection", "Cloud Storage", "Mobile Remote Viewing"]'::jsonb,
  '[
    {
      "title": "Office Security System",
      "client": "Corporate Office Complex",
      "outcome": "24/7 surveillance with zero blind spots across 3 floors"
    },
    {
      "title": "Retail Store Monitoring",
      "client": "Retail Chain",
      "outcome": "45% reduction in theft incidents"
    }
  ]'::jsonb,
  '/images/services/cctv-installations.jpg',
  9,
  'CCTV Camera Installations | QuardCube Labs',
  'Professional CCTV camera installation services for homes, offices, and commercial properties with HD surveillance, night vision, and remote mobile viewing.',
  'cctv-camera-installations'
);

-- Update features column for the new services
UPDATE services SET features = (
  COALESCE(process, '[]'::jsonb) || COALESCE(technologies, '[]'::jsonb)
) WHERE order_index IN (7, 8, 9) AND (features = '[]'::jsonb OR features IS NULL);

-- Verify the new services
SELECT id, title, category, status, order_index, slug FROM services ORDER BY order_index;
