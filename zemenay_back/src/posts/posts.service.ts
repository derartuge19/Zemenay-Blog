import { Injectable, Logger, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { SupabaseClient } from '@supabase/supabase-js';
import { DatabaseService } from '../database/database.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post, PostStatus } from './entities/post.entity';
import { slugify } from '../utils/slugify';
import { v4 as uuidv4 } from 'uuid';
import { CategoriesService } from '../categories/categories.service';
import { Category } from '../categories/entities/category.entity';
import { CommentsService } from '../comments/comments.service';

@Injectable()
export class PostsService {
  private readonly table = 'posts';
  private readonly postCategoriesTable = 'post_categories';
  private readonly logger = new Logger(PostsService.name);

  constructor(
    private readonly db: DatabaseService,
    @Inject(forwardRef(() => CategoriesService))
    private readonly categoriesService: CategoriesService,
    @Inject(forwardRef(() => CommentsService))
    private readonly commentsService: CommentsService
  ) {}

  private async handlePostCategories(postId: string, categoryIds: string[] = []) {
    // Use service role client to bypass RLS for admin operations
    const adminClient = this.db.getClient('admin');
    
    if (!categoryIds || categoryIds.length === 0) {
      // If no categories provided, just remove all existing relationships
      await adminClient
      .from(this.postCategoriesTable)
      .delete()
      .eq('post_id', postId)
      .execute();
      return;
    }

    try {
      // First, verify all categories exist
      const categories = await Promise.all(
        categoryIds.map(id => this.categoriesService.findOne(id).catch(() => null))
      );

      // Filter out any null values (categories that weren't found)
      const validCategories = categories.filter((category): category is Category => category !== null);
      
      if (validCategories.length === 0) {
        // No valid categories found, remove all relationships
        await adminClient
        .from(this.postCategoriesTable)
        .delete()
        .eq('post_id', postId)
        .execute();
      }

      // Delete existing relationships
      await adminClient
      .from(this.postCategoriesTable)
      .delete()
      .eq('post_id', postId)
      .execute();

      // Create new relationships - let the database handle the ID and created_at
      const postCategories = validCategories.map(category => ({
        post_id: postId,
        category_id: category.id
      }));

      const result = await adminClient
      .from(this.postCategoriesTable)
      .insert(postCategories)
      .execute();
    const { error } = result;

      if (error) {
        this.logger.error('Error creating post-category relationships:', error);
        throw new Error(`Failed to update post categories: ${error.message}`);
      }
    } catch (error) {
      this.logger.error('Error in handlePostCategories:', error);
      throw new Error(`Failed to update post categories: ${error.message}`);
    }
  }

  private async generateUniqueSlug(title: string, existingSlug: string | null = null): Promise<string> {
    // First, generate a base slug
    let baseSlug = slugify(title);
    let slug = baseSlug;
    let counter = 1;
    let isUnique = false;

    while (!isUnique) {
      try {
        // Check if this slug already exists (excluding the current post if updating)
        const query = this.db.getClient()
          .from(this.table)
          .select('id')
          .eq('slug', slug);
          
        if (existingSlug) {
          query.neq('id', existingSlug);
        }

        const result = await query.maybeSingle().execute();
const { data: existingPost, error } = result;

// PGRST116 means "no rows found" which is what we want for a unique slug
if (error && error.code !== 'PGRST116') {
  this.logger.error(`Error checking slug uniqueness for "${slug}":`, error);
  throw new Error(`Failed to check slug uniqueness: ${error.message}`);
}

if (!existingPost) {
  // No post found with this slug, it's unique
  isUnique = true;
        } else {
          // Slug exists, generate a new one with counter
          slug = `${baseSlug}-${counter}`;
          counter++;
          
          // Safety check to prevent infinite loops
          if (counter > 100) {
            throw new Error('Failed to generate a unique slug after 100 attempts');
          }
        }
      } catch (error) {
        this.logger.error(`Error in generateUniqueSlug for title "${title}":`, error);
        // If something goes wrong, append a random string as a fallback
        slug = `${baseSlug}-${Date.now()}`;
        isUnique = true;
      }
    }

    this.logger.log(`Generated slug "${slug}" for title "${title}"`);
    return slug;
  }

  async create(createPostDto: CreatePostDto, authorId: string): Promise<Post> {
    const client = this.db.getClient();
    try {
      this.logger.log(`Creating post for author: ${authorId}`);
      
      // Verify user exists
      const userResult = await client
  .from('users')
  .select('id')
  .eq('id', authorId)
  .single()
  .execute();
const { data: user, error: userError } = userResult;
  
      if (userError || !user) {
        this.logger.error(`User not found: ${authorId}`, userError);
        throw new Error(`User with ID ${authorId} not found`);
      }
  
      // Generate a unique slug
      const slug = await this.generateUniqueSlug(createPostDto.title);
      const now = new Date().toISOString();
      const postId = uuidv4();
      
      // Extract categories before creating post
      const { categories: categoryIds, ...postData } = createPostDto;
      
      const post = {
        id: postId,
        ...postData,
        slug,
        author_id: authorId,
        status: createPostDto.status || 'draft',
        created_at: now,
        updated_at: now,
        published_at: createPostDto.status === 'published' ? now : null,
        views: 0,
        comments_count: 0
      };
  
      const result = await client
  .from(this.table)
  .insert(post)
  .select()
  .single()
  .execute();
const { data: createdPost, error } = result;
      if (error) {
        this.logger.error('Error creating post:', error);
        throw new Error(`Failed to create post: ${error.message}`);
      }

      // Handle categories
      if (categoryIds && categoryIds.length > 0) {
        await this.handlePostCategories(postId, categoryIds);
      }
  
      // Fetch the complete post with relationships
      return this.findOne(postId);
      
    } catch (error) {
      this.logger.error('Error in create post:', error);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  async findAll(status?: PostStatus | null, authorId?: string, categoryId?: string): Promise<Post[]> {
    try {
      this.logger.log(`Finding posts with params:`, { status, authorId, categoryId });
      
      const client = this.db.getClient();
      
      // Build the base query - just select from posts table
      let query = client
        .from(this.table)
        .select('*');
      
      // Apply filters
      if (status !== undefined && status !== null) {
        query = query.eq('status', status);
      }
      
      if (authorId) {
        query = query.eq('author_id', authorId);
      }
  
      // Handle category filter
      if (categoryId) {
        this.logger.log(`Filtering by category ID: ${categoryId}`);
        
        // First, get all post IDs that have this category
        const pcResult = await client
          .from('post_categories')
          .select('post_id')
          .eq('category_id', categoryId)
          .execute();
        const { data: postCategories, error: pcError } = pcResult;
        
        if (pcError) {
          this.logger.error('Error fetching post categories:', pcError);
          throw new Error(`Failed to filter by category: ${pcError.message}`);
        }
        
        const postIds = postCategories?.map((pc: { post_id: string }) => pc.post_id) || [];
        
        if (postIds.length > 0) {
          query = query.in('id', postIds);
        } else {
          this.logger.log('No posts found with the specified category');
          return [];
        }
      }
      
      // Execute the query
      this.logger.log('Executing posts query...');
      const queryResult = await query
        .order('created_at', { ascending: false })
        .execute();
      const { data: posts, error } = queryResult;
      
      if (error) {
        this.logger.error('Error fetching posts:', error);
        throw new Error(`Failed to fetch posts: ${error.message}`);
      }
  
      this.logger.log(`Successfully fetched ${posts?.length || 0} posts`);
      
      // Now fetch related data for each post
      const enrichedPosts = await Promise.all((posts || []).map(async (post: any) => {
        // Fetch author
        let author = null;
        if (post.author_id) {
          const authorResult = await client
            .from('users')
            .select('id, name, email')
            .eq('id', post.author_id)
            .single()
            .execute();
          author = authorResult.data;
        }
  
        // Fetch categories
        const categoriesResult = await client
          .from('post_categories')
          .select('category_id')
          .eq('post_id', post.id)
          .execute();
        
        const categoryIds = categoriesResult.data?.map((pc: any) => pc.category_id) || [];
        
        let categories = [];
        if (categoryIds.length > 0) {
          const catsResult = await client
            .from('categories')
            .select('*')
            .in('id', categoryIds)
            .execute();
          categories = catsResult.data || [];
        }
  
        return {
          ...post,
          author,
          categories
        };
      }));
      
      return enrichedPosts as Post[];
      
    } catch (error) {
      this.logger.error('Error in findAll posts:', {
        message: error.message,
        stack: error.stack,
      });
      throw new Error(`Failed to fetch posts: ${error.message}`);
    }
  }

  async findOne(id: string): Promise<Post> {
    try {
      // First, get the post
      const postResult = await this.db.getClient()
        .from(this.table)
        .select('*')
        .eq('id', id)
        .single()
        .execute();
      const { data: post, error: postError } = postResult;
  
      if (postError || !post) {
        throw new NotFoundException(`Post with ID ${id} not found`);
      }
  
      // Then get the categories separately
      const categoriesResult = await this.db.getClient()
        .from('post_categories')
        .select('category_id')
        .eq('post_id', id)
        .execute();
      
      const categoryIds = categoriesResult.data?.map((pc: any) => pc.category_id) || [];
      
      let categories = [];
      if (categoryIds.length > 0) {
        const catsResult = await this.db.getClient()
          .from('categories')
          .select('*')
          .in('id', categoryIds)
          .execute();
        categories = catsResult.data || [];
      }
  
      // Fetch approved comments for this post
      const comments = await this.commentsService.findAll({ 
        postId: id,
        status: 'approved',
        limit: 1000
      });
  
      return {
        ...post,
        categories,
        comments: comments|| []
      } as Post;
      
    } catch (error) {
      this.logger.error(`Error finding post ${id}:`, error);
      throw error;
    }
  }

  async update(id: string, updatePostDto: UpdatePostDto): Promise<Post> {
    const client = this.db.getClient();
    try {
      const now = new Date().toISOString();
      
      const { categories: categoryIds, tags: tagIds, title, ...updateData } = updatePostDto;
      
      // Check if we need to update the slug (if title changed)
      let slugUpdate = {};
      if (title) {
        // Get the current post to check if title changed
        const currentPostResult = await client
        .from(this.table)
        .select('title, slug')
        .eq('id', id)
        .single()
        .execute();
      const { data: currentPost } = currentPostResult;
          
        if (currentPost && currentPost.title !== title) {
          // Title changed, generate a new unique slug
          const newSlug = await this.generateUniqueSlug(title, id);
          slugUpdate = { slug: newSlug };
        }
      }
      
      const updateDataWithTimestamps = {
        ...updateData,
        ...slugUpdate,
        updated_at: now,
        ...(updateData.status === 'published' && !updateData.published_at 
          ? { published_at: now } 
          : {})
      };

      const updateResult = await client
  .from(this.table)
  .update(updateDataWithTimestamps)
  .eq('id', id)
  .select()
  .single()
  .execute();
const { data: updatedPost, error } = updateResult;

      if (error) {
        throw new Error(`Failed to update post: ${error.message}`);
      }

      // Handle categories if provided
      if (categoryIds) {
        await this.handlePostCategories(id, categoryIds);
      }

      // Return the complete updated post
      return this.findOne(id);
      
    } catch (error) {
      this.logger.error(`Error updating post ${id}:`, error);
      throw new Error(`Failed to update post: ${error.message}`);
    }
  }

  async remove(id: string): Promise<boolean> {
    const client = this.db.getClient();
    try {
      // Delete category relationships first
      await client
  .from(this.postCategoriesTable)
  .delete()
  .eq('post_id', id)
  .execute();

  const result = await client
  .from(this.table)
  .delete()
  .eq('id', id)
  .execute();
const { error } = result;

      if (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }

      return true;
    } catch (error) {
      this.logger.error(`Error deleting post ${id}:`, error);
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  async incrementViews(id: string): Promise<void> {
    try {
      this.logger.log(`Incrementing views for post ${id}`);
      
      const result = await this.db.getClient().rpc('increment_views', { id }).execute();
      const { error } = result;
      
      if (error) {
        throw new Error(`Failed to increment views: ${error.message}`);
      }
      
    } catch (error) {
      this.logger.error(`Error incrementing views for post ${id}:`, error);
      throw error;
    }
  }

  async findBySlug(slug: string): Promise<Post> {
    try {
      this.logger.log(`Finding post with slug: ${slug}`);
      
      const client = this.db.getClient();
      
      // First, get the post
      const slugResult = await client
        .from(this.table)
        .select('*')
        .eq('slug', slug)
        .single()
        .execute();
      const { data, error } = slugResult;
      
      if (error) {
        if (error.code === 'PGRST116') { // Not found
          throw new NotFoundException(`Post with slug "${slug}" not found`);
        }
        throw error;
      }
      
      if (!data) {
        throw new NotFoundException(`Post with slug "${slug}" not found`);
      }
      
      // Fetch author
      let author = null;
      if (data.author_id) {
        const authorResult = await client
          .from('users')
          .select('id, name, email')
          .eq('id', data.author_id)
          .single()
          .execute();
        author = authorResult.data;
      }
      
      // Fetch categories
      const categoriesResult = await client
        .from('post_categories')
        .select('category_id')
        .eq('post_id', data.id)
        .execute();
      
      const categoryIds = categoriesResult.data?.map((pc: any) => pc.category_id) || [];
      
      let categories = [];
      if (categoryIds.length > 0) {
        const catsResult = await client
          .from('categories')
          .select('*')
          .in('id', categoryIds)
          .execute();
        categories = catsResult.data || [];
      }
      
      // Fetch approved comments for this post
      const comments = await this.commentsService.findAll({ 
        postId: data.id,
        status: 'approved',
        limit: 1000
      });
      
      return {
        ...data,
        author,
        categories,
        comments_count: comments.length,
        comments
      } as Post;
      
    } catch (error) {
      this.logger.error(`Error finding post by slug ${slug}:`, error);
      throw error;
    }
  }
}
