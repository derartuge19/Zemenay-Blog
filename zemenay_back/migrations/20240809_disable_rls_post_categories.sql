-- Temporarily disable RLS on post_categories table
ALTER TABLE public.post_categories DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT relname, relrowsecurity 
FROM pg_class 
WHERE oid = 'public.post_categories'::regclass;
