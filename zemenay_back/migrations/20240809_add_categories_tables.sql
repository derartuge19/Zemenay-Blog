-- Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(slug)
);

-- Create index on slug for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_slug ON public.categories(slug);

-- Create post_categories join table
CREATE TABLE IF NOT EXISTS public.post_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, category_id)
);

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_post_categories_post_id ON public.post_categories(post_id);
CREATE INDEX IF NOT EXISTS idx_post_categories_category_id ON public.post_categories(category_id);

-- Add trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_modified_column() 
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW; 
END;
$$ language 'plpgsql';

-- Create trigger for categories table
DROP TRIGGER IF EXISTS update_categories_modtime ON public.categories;
CREATE TRIGGER update_categories_modtime
BEFORE UPDATE ON public.categories
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- Create trigger for posts table (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_posts_modtime') THEN
        CREATE TRIGGER update_posts_modtime
        BEFORE UPDATE ON public.posts
        FOR EACH ROW
        EXECUTE FUNCTION update_modified_column();
    END IF;
END $$;
