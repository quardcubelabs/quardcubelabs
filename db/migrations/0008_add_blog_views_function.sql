-- Add function to increment blog views safely

CREATE OR REPLACE FUNCTION increment_blog_views(blog_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE blogs 
    SET view_count = view_count + 1 
    WHERE id = blog_id;
END;
$$ LANGUAGE plpgsql;
