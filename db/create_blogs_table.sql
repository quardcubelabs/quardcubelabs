-- Create blogs table
-- This script creates the blogs table and populates it with existing blog data

-- Drop the table if it exists (be careful in production)
DROP TABLE IF EXISTS blogs CASCADE;

-- Create the blogs table
CREATE TABLE blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    content TEXT,
    excerpt TEXT,
    author TEXT NOT NULL,
    category TEXT NOT NULL,
    tags TEXT[] DEFAULT '{}',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'scheduled')) DEFAULT 'published',
    featured_image TEXT,
    images TEXT[] DEFAULT '{}',
    published_at TIMESTAMPTZ,
    scheduled_at TIMESTAMPTZ,
    reading_time INTEGER NOT NULL DEFAULT 5,
    view_count INTEGER NOT NULL DEFAULT 0,
    featured BOOLEAN NOT NULL DEFAULT false,
    allow_comments BOOLEAN NOT NULL DEFAULT true,
    meta_title TEXT,
    meta_description TEXT,
    meta_keywords TEXT,
    slug TEXT UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_category ON blogs(category);
CREATE INDEX IF NOT EXISTS idx_blogs_published_at ON blogs(published_at);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_created_at ON blogs(created_at);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at
    BEFORE UPDATE ON blogs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert existing blog data from the public page
