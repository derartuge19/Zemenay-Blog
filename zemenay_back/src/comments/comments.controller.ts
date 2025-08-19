import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Put,
  Delete,
  ParseUUIDPipe,
  BadRequestException,
  UseGuards,
  Patch,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { CommentsService, Comment } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('comments')
@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new comment' })
  @ApiResponse({ status: 201, description: 'The comment has been successfully created.', type: Comment })
  async create(@Body() createCommentDto: CreateCommentDto): Promise<Comment> {
    return this.commentsService.create(createCommentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all comments with optional filters' })
  @ApiQuery({ name: 'postId', required: false, description: 'Filter by post ID' })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['pending', 'approved', 'spam', 'trash'],
    description: 'Filter by comment status' 
  })
  @ApiQuery({ 
    name: 'parentId', 
    required: false, 
    description: 'Filter by parent comment ID. Use "null" to get top-level comments.' 
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in comment content and author name/email'
  })
  @ApiResponse({ status: 200, description: 'Return all comments matching the filters.', type: [Comment] })
  async findAll(
    @Query('postId') postId?: string,
    @Query('status') status?: 'pending' | 'approved' | 'all',
    @Query('parentId') parentId?: string,
    @Query('search') search?: string,
  ): Promise<Comment[]> {
    // Convert 'null' string to actual null for parentId
    const parsedParentId = parentId === 'null' ? null : parentId;
    return this.commentsService.findAll({
      postId,
      status: status as 'pending' | 'approved' | 'all',
      parentId: parsedParentId,
      search,
    });
  }

  @Get('admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all comments for admin' })
  @ApiQuery({ name: 'page', required: false, type: Number, example: 1 })
  @ApiQuery({ name: 'limit', required: false, type: Number, example: 20 })
  @ApiQuery({ 
    name: 'status', 
    required: false, 
    enum: ['pending', 'approved', 'all'],
    example: 'all'
  })
  @ApiQuery({ 
    name: 'search', 
    required: false, 
    type: String,
    description: 'Search in comment content, author name, or email'
  })
  @ApiResponse({ 
    status: 200, 
    description: 'Returns paginated comments for admin',
    schema: {
      type: 'object',
      properties: {
        data: { type: 'array', items: { $ref: '#/components/schemas/Comment' } },
        total: { type: 'number' },
        page: { type: 'number' },
        limit: { type: 'number' },
        totalPages: { type: 'number' }
      }
    }
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async getAdminComments(
    @Query('page') page = 1,
    @Query('limit') limit = 20,
    @Query('status') status: 'pending' | 'approved' | 'all' = 'all',
    @Query('search') search?: string,
  ) {
    try {
      return await this.commentsService.findAllForAdmin({
        page: Number(page),
        limit: Number(limit),
        status,
        search,
      });
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to fetch comments',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a comment by ID' })
  @ApiResponse({ status: 200, description: 'Return the comment with the specified ID.', type: Comment })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Comment> {
    return this.commentsService.findOne(id);
  }

  @Patch(':id/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.EDITOR)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Approve a comment' })
  @ApiResponse({ status: 200, description: 'The comment has been approved.', type: Comment })
  async approveComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('is_approved') isApproved: boolean,
  ): Promise<Comment> {
    return this.commentsService.update(id, { status: isApproved ? 'approved' : 'pending' });
  }

  @Patch('bulk')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Perform bulk actions on comments (Admin only)' })
  @ApiResponse({ status: 200, description: 'Bulk action completed successfully.' })
  async bulkAction(
    @Body() bulkActionDto: { commentIds: string[]; action: 'approve' | 'delete' },
  ) {
    const { commentIds, action } = bulkActionDto;
    
    if (!Array.isArray(commentIds) || commentIds.length === 0) {
      throw new BadRequestException('No comment IDs provided');
    }

    if (action === 'approve') {
      await this.commentsService.bulkApprove(commentIds);
      return { message: 'Comments approved successfully' };
    } else if (action === 'delete') {
      await this.commentsService.bulkDelete(commentIds);
      return { message: 'Comments deleted successfully' };
    } else {
      throw new BadRequestException('Invalid action');
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a comment (Admin only)' })
  @ApiResponse({ status: 200, description: 'The comment has been successfully updated.', type: Comment })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateCommentDto: UpdateCommentDto,
  ): Promise<Comment> {
    return this.commentsService.update(id, updateCommentDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a comment (Admin only)' })
  @ApiResponse({ status: 200, description: 'The comment has been successfully deleted.' })
  @ApiResponse({ status: 404, description: 'Comment not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    return this.commentsService.remove(id);
  }

  @Get('post/:postId/count')
  @ApiOperation({ summary: 'Get count of approved comments for a post' })
  @ApiParam({ name: 'postId', description: 'ID of the post' })
  @ApiResponse({ status: 200, description: 'Return the count of approved comments for the post.' })
  async getCommentsCount(@Param('postId', ParseUUIDPipe) postId: string): Promise<{ count: number }> {
    const comments = await this.commentsService.findAll({
      postId,
      status: 'approved',
      limit: 1000, // Set a high limit to get all comments
    });
    return { count: Array.isArray(comments) ? comments.length : 0 };
  }
}
