-- Migration: Rename Cybersecurity Services to Graphic Design
-- Run this in your Supabase SQL Editor

UPDATE services SET
  title = 'Graphic Design',
  description = 'Our graphic design services bring your brand vision to life with stunning visuals. From logos and brand identities to marketing materials and digital assets, we create compelling designs that communicate your message and leave a lasting impression.',
  short_description = 'Creative graphic design solutions for branding, marketing, and digital assets.',
  category = 'design',
  image_url = '/images/services/graphic design.jpg',
  meta_title = 'Graphic Design | QuardCube Labs',
  meta_description = 'Professional graphic design services for branding, marketing materials, and digital assets that make your business stand out.',
  slug = 'graphic-design',
  updated_at = NOW()
WHERE slug = 'cybersecurity-services';

-- Verify the change
SELECT id, title, slug, image_url FROM services WHERE slug = 'graphic-design';