INSERT INTO blogs (
    title,
    content,
    excerpt,
    author,
    category,
    tags,
    status,
    featured_image,
    published_at,
    reading_time,
    view_count,
    featured,
    allow_comments,
    meta_title,
    meta_description,
    meta_keywords,
    slug
) VALUES 
(
    'The Future of Cloud Computing in Africa',
    'Exploring the growing adoption of cloud technologies and their impact on African businesses. Cloud computing has emerged as a transformative force across Africa, revolutionizing how businesses operate and scale. From small startups to large enterprises, organizations are increasingly leveraging cloud solutions to enhance their operations, reduce costs, and improve accessibility.

The African cloud computing market has experienced remarkable growth, driven by improved internet infrastructure, increasing mobile penetration, and a growing tech-savvy population. This shift represents more than just technological advancement; it''s a catalyst for economic development and innovation across the continent.

Key benefits driving adoption include cost efficiency, as businesses can avoid significant upfront infrastructure investments, and scalability, allowing companies to grow without worrying about technical limitations. The accessibility factor is particularly crucial in Africa, where cloud solutions enable businesses in remote areas to access enterprise-level tools and services.

Major challenges remain, including concerns about data sovereignty, internet connectivity in rural areas, and the need for local data centers. However, initiatives by major cloud providers to establish local presence and governments working to improve digital infrastructure are addressing these issues.

The future looks promising, with predictions of continued exponential growth in cloud adoption. This transformation is positioning Africa as a significant player in the global digital economy, fostering innovation and creating new opportunities for businesses across all sectors.',
    'Exploring the growing adoption of cloud technologies and their impact on African businesses.',
    'Sarah Chen',
    'Technology',
    ARRAY['cloud computing', 'africa', 'technology', 'business transformation', 'digital infrastructure'],
    'published',
    '/images/blog/cloud-computing.jpg',
    '2024-03-15T10:00:00Z',
    5,
    1250,
    true,
    true,
    'The Future of Cloud Computing in Africa - QuardCube Labs',
    'Discover how cloud computing is transforming African businesses and driving digital innovation across the continent.',
    'cloud computing africa, african technology, business transformation, digital infrastructure, cloud adoption',
    'future-cloud-computing-africa'
),
(
    'Cybersecurity Best Practices for 2024',
    'Essential security measures every business should implement to protect their digital assets. As we navigate through 2024, the cybersecurity landscape continues to evolve at an unprecedented pace. Organizations face increasingly sophisticated threats that require comprehensive and proactive security strategies.

The modern threat landscape includes advanced persistent threats (APTs), ransomware attacks, social engineering, and AI-powered cyberattacks. These threats target not just large corporations but businesses of all sizes, making cybersecurity a critical concern for every organization.

Essential practices for 2024 include implementing zero-trust architecture, which assumes no inherent trust and verifies every transaction. Multi-factor authentication (MFA) has become non-negotiable, providing an additional layer of security beyond passwords. Regular security training for employees is crucial, as human error remains one of the largest security vulnerabilities.

Data encryption, both at rest and in transit, protects sensitive information even if systems are compromised. Regular security audits and penetration testing help identify vulnerabilities before attackers can exploit them. Incident response planning ensures organizations can quickly respond to and recover from security breaches.

Cloud security considerations are particularly important as more businesses migrate to cloud platforms. This includes understanding shared responsibility models, implementing proper access controls, and ensuring compliance with relevant regulations.

Emerging technologies like AI and machine learning are being leveraged both by attackers and defenders. Organizations must stay informed about these developments and adapt their security strategies accordingly.',
    'Essential security measures every business should implement to protect their digital assets.',
    'Michael Ochieng',
    'Security',
    ARRAY['cybersecurity', 'security best practices', 'data protection', 'threat prevention', 'business security'],
    'published',
    '/images/blog/cybersecurity.jpg',
    '2024-03-10T14:30:00Z',
    7,
    980,
    true,
    true,
    'Cybersecurity Best Practices for 2024 - QuardCube Labs',
    'Learn essential cybersecurity measures and best practices to protect your business from modern digital threats.',
    'cybersecurity 2024, security best practices, data protection, cyber threats, business security',
    'cybersecurity-best-practices-2024'
),
(
    'Digital Transformation in East Africa',
    'How businesses in East Africa are leveraging technology to drive growth and innovation. East Africa has emerged as a beacon of digital innovation, with countries like Kenya, Uganda, Tanzania, and Rwanda leading the charge in technological advancement and digital adoption.

The region''s digital transformation journey has been remarkable, driven by mobile technology adoption, fintech innovations, and supportive government policies. Mobile money services like M-Pesa have revolutionized financial inclusion, enabling millions of previously unbanked individuals to access financial services.

Key sectors experiencing transformation include agriculture, where farmers use mobile apps for weather forecasting, market prices, and agricultural advice. Healthcare has seen the introduction of telemedicine platforms and mobile health applications that improve access to medical services in remote areas.

Education technology has flourished, with e-learning platforms making quality education more accessible. The COVID-19 pandemic accelerated this adoption, proving the resilience and adaptability of digital education solutions.

Fintech continues to be a major driver, with innovations in digital lending, insurance products, and payment solutions. These services have not only improved financial inclusion but also enabled new business models and economic opportunities.

Government initiatives have played a crucial role, with digital ID systems, e-government services, and smart city projects. These initiatives improve service delivery and create an enabling environment for digital businesses.

Challenges remain, including infrastructure gaps, digital literacy, and regulatory frameworks. However, the momentum is strong, with increasing investment in fiber optic networks, data centers, and technology education programs.

The future looks bright for East Africa''s digital economy, with the region positioning itself as a technology hub for the broader African continent.',
    'How businesses in East Africa are leveraging technology to drive growth and innovation.',
    'Aisha Patel',
    'Business',
    ARRAY['digital transformation', 'east africa', 'innovation', 'business growth', 'technology adoption'],
    'published',
    '/images/blog/digital-transformation.jpg',
    '2024-03-05T09:15:00Z',
    6,
    1150,
    false,
    true,
    'Digital Transformation in East Africa - QuardCube Labs',
    'Explore how East African businesses are driving growth through digital transformation and technology adoption.',
    'digital transformation east africa, african innovation, business technology, digital economy',
    'digital-transformation-east-africa'
),
(
    'The Rise of AI in Software Development',
    'How artificial intelligence is revolutionizing the way we build and deploy software. Artificial Intelligence has moved from the realm of science fiction to become an integral part of modern software development. AI-powered tools and techniques are transforming every aspect of the software development lifecycle.

Code generation and completion tools like GitHub Copilot and similar AI assistants are helping developers write code faster and more efficiently. These tools can suggest entire functions, debug code, and even explain complex algorithms, significantly boosting developer productivity.

Automated testing has been revolutionized by AI, with intelligent test generation, predictive testing, and autonomous bug detection. AI can analyze code changes and predict which areas are most likely to contain bugs, allowing for more targeted testing efforts.

Project management and planning benefit from AI through predictive analytics that help estimate project timelines, identify potential bottlenecks, and optimize resource allocation. Machine learning algorithms can analyze historical project data to provide more accurate estimates and recommendations.

Quality assurance has been enhanced with AI-powered code review tools that can identify potential security vulnerabilities, performance issues, and coding standard violations. These tools learn from vast codebases to provide increasingly sophisticated analysis.

DevOps and deployment processes are being automated with AI-driven continuous integration and deployment pipelines. Intelligent monitoring systems can predict system failures, automatically scale resources, and optimize performance.

However, this AI revolution also brings challenges. Developers need to understand AI capabilities and limitations, ensure ethical AI use, and maintain code quality standards. There''s also the question of how AI will change the role of developers and what new skills will be needed.

The future of software development with AI looks promising, with increasing automation of routine tasks allowing developers to focus on more creative and strategic work.',
    'How artificial intelligence is revolutionizing the way we build and deploy software.',
    'Dr. James Wilson',
    'Technology',
    ARRAY['artificial intelligence', 'software development', 'ai tools', 'automation', 'developer productivity'],
    'published',
    '/images/blog/ai-development.jpg',
    '2024-02-28T16:45:00Z',
    8,
    1450,
    true,
    true,
    'The Rise of AI in Software Development - QuardCube Labs',
    'Discover how artificial intelligence is transforming software development practices and boosting developer productivity.',
    'AI software development, artificial intelligence programming, developer tools, automation, AI coding',
    'ai-software-development-rise'
);

