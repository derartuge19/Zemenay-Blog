-- Create a function to get posts by status
CREATE OR REPLACE FUNCTION public.get_posts_by_status()
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
