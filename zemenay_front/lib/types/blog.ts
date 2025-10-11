// Shared types for the blog application

export interface Author {
  id: string;
  username: string | null;
  bio: string | null;
  avatar_url: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
  posts_count?: number;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
  created_at: string;
  posts_count?: number;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featured_image: string | null;
  status: 'draft' | 'published';
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  created_at: string;
  updated_at: string;
  commentCount?: number | null;
  readingTime?: number | null;
  author_id: string;
  author?: Author | null;
  category?: Category | null;
  category_id?: string | null;
  tags?: Tag[] | null;
  featured?: boolean;
  allowComments?: boolean;
  canonicalUrl?: string;
}

export interface CreateBlogPostData {
  title: string;
  content: string;
  excerpt: string | null;
  status: 'draft' | 'published';
  featured_image?: string | null;
  slug: string;
  seo_title?: string | null;
  seo_description?: string | null;
  seo_keywords?: string | null;
  canonicalUrl?: string | null;
  category_id?: string | null;
  tags: string[];
  author_id: string;
  featured?: boolean;
  allowComments?: boolean;
}

export interface UpdateBlogPostData extends Partial<CreateBlogPostData> {
  id: string;
}