-- Insert additional blog posts to expand the content
INSERT INTO blogs (
    title,
    content,
    excerpt,
    author,
    category,
    tags,
    status,
    featured_image,
    published_at,
    reading_time,
    view_count,
    featured,
    allow_comments,
    meta_title,
    meta_description,
    meta_keywords,
    slug
) VALUES 
(
    'Building Scalable Web Applications with Modern Frameworks',
    'A comprehensive guide to creating high-performance, scalable web applications using the latest frameworks and best practices. Modern web development has evolved significantly, with new frameworks and tools emerging to address the growing complexity of web applications.

Scalability is no longer just about handling more users; it''s about maintaining performance, ensuring code maintainability, and providing excellent user experiences across different devices and network conditions. This requires careful consideration of architecture, technology choices, and development practices.

Framework selection plays a crucial role in scalability. React, Vue.js, and Angular each offer different approaches to building scalable applications. The choice depends on factors like team expertise, project requirements, and long-term maintenance considerations.

Server-side rendering (SSR) and static site generation (SSG) have become essential techniques for improving performance and SEO. Tools like Next.js, Nuxt.js, and Gatsby provide excellent solutions for implementing these approaches.

Database design and optimization are critical for scalability. This includes proper indexing, query optimization, database sharding, and choosing between SQL and NoSQL solutions based on data requirements.

Caching strategies, from browser caching to CDN implementation and database caching, significantly impact application performance. Understanding when and how to implement different caching layers is essential for scalable applications.

Microservices architecture allows for independent scaling of different application components. However, it also introduces complexity in terms of service communication, data consistency, and deployment management.',
    'A comprehensive guide to creating high-performance, scalable web applications using the latest frameworks and best practices.',
    'Sarah Chen',
    'Development',
    ARRAY['web development', 'scalability', 'frameworks', 'performance', 'architecture'],
    'published',
    '/images/blog/scalable-web-apps.jpg',
    '2024-02-20T11:30:00Z',
    10,
    890,
    false,
    true,
    'Building Scalable Web Applications - QuardCube Labs',
    'Learn how to build high-performance, scalable web applications using modern frameworks and best practices.',
    'scalable web applications, web development, modern frameworks, performance optimization',
    'building-scalable-web-applications'
),
(
    'The Impact of 5G Technology on Business Innovation',
    'Exploring how 5G networks are enabling new business models and transforming industries across Africa and beyond. The rollout of 5G technology represents one of the most significant technological advances of our time, promising to revolutionize how businesses operate and innovate.

5G offers unprecedented speed, ultra-low latency, and massive device connectivity that opens up possibilities previously considered impossible. For businesses, this means new opportunities for automation, real-time data processing, and enhanced customer experiences.

In manufacturing, 5G enables Industry 4.0 applications like real-time monitoring of production lines, predictive maintenance, and autonomous robots. The low latency allows for precise control of machinery and immediate response to system changes.

Healthcare applications include remote surgery, real-time patient monitoring, and advanced telemedicine capabilities. The reliable, high-speed connections enable doctors to provide care from a distance with the same precision as in-person treatment.

Smart cities benefit from 5G through improved traffic management, environmental monitoring, and public safety systems. The ability to connect thousands of sensors and devices enables comprehensive city-wide optimization.

For African businesses, 5G represents an opportunity to leapfrog traditional infrastructure limitations. Countries can build modern, efficient networks that support advanced applications without the burden of legacy systems.

However, challenges exist, including infrastructure costs, spectrum allocation, and the need for new skills and capabilities. Successful 5G adoption requires collaboration between telecommunications providers, governments, and businesses.',
    'Exploring how 5G networks are enabling new business models and transforming industries across Africa and beyond.',
    'Michael Ochieng',
    'Innovation',
    ARRAY['5g technology', 'business innovation', 'telecommunications', 'industry transformation', 'africa technology'],
    'published',
    '/images/blog/5g-business-innovation.jpg',
    '2024-02-15T13:20:00Z',
    7,
    650,
    false,
    true,
    '5G Technology Impact on Business Innovation - QuardCube Labs',
    'Discover how 5G networks are transforming businesses and enabling new innovation opportunities across industries.',
    '5g business innovation, telecommunications africa, network technology, industry transformation',
    '5g-technology-business-innovation'
),
(
    'Sustainable Technology Solutions for African Businesses',
    'How businesses can leverage green technology and sustainable practices to drive growth while protecting the environment. Sustainability has become a critical business imperative, with companies recognizing that environmental responsibility and profitability can go hand in hand.

African businesses have a unique opportunity to build sustainable practices from the ground up, avoiding the environmental mistakes of industrialized nations while still achieving economic growth. This approach, known as "leapfrogging," can provide competitive advantages in global markets.

Renewable energy solutions, particularly solar power, are becoming increasingly cost-effective in Africa. Businesses can reduce operational costs while minimizing their carbon footprint through solar installations, energy-efficient systems, and smart grid technologies.

Sustainable software development practices include optimizing code for energy efficiency, choosing green hosting providers, and implementing efficient algorithms that reduce computational requirements. These practices can significantly reduce the environmental impact of digital services.

Circular economy principles apply to technology through practices like equipment refurbishment, responsible e-waste management, and designing products for longevity and repairability. These approaches can create new business opportunities while reducing environmental impact.

Green fintech solutions are emerging to support sustainable business practices, including carbon tracking applications, green investment platforms, and sustainability reporting tools. These technologies help businesses measure and improve their environmental performance.

Consumer demand for sustainable products and services is growing, creating market opportunities for businesses that prioritize environmental responsibility. This trend is particularly strong among younger consumers who are willing to pay premium prices for sustainable options.',
    'How businesses can leverage green technology and sustainable practices to drive growth while protecting the environment.',
    'Aisha Patel',
    'Innovation',
    ARRAY['sustainable technology', 'green business', 'environmental responsibility', 'renewable energy', 'circular economy'],
    'published',
    '/images/blog/sustainable-technology.jpg',
    '2024-02-10T08:45:00Z',
    6,
    720,
    false,
    true,
    'Sustainable Technology Solutions for African Businesses - QuardCube Labs',
    'Learn how African businesses can implement sustainable technology solutions for growth and environmental protection.',
    'sustainable technology africa, green business solutions, environmental technology, renewable energy business',
    'sustainable-technology-african-businesses'
);

