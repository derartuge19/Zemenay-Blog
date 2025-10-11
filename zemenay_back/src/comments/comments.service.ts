import { Injectable, NotFoundException } from '@nestjs/common';
import { SupabaseService } from '../supabase/supabase.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { Any } from 'typeorm';

export interface Comment {
  id: string;
  content: string;
  author_id: string;
  author_name: string;
  author_email: string;
  author_avatar?: string;
  post_id: string;
  post?: {
    id: string;
    title: string;
    slug: string;
  };
  parent_id?: string | null;
  status: 'pending' | 'approved';
  created_at: string;
  updated_at: string;
  replies?: Comment[];
}

interface FindAllOptions {
  postId?: string;
  status?: 'pending' | 'approved' | 'all';
  parentId?: string | null;
  search?: string;
  page?: number;
  limit?: number;
}

@Injectable()
export class CommentsService {
  private readonly tableName = 'comments';

  constructor(private readonly supabase: SupabaseService) {}
  async create(createCommentDto: CreateCommentDto): Promise<Comment> {
    const result = await this.supabase
      .getClient()
      .from(this.tableName)
      .insert({
        ...createCommentDto,
        status: 'pending', 
      })
      .select()
      .single()
      .execute();
    const { data, error } = result;
  
    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }
    return data;
  }

  async findAll({
    postId,
    status,
    parentId = null,
    search,
  }: FindAllOptions = {}): Promise<Comment[]> {
    try {
      // First, get all matching comments
      let query = this.supabase
        .getClient()
        .from(this.tableName)
        .select('*');

      if (postId) {
        query = query.eq('post_id', postId);
      }

      // Only filter by status if the column exists in the database
      if (status && status !== 'all') {
        // We'll handle this after fetching if needed
      }

      if (parentId !== undefined) {
        query = parentId === null 
          ? query.is('parent_id', null)
          : query.eq('parent_id', parentId);
      }

      if (search) {
        query = query.or(
          `content.ilike.%${search}%,author_name.ilike.%${search}%,author_email.ilike.%${search}%`
        );
      }

      const result = await query.order('created_at', { ascending: false }).execute();
      const { data: comments, error } = result;

      if (error) {
        console.error('Database error:', error);
        throw new Error(`Failed to fetch comments: ${error.message}`);
      }

      if (!comments || comments.length === 0) {
        return [];
      }

      // If status filter is active, filter in memory
      let filteredComments = [...comments];
      if (status && status !== 'all' && comments[0].hasOwnProperty('status')) {
        filteredComments = comments.filter((comment: any) => 
          comment.status === (status === 'approved' ? 'approved' : 'pending')
        );
      }

      // Get unique post IDs from filtered comments
      const postIds = [...new Set(filteredComments.map(comment => comment.post_id))];
      
      const postsResult = await this.supabase
      .getClient()
      .from('posts')
      .select('id, title, slug')
      .in('id', postIds)
      .execute();
    const { data: posts, error: postsError } = postsResult;

      if (postsError) {
        console.warn('Could not fetch post details, continuing without them');
      }

      // Create a map of post_id to post
      const postsMap = new Map();
      if (posts) {
        posts.forEach((post: any) => postsMap.set(post.id, post));
      }

      // Combine comments with their posts
      return filteredComments.map(comment => ({
        ...comment,
        // Default status to 'approved' if the column doesn't exist
        status: comment.hasOwnProperty('status') ? comment.status : 'approved',
        post: postsMap.get(comment.post_id) || null
      }));
    } catch (error) {
      console.error('Error in findAll:', error);
      throw error;
    }
  }

  async findAllForAdmin({
    status,
    search,
    page = 1,
    limit = 20,
  }: Omit<FindAllOptions, 'postId' | 'parentId'>) {
    const startIdx = (page - 1) * limit;
    
    // First, get the comments
    let query = this.supabase
      .getClient()
      .from(this.tableName)
      .select('*');

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('status', status === 'approved' ? 'approved' : 'pending');
    }

    // Apply search
    if (search) {
      query = query.or(
        `content.ilike.%${search}%,author_name.ilike.%${search}%,author_email.ilike.%${search}%`
      );
    }

    const result = await query
    .order('created_at', { ascending: false })
    .range(startIdx, startIdx + limit - 1)
    .execute();
  const { data: comments, count, error } = result;

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    // If no comments, return empty result
    if (!comments || comments.length === 0) {
      return {
        data: [],
        total: 0,
        page,
        limit,
        totalPages: 0,
      };
    }

    // Get unique post IDs from comments
    const postIds = [...new Set(comments.map((comment: any) => comment.post_id))];
    
    const postsResult = await this.supabase
    .getClient()
    .from('posts')
    .select('id, title, slug')
    .in('id', postIds)
    .execute();
  const { data: posts, error: postsError } = postsResult;
    if (postsError) {
      console.error('Error fetching posts:', postsError);
      // Continue even if posts fail to load
    }

    // Create a map of post ID to post data
    const postsMap = new Map(posts?.map((post: any) => [post.id, post]) || []);

    // Combine comments with their post data
    const commentsWithPosts = comments.map((comment: any) => ({
      ...comment,
      post: postsMap.get(comment.post_id) || null
    }));

    return {
      data: commentsWithPosts,
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async getAdminComments(query: {
    page?: number;
    limit?: number;
    status?: 'pending' | 'approved' | 'all';
    search?: string;
  }) {
    const { page = 1, limit = 20, status, search } = query;
    const startIdx = (page - 1) * limit;

    let queryBuilder = this.supabase
      .getClient()
      .from(this.tableName)
      .select('*, post:posts(id, title, slug)');

    // Apply status filter if provided
    if (status && status !== 'all') {
      queryBuilder = queryBuilder.eq('status', status === 'approved' ? 'approved' : 'pending');
    }

    // Apply search filter if provided
    if (search) {
      queryBuilder = queryBuilder.or(
        `content.ilike.%${search}%,author_name.ilike.%${search}%,author_email.ilike.%${search}%`
      );
    }

    const countResult = await queryBuilder.execute();
    const { count } = countResult;

    const dataResult = await queryBuilder
    .order('created_at', { ascending: false })
    .range(startIdx, startIdx + limit - 1)
    .execute();
  const { data, error } = dataResult;
    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    return {
      data: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    };
  }

  async findOne(id: string): Promise<Comment> {
    const result = await this.supabase
    .getClient()
    .from(this.tableName)
    .select('*, post:posts(id, title, slug)')
    .eq('id', id)
    .single()
    .execute();
  const { data, error } = result;

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Comment not found');
      }
      throw new Error(`Failed to fetch comment: ${error.message}`);
    }

    return data;
  }

  async update(id: string, updateCommentDto: UpdateCommentDto): Promise<Comment> {
    // First, update the comment
    const result = await this.supabase
    .getClient()
    .from(this.tableName)
    .update({
      ...updateCommentDto,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select()
    .single()
    .execute();
  const { data: updatedComment, error } = result;

    // Then fetch the related post data separately
    let postData = null;
    if (updatedComment?.post_id) {
      const postResult = await this.supabase
      .getClient()
      .from('posts')
      .select('id, title, slug')
      .eq('id', updatedComment.post_id)
      .single()
      .execute();
    const { data: post, error: postError } = postResult;
      
      if (!postError) {
        postData = post;
      }
    }

    // Return the combined data
    return {
      ...updatedComment,
      post: postData
    };
  }

  async remove(id: string): Promise<void> {
    const result = await this.supabase
    .getClient()
    .from(this.tableName)
    .delete()
    .eq('id', id)
    .execute();
  const { error } = result;

    if (error) {
      if (error.code === 'PGRST116') {
        throw new NotFoundException('Comment not found');
      }
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }

  async bulkApprove(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }

    console.log(`Approving comments: ${ids.join(', ')}`);
    
    // Process in chunks to avoid URL length issues
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const result = await this.supabase
      .getClient()
      .from(this.tableName)
      .update({ 
        status: 'approved',
        updated_at: new Date().toISOString(),
      })
      .match({ id: chunk })
      .execute();
    const { error } = result;

      if (error) {
        console.error('Error approving comments:', error);
        throw new Error(`Failed to approve comments: ${error.message}`);
      }
    }
    
    console.log(`Successfully approved ${ids.length} comments`);
  }

  async bulkDelete(ids: string[]): Promise<void> {
    if (!ids || ids.length === 0) {
      return;
    }

    console.log(`Deleting comments: ${ids.join(', ')}`);
    
    // Process in chunks to avoid URL length issues
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const result = await this.supabase
      .getClient()
      .from(this.tableName)
      .delete()
      .match({ id: chunk })
      .execute();
    const { error } = result;

      if (error) {
        console.error('Error deleting comments:', error);
        throw new Error(`Failed to delete comments: ${error.message}`);
      }
    }
    
    console.log(`Successfully deleted ${ids.length} comments`);
  }
}
