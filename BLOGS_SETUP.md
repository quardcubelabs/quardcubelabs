# Blogs Database Setup

This guide explains how to set up the blogs table and populate it with existing blog data.

## Files Created

1. **`db/create_blogs_table.sql`** - Complete SQL script to create the blogs table and insert data
2. **`scripts/create-blogs-table.sh`** - Shell script helper (Linux/Mac)
3. **`scripts/create-blogs-table.bat`** - Batch script helper (Windows)

## Database Schema

The blogs table includes the following columns:

- `id` (UUID) - Primary key
- `title` (TEXT) - Blog post title
- `content` (TEXT) - Full blog content
- `excerpt` (TEXT) - Short description/summary
- `author` (TEXT) - Author name
- `category` (TEXT) - Blog category
- `tags` (TEXT[]) - Array of tags
- `status` (TEXT) - Publication status (draft, published, scheduled)
- `featured_image` (TEXT) - Featured image URL
- `images` (TEXT[]) - Additional images array
- `published_at` (TIMESTAMPTZ) - Publication date
- `scheduled_at` (TIMESTAMPTZ) - Scheduled publication date
- `reading_time` (INTEGER) - Estimated reading time in minutes
- `view_count` (INTEGER) - Number of views
- `featured` (BOOLEAN) - Whether the post is featured
- `allow_comments` (BOOLEAN) - Whether comments are allowed
- `meta_title` (TEXT) - SEO meta title
- `meta_description` (TEXT) - SEO meta description
- `meta_keywords` (TEXT) - SEO keywords
- `slug` (TEXT) - URL-friendly slug
- `created_at` (TIMESTAMPTZ) - Creation timestamp
- `updated_at` (TIMESTAMPTZ) - Last update timestamp

## Setup Instructions

### Option 1: Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor: `https://supabase.com/dashboard/project/YOUR_PROJECT/sql`
3. Copy the contents of `db/create_blogs_table.sql`
4. Paste into the SQL Editor
5. Click "Run" to execute

### Option 2: Command Line (psql)

```bash
# Make sure you have psql installed and configured
psql "$POSTGRES_URL" -f db/create_blogs_table.sql
```

### Option 3: Using Scripts

**Windows:**
```cmd
scripts\create-blogs-table.bat
```

**Linux/Mac:**
```bash
chmod +x scripts/create-blogs-table.sh
./scripts/create-blogs-table.sh
```

## Sample Data

The script includes 7 blog posts covering various topics:

1. **The Future of Cloud Computing in Africa** (Technology)
2. **Cybersecurity Best Practices for 2024** (Security)
3. **Digital Transformation in East Africa** (Business)
4. **The Rise of AI in Software Development** (Technology)
5. **Building Scalable Web Applications with Modern Frameworks** (Development)
6. **The Impact of 5G Technology on Business Innovation** (Innovation)
7. **Sustainable Technology Solutions for African Businesses** (Innovation)

## Features Included

- **Indexes** for better query performance
- **Triggers** for automatic `updated_at` timestamp updates
- **Views** for easy access to published blogs
- **Comments** and documentation
- **Sample data** with realistic content

## Blog Categories

- Technology
- Security
- Business
- Development
- Innovation

## Frontend Integration

The public blog page (`app/blog/page.tsx`) has been updated to:

- ✅ Fetch blogs from the database using `getBlogs()` action
- ✅ Display loading states and error handling
- ✅ Filter blogs by category
- ✅ Show proper formatting for dates and reading time
- ✅ Handle empty states gracefully

## Admin Integration

The admin blogs page (`app/admin/(protected)/blogs/page.tsx`) is already configured to work with the database structure.

## Next Steps

1. Run the SQL script to create the table
2. Verify the blogs appear in your admin dashboard
3. Check the public blog page to see the new database-driven content
4. Add more blog posts through the admin interface

## Troubleshooting

### Table Already Exists
If you get an error about the table already existing, the script includes `DROP TABLE IF EXISTS` to handle this.

### Permission Errors
Make sure your database user has the necessary permissions to create tables and insert data.

### Missing Images
The script references image paths like `/images/blog/cloud-computing.jpg`. Make sure to add these images to your public folder or update the paths in the database.

## Verification

After running the script, you can verify the setup with:

```sql
-- Check if blogs were inserted
SELECT COUNT(*) FROM blogs;

-- View blog categories and counts
SELECT category, COUNT(*) as count 
FROM blogs 
GROUP BY category 
ORDER BY count DESC;

-- Check published blogs
SELECT title, author, category, published_at 
FROM published_blogs 
LIMIT 5;
```
