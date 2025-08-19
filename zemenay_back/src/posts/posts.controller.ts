import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  Query, 
  UseGuards, 
  Req, 
  ParseUUIDPipe,
  Request,
  NotFoundException,
  HttpException,
  HttpStatus,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request as ExpressRequest } from 'express';
import { Express } from 'express';

type File = Express.Multer.File;

type RequestWithUser = ExpressRequest & { 
  user: { id: string };
  protocol: string;
  get: (header: string) => string | string[] | undefined;
};

import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { Post as PostEntity, PostStatus } from './entities/post.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileUploadService } from '../common/file-upload/file-upload.service';

@ApiTags('posts')
@Controller('posts')
export class PostsController {
  constructor(
    private readonly postsService: PostsService,
    private readonly fileUploadService: FileUploadService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @UseInterceptors(FileInterceptor('featured_image'))
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({ status: 201, description: 'The post has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['title', 'content'],
      properties: {
        title: { type: 'string' },
        content: { type: 'string' },
        excerpt: { type: 'string' },
        status: { 
          type: 'string', 
          enum: ['published', 'draft', 'archived'],
          default: 'draft' 
        },
        categories: { 
          type: 'array', 
          items: { type: 'string' } 
        },
        tags: { 
          type: 'array', 
          items: { type: 'string' } 
        },
        meta_title: { type: 'string' },
        meta_description: { type: 'string' },
        published_at: { type: 'string' },
        featured_image: {
          type: 'string',
          format: 'binary',
          description: 'Featured image file (JPG, PNG, GIF, WebP)'
        },
      },
    },
  })
  async create(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: /(jpg|jpeg|png|gif|webp)$/ }),
        ],
        fileIsRequired: false,
      })
    ) file: File,
    @Body() createPostDto: CreatePostDto,
    @Req() req: RequestWithUser
  ): Promise<PostEntity> {
    try {
      // If a file was uploaded, process it
      if (file) {
        const filePath = await this.fileUploadService.uploadFile(file);
        // Set the featured_image URL in the DTO
        const host = req.get('host') || 'localhost:3000'; // Provide a default host
        const protocol = req.protocol || 'http';
        const hostString = Array.isArray(host) ? host[0] : host;
        createPostDto.featured_image = `${protocol}://${hostString}${filePath}`;
      }

      return this.postsService.create(createPostDto, req.user.id);
    } catch (error) {
      console.error('Error in posts controller (create):', error);
      throw new HttpException(
        {
          statusCode: error.status || 500,
          message: error.message || 'Failed to create post',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all posts' })
  @ApiResponse({ status: 200, description: 'Return all posts.', type: [PostEntity] })
  async findAll(
    @Query('status') status?: string,
    @Query('authorId') authorId?: string,
    @Query('categoryId') categoryId?: string
  ): Promise<PostEntity[]> {
    try {
      console.log('Fetching posts with params:', { status, authorId, categoryId });
      
      // Ensure status is a valid PostStatus if provided
      let validStatus: PostStatus | undefined;
      if (status && ['draft', 'published', 'archived'].includes(status)) {
        validStatus = status as PostStatus;
      }
      
      const posts = await this.postsService.findAll(validStatus, authorId, categoryId);
      console.log('Successfully fetched posts:', posts.length);
      return posts;
      
    } catch (error) {
      console.error('Error in posts controller (findAll):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to fetch posts',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a post by ID' })
  @ApiResponse({ status: 200, description: 'Return the post.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<PostEntity> {
    try {
      return this.postsService.findOne(id);
    } catch (error) {
      console.error('Error in posts controller (findOne):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to fetch post',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('slug/:slug')
  @ApiOperation({ summary: 'Get a post by slug' })
  @ApiResponse({ status: 200, description: 'Return the post.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  async findBySlug(@Param('slug') slug: string): Promise<PostEntity> {
    try {
      const post = await this.postsService.findBySlug(slug);
      
      // Ensure post exists and has an id
      if (!post?.id) {
        throw new NotFoundException(`Post with slug "${slug}" not found`);
      }
      
      // Increment view count (non-blocking but with proper error handling)
      this.postsService.incrementViews(post.id)
        .catch(error => console.error('Failed to increment views:', error));
      
      return post;
    } catch (error) {
      console.error(`Error fetching post with slug ${slug}:`, error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to fetch post',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: RequestWithUser
  ): Promise<PostEntity> {
    try {
      // In a real app, you'd want to verify the user owns the post or is an admin
      return this.postsService.update(id, updatePostDto);
    } catch (error) {
      console.error('Error in posts controller (update):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to update post',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiResponse({ status: 200, description: 'The post has been successfully deleted.', type: Boolean })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @Req() req: RequestWithUser
  ): Promise<boolean> {
    try {
      // In a real app, you'd want to verify the user owns the post or is an admin
      return await this.postsService.remove(id);
    } catch (error) {
      console.error('Error in posts controller (remove):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to delete post',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/publish')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a draft post' })
  @ApiResponse({ status: 200, description: 'The post has been published.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  async publish(@Param('id', ParseUUIDPipe) id: string): Promise<PostEntity> {
    try {
      return this.postsService.update(id, { status: 'published' } as UpdatePostDto);
    } catch (error) {
      console.error('Error in posts controller (publish):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to publish post',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post(':id/archive')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Archive a post' })
  @ApiResponse({ status: 200, description: 'The post has been archived.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Post not found.' })
  async archive(@Param('id', ParseUUIDPipe) id: string): Promise<PostEntity> {
    try {
      return this.postsService.update(id, { status: 'archived' } as UpdatePostDto);
    } catch (error) {
      console.error('Error in posts controller (archive):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to archive post',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
