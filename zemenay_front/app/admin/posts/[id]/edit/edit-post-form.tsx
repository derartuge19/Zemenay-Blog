'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { getTags, createTag, updateBlogPost ,UpdateBlogPostData} from '@/lib/blog-api';
import type { BlogPost, Category, Tag as ApiClientTag } from '@/lib/api-client';
import type { Tag as BlogApiTag } from '@/lib/blog-api';
import { useAuth } from '@/lib/auth-context';

// Create a unified Tag type that includes all required fields
type UnifiedTag = ApiClientTag & {
  slug: string;
  created_at: string;
};

interface EditPostFormProps {
  postId: string;
  initialPost: BlogPost;
  categories: Category[];
}

export function EditPostForm({
  postId,
  initialPost,
  categories,
}: EditPostFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  const [post, setPost] = useState<Partial<BlogPost>>(initialPost);
  const [isLoading, setIsLoading] = useState(false);
  const [availableTags, setAvailableTags] = useState<UnifiedTag[]>([]);
  const [newTag, setNewTag] = useState('');
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>(
    initialPost.categories?.map((c) => c.id) || [],
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialPost.tags?.map((t) => t.id) || [],
  );

  // Helper function to convert BlogApiTag to UnifiedTag
  const toUnifiedTag = (tag: BlogApiTag): UnifiedTag => ({
    ...tag,
    slug: (tag as any).slug || tag.name.toLowerCase().replace(/\s+/g, '-'),
    created_at: (tag as any).created_at || new Date().toISOString(),
    posts_count: (tag as any).posts_count || 0,
  });

  useEffect(() => {
    const fetchTags = async () => {
      try {
        const tags = await getTags();
        setAvailableTags(tags.map(toUnifiedTag));
      } catch (error) {
        console.error('Error fetching tags:', error);
        toast({
          title: 'Error',
          description: 'Failed to load tags',
          variant: 'destructive',
        });
      }
    };

    fetchTags();
  }, [toast]);

  useEffect(() => {
    setPost(initialPost);
    setSelectedCategoryIds(initialPost.categories?.map((c) => c.id) || []);
    setSelectedTagIds(initialPost.tags?.map((t) => t.id) || []);
  }, [initialPost]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setPost((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategoryIds((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId],
    );
  };

  const handleTagToggle = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId],
    );
  };

  const handleAddNewTag = async () => {
    if (!newTag.trim()) return;
    try {
      const newTagData = await createTag(newTag.trim());
if (!newTagData) {
  throw new Error('Failed to create tag');
}
const unifiedTag = toUnifiedTag(newTagData);
      setAvailableTags((prev) => [...prev, unifiedTag]);
      setSelectedTagIds((prev) => [...prev, unifiedTag.id]);
      setNewTag('');
    } catch (error) {
      console.error('Error creating tag:', error);
      toast({
        title: 'Error',
        description: 'Failed to create new tag',
        variant: 'destructive',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    setIsLoading(true);

    try {
      // Map category IDs to actual Category objects
      const selectedCategories: Category[] = categories.filter((c) =>
        selectedCategoryIds.includes(c.id),
      );

      const updateData: UpdateBlogPostData = {
        id: postId,
        title: post.title!,
        content: post.content!,
        excerpt: post.excerpt || null,
        status: post.status || 'draft',
        slug: post.slug!,
        featured_image: post.featured_image || null,
        seo_title: post.seo_title || null,
        seo_description: post.seo_description || null,
        seo_keywords: post.seo_keywords || null,
        category_id: selectedCategoryIds[0] || null,
        tags: selectedTagIds,
        author_id: post.author_id || user?.id || '',
      };
      
      console.log('Updating post with data:', updateData);
      await updateBlogPost(postId, updateData);


      toast({ title: 'Success', description: 'Post updated successfully' });
      router.push('/admin/posts');
    } catch (error) {
      console.error('Error updating post:', error);
      toast({
        title: 'Error',
        description:
          error instanceof Error ? error.message : 'Failed to update post',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!post) return <div>Loading post data...</div>;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <Label htmlFor="title">Title</Label>
        <Input
          id="title"
          name="title"
          value={post.title || ''}
          onChange={handleChange}
          required
        />
      </div>

      {/* Slug */}
      <div>
        <Label htmlFor="slug">Slug</Label>
        <Input
          id="slug"
          name="slug"
          value={post.slug || ''}
          onChange={handleChange}
          required
        />
      </div>

      {/* Excerpt */}
      <div>
        <Label htmlFor="excerpt">Excerpt</Label>
        <Textarea
          id="excerpt"
          name="excerpt"
          value={post.excerpt || ''}
          onChange={handleChange}
          rows={3}
        />
      </div>

      {/* Content */}
      <div>
        <Label htmlFor="content">Content</Label>
        <Textarea
          id="content"
          name="content"
          value={post.content || ''}
          onChange={handleChange}
          rows={10}
          required
        />
      </div>

      {/* Categories */}
      <div>
        <Label>Categories</Label>
        <div className="flex flex-wrap gap-2 mt-2">
          {categories.map((c) => (
            <Button
              key={c.id}
              type="button"
              variant={
                selectedCategoryIds.includes(c.id) ? 'default' : 'outline'
              }
              onClick={() => handleCategoryToggle(c.id)}
              className="rounded-full"
            >
              {c.name}
            </Button>
          ))}
        </div>
      </div>

      {/* Tags */}
      <div>
        <Label>Tags</Label>
        <div className="flex flex-wrap gap-2 mt-2 mb-2">
          {availableTags?.map((tag) => (
            <Button
              key={tag.id}
              type="button"
              variant={selectedTagIds.includes(tag.id) ? 'default' : 'outline'}
              onClick={() => handleTagToggle(tag.id)}
              className="rounded-full"
            >
              {tag.name}
            </Button>
          )) || (
            <p className="text-sm text-muted-foreground">Loading tags...</p>
          )}
        </div>
        <div className="flex gap-2 mt-2">
          <Input
            placeholder="New tag"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && (e.preventDefault(), handleAddNewTag())
            }
          />
          <Button type="button" onClick={handleAddNewTag} variant="outline">
            Add Tag
          </Button>
        </div>
      </div>

      {/* Status */}
      <div className="flex items-center space-x-2">
        <Switch
          id="status"
          checked={post.status === 'published'}
          onCheckedChange={(checked) =>
            setPost((prev) => ({
              ...prev,
              status: checked ? 'published' : 'draft',
            }))
          }
        />
        <Label htmlFor="status">
          {post.status === 'published' ? 'Published' : 'Draft'}
        </Label>
      </div>

      <div className="flex justify-end space-x-4 pt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </form>
  );
}
