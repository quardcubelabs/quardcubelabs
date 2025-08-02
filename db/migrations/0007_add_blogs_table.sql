-- Create blogs table for content management

CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  content TEXT,
  excerpt TEXT,
  author VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  tags JSONB DEFAULT '[]',
  status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'scheduled')),
  featured_image TEXT,
  images JSONB DEFAULT '[]',
  published_at TIMESTAMP WITH TIME ZONE,
  scheduled_at TIMESTAMP WITH TIME ZONE,
  reading_time INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT false,
  allow_comments BOOLEAN DEFAULT true,
  meta_title VARCHAR(255),
  meta_description TEXT,
  meta_keywords TEXT,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);

-- Create trigger for updated_at
CREATE TRIGGER update_blogs_updated_at 
    BEFORE UPDATE ON blogs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample blog posts
INSERT INTO blogs (title, content, excerpt, author, category, tags, status, featured_image, published_at, reading_time, view_count, featured, slug) VALUES
('The Future of Web Development in 2024', 'Web development continues to evolve at a rapid pace. In 2024, we''re seeing exciting trends that are reshaping how we build and deploy applications...', 'Explore the latest trends and technologies shaping web development in 2024.', 'John Smith', 'technology', '["web development", "trends", "2024", "javascript", "react"]', 'published', '/blog-1.jpg', '2024-01-15 10:00:00+00', 8, 1250, true, 'future-of-web-development-2024'),
('Building Scalable Mobile Apps with React Native', 'React Native has become a popular choice for cross-platform mobile development. In this comprehensive guide, we''ll explore best practices for building scalable mobile applications...', 'Learn how to build performant and scalable mobile apps using React Native.', 'Sarah Johnson', 'mobile', '["react native", "mobile development", "scalability", "performance"]', 'published', '/blog-2.jpg', '2024-02-20 14:30:00+00', 12, 980, true, 'building-scalable-mobile-apps-react-native'),
('UI/UX Design Principles for Better User Experience', 'Great user experience starts with thoughtful design. In this article, we''ll dive into fundamental UI/UX principles that every designer should know...', 'Essential UI/UX design principles to create exceptional user experiences.', 'Emily Chen', 'design', '["ui design", "ux design", "user experience", "design principles"]', 'published', '/blog-3.jpg', '2024-03-10 09:15:00+00', 10, 765, false, 'ui-ux-design-principles-better-user-experience'),
('Getting Started with TypeScript: A Developer''s Guide', 'TypeScript has gained massive adoption in the JavaScript ecosystem. This beginner-friendly guide will help you understand why TypeScript matters and how to get started...', 'A comprehensive introduction to TypeScript for JavaScript developers.', 'Michael Rodriguez', 'programming', '["typescript", "javascript", "programming", "beginner guide"]', 'published', '/blog-4.jpg', '2024-04-05 16:45:00+00', 15, 1100, false, 'getting-started-typescript-developers-guide'),
('The Rise of AI in Software Development', 'Artificial Intelligence is transforming the software development landscape. From code generation to automated testing, AI tools are becoming essential for modern developers...', 'How AI is revolutionizing software development and what it means for developers.', 'David Kim', 'ai', '["artificial intelligence", "software development", "automation", "future"]', 'draft', '/blog-5.jpg', null, 6, 0, false, 'rise-of-ai-software-development');
