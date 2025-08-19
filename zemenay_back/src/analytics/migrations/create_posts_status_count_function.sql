-- Create a function to get post status counts
CREATE OR REPLACE FUNCTION public.get_posts_status_count()
RETURNS TABLE (
  status text,
  count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    status::text,
    COUNT(*) as count
  FROM 
    posts
  GROUP BY 
    status;
$$;