-- Create a view for published blogs with additional computed fields
CREATE OR REPLACE VIEW published_blogs AS
SELECT 
    *,
    EXTRACT(EPOCH FROM (NOW() - published_at))/86400 AS days_since_published,
    CASE 
        WHEN view_count > 1000 THEN 'High'
        WHEN view_count > 500 THEN 'Medium'
        ELSE 'Low'
    END AS popularity_level
FROM blogs 
WHERE status = 'published'
ORDER BY featured DESC, published_at DESC;

-- Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE, DELETE ON blogs TO your_app_role;
-- GRANT SELECT ON published_blogs TO your_app_role;

-- Display summary of inserted data
SELECT 
    category,
    COUNT(*) as blog_count,
    AVG(reading_time) as avg_reading_time,
    SUM(view_count) as total_views
FROM blogs 
GROUP BY category
ORDER BY blog_count DESC;

COMMENT ON TABLE blogs IS 'Stores blog posts and articles for the website';
COMMENT ON COLUMN blogs.slug IS 'SEO-friendly URL slug for the blog post';
COMMENT ON COLUMN blogs.reading_time IS 'Estimated reading time in minutes';
COMMENT ON COLUMN blogs.view_count IS 'Number of times the blog post has been viewed';
COMMENT ON COLUMN blogs.featured IS 'Whether this blog post should be featured prominently';
COMMENT ON COLUMN blogs.tags IS 'Array of tags associated with the blog post';
COMMENT ON COLUMN blogs.status IS 'Publication status: draft, published, or scheduled';
