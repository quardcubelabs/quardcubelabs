-- Migration: Update projects to new QuardCube Labs portfolio
-- Run this in your Supabase SQL Editor

-- First, delete all existing projects
DELETE FROM projects;

-- Insert the 6 new projects
INSERT INTO projects (title, client, description, short_description, technologies, category, status, image_url, start_date, end_date, featured, order_index, slug) VALUES

-- 01. Jarvis AI Assistant
(
  'Jarvis AI Assistant',
  'QuardCube Labs',
  'An intelligent AI-powered virtual assistant that handles natural language conversations, task automation, and smart home control. Jarvis uses advanced NLP models to understand context, execute commands, and provide personalized responses through voice and text interfaces.',
  'AI-powered virtual assistant with voice and text interfaces for task automation and smart control.',
  '["Python", "OpenAI", "NLP", "Voice Recognition", "TensorFlow", "WebSockets"]',
  'Software Development',
  'completed',
  '/images/projects/jarvis-ai.jpg',
  '2024-01-15',
  '2024-08-30',
  true,
  1,
  'jarvis-ai-assistant'
),

-- 02. Car Wash App
(
  'Car Wash App',
  'QuardCube Labs',
  'A mobile application that lets users request on-demand car wash services at their location. Features real-time service provider tracking, scheduling, multiple wash packages, secure payments, and ratings system for quality assurance.',
  'On-demand car wash service app with real-time tracking and scheduling.',
  '["React Native", "Node.js", "Google Maps API", "Stripe", "Firebase", "Push Notifications"]',
  'Software Development',
  'completed',
  '/images/projects/car-wash-app.jpg',
  '2024-03-01',
  '2024-09-30',
  true,
  2,
  'car-wash-app'
),

-- 03. ShopGram
(
  'ShopGram',
  'QuardCube Labs',
  'An e-commerce mobile app with an Instagram-style interface where users discover, share, and purchase products through a visually engaging social feed. Features include stories, reels for product showcases, influencer storefronts, and seamless checkout.',
  'Instagram-style e-commerce mobile app for social shopping.',
  '["React Native", "Firebase", "Node.js", "Stripe", "Algolia Search", "Cloud Storage"]',
  'Software Development',
  'completed',
  '/images/projects/shopgram.jpg',
  '2024-02-01',
  '2024-10-31',
  true,
  3,
  'shopgram'
),

-- 04. CHMS - Church Management System
(
  'CHMS - Church Management System',
  'QuardCube Labs',
  'A comprehensive church management system for member registration, attendance tracking, event scheduling, tithe and offering management, small group coordination, and multi-channel communication with congregants.',
  'Complete church management system for members, attendance, tithes, and events.',
  '["Next.js", "PostgreSQL", "Tailwind CSS", "Auth.js", "SMS API", "Report Generation"]',
  'Software Development',
  'completed',
  '/images/projects/chms.jpg',
  '2024-04-01',
  '2024-11-30',
  true,
  4,
  'chms-church-management-system'
),

-- 05. Loan Management System
(
  'Loan Management System',
  'QuardCube Labs',
  'A complete loan management platform for processing applications, tracking repayments, calculating interest with multiple schemes, managing collateral, generating financial reports, and automated payment reminders.',
  'Loan processing platform with repayment tracking and financial reporting.',
  '["React", "Node.js", "PostgreSQL", "Finance API", "PDF Generation", "SMS Notifications"]',
  'Software Development',
  'completed',
  '/images/projects/loan-management.jpg',
  '2024-05-01',
  '2024-12-31',
  true,
  5,
  'loan-management-system'
),

-- 06. Finance Tracker App
(
  'Finance Tracker App',
  'QuardCube Labs',
  'A personal finance tracking application for managing budgets, categorizing expenses, setting savings goals, and visualizing spending patterns with interactive charts and AI-powered financial insights.',
  'Personal finance app for budgets, expenses, savings goals, and spending insights.',
  '["React Native", "Node.js", "Charts.js", "Analytics", "Plaid API", "Machine Learning"]',
  'Software Development',
  'completed',
  '/images/projects/finance-tracker.jpg',
  '2024-06-01',
  '2025-01-31',
  true,
  6,
  'finance-tracker-app'
);

-- Verify the migration
SELECT id, title, slug, order_index FROM projects ORDER BY order_index;
