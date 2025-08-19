-- First, enable RLS on the post_categories table if not already enabled
ALTER TABLE public.post_categories ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.post_categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.post_categories;
DROP POLICY IF EXISTS "Enable update for post authors and admins" ON public.post_categories;
DROP POLICY IF EXISTS "Enable delete for post authors and admins" ON public.post_categories;

-- Allow all users to read post-category relationships
CREATE POLICY "Enable read access for all users"
ON public.post_categories
FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create post-category relationships
-- when they are the author of the post
CREATE POLICY "Enable insert for authenticated users"
ON public.post_categories
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_id
    AND (author_id = auth.uid() OR auth.role() = 'service_role')
  )
);

-- Allow post authors and admins to update relationships
CREATE POLICY "Enable update for post authors and admins"
ON public.post_categories
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_id
    AND (author_id = auth.uid() OR auth.role() = 'service_role')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_id
    AND (author_id = auth.uid() OR auth.role() = 'service_role')
  )
);

-- Allow post authors and admins to delete relationships
CREATE POLICY "Enable delete for post authors and admins"
ON public.post_categories
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.posts
    WHERE id = post_id
    AND (author_id = auth.uid() OR auth.role() = 'service_role')
  )
);

-- Verify the policies were created
SELECT * FROM pg_policies WHERE tablename = 'post_categories';
