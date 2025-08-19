-- First, disable RLS to allow modifications
ALTER TABLE public.categories DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON public.categories;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.categories;
DROP POLICY IF EXISTS "Enable update for admins only" ON public.categories;
DROP POLICY IF EXISTS "Enable delete for admins only" ON public.categories;

-- Create a simple policy that allows all operations (for testing only)
CREATE POLICY "Allow all operations for testing"
ON public.categories
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- Re-enable RLS
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Verify the policy was created
SELECT * FROM pg_policies WHERE tablename = 'categories';
