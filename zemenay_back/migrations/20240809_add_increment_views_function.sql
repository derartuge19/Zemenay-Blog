-- Create or replace the increment_views function
CREATE OR REPLACE FUNCTION public.increment_views(post_id_param UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.posts 
    SET views = COALESCE(views, 0) + 1,
        updated_at = NOW()
    WHERE id = post_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
