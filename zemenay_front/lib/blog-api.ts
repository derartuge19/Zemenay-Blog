// Client-side API functions that use the API client
import { apiClient, BlogPost, Category, Tag } from './api-client';
import type { CreateBlogPostData, UpdateBlogPostData } from './types/blog';

export type { BlogPost, Category, Tag, CreateBlogPostData, UpdateBlogPostData };
// Blog Post API
export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    return await apiClient.getPostBySlug(slug);
  } catch (error) {
    console.error('Error fetching blog post:', error);
    return null;
  }
}

export async function getPosts(params?: {
  page?: number;
  limit?: number;
  status?: 'draft' | 'published';
  author_id?: string;
  categoryId?: string;
}): Promise<{ data: BlogPost[]; total: number }> {
  try {
    return await apiClient.getPosts({
      page: params?.page,
      limit: params?.limit,
      status: params?.status,
      author_id: params?.author_id,
      categoryId: params?.categoryId,
    });
  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return { data: [], total: 0 };
  }
}

// Alias for backward compatibility
export const getAllBlogPosts = async (categoryId?: string) => {
  const { data } = await getPosts(categoryId ? { categoryId } : {});
  return data;
};

export async function createBlogPost(postData: CreateBlogPostData): Promise<BlogPost | null> {
  try {
    return await apiClient.createPost({
      title: postData.title,
      content: postData.content,
      excerpt: postData.excerpt || '',
      status: postData.status || 'draft',
      slug: postData.slug,
      author_id: postData.author_id,
      featured_image: postData.featured_image || undefined,
      seo_title: postData.seo_title || undefined,
      seo_description: postData.seo_description || undefined,
      seo_keywords: postData.seo_keywords || undefined,
    } as any);
  } catch (error) {
    console.error('Error creating blog post:', error);
    throw error;
  }
}

export async function updateBlogPost(
  id: string,
  updates: UpdateBlogPostData
): Promise<BlogPost | null> {
  try {
    return await apiClient.updatePost(id, {
      ...updates,
      excerpt: updates.excerpt === null ? undefined : updates.excerpt,
      featured_image: updates.featured_image === null ? undefined : updates.featured_image,
      seo_title: updates.seo_title === null ? undefined : updates.seo_title,
      seo_description: updates.seo_description === null ? undefined : updates.seo_description,
      seo_keywords: updates.seo_keywords === null ? undefined : updates.seo_keywords,
    } as any);
  } catch (error) {
    console.error('Error updating blog post:', error);
    throw error;
  }
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  try {
    await apiClient.deletePost(id);
    return true;
  } catch (error) {
    console.error('Error deleting blog post:', error);
    return false;
  }
}

// Categories
export async function getCategories(): Promise<Category[]> {
  try {
    return await apiClient.getCategories();
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

// Tags
export async function getTags(): Promise<Tag[]> {
  try {
    return await apiClient.getTags();
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}

export async function createTag(name: string): Promise<Tag | null> {
  try {
    return await apiClient.createTag(name);
  } catch (error) {
    console.error('Error creating tag:', error);
    throw error;
  }
}

export async function addTagToPost(postId: string, tagId: string): Promise<boolean> {
  try {
    // This would be handled by your API
    return true;
  } catch (error) {
    console.error('Error adding tag to post:', error);
    return false;
  }
}

export async function removeTagFromPost(postId: string, tagId: string): Promise<boolean> {
  try {
    // This would be handled by your API
    return true;
  } catch (error) {
    console.error('Error removing tag from post:', error);
    return false;
  }
}

// Helper functions
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

export function getExcerpt(content: string, maxLength = 160): string {
  if (!content) return '';
  const excerpt = content.replace(/<[^>]*>/g, '').substring(0, maxLength);
  return excerpt.length === maxLength ? `${excerpt}...` : excerpt;
}
