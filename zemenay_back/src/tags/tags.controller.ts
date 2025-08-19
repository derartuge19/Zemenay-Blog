import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Param, 
  Put, 
  Delete, 
  UseGuards,
  ParseUUIDPipe,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { TagsService } from './tags.service';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { Tag } from './entities/tag.entity';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('tags')
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new tag' })
  @ApiResponse({ status: 201, description: 'The tag has been successfully created.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  async create(@Body() createTagDto: CreateTagDto): Promise<Tag> {
    try {
      return this.tagsService.create(createTagDto);
    } catch (error) {
      console.error('Error in tags controller (create):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to create tag',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @ApiOperation({ summary: 'Get all tags' })
  @ApiResponse({ status: 200, description: 'Return all tags.' })
  async findAll(): Promise<Tag[]> {
    try {
      return this.tagsService.findAll();
    } catch (error) {
      console.error('Error in tags controller (findAll):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to fetch tags',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a tag by ID' })
  @ApiResponse({ status: 200, description: 'Return the tag.' })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async findOne(@Param('id', ParseUUIDPipe) id: string): Promise<Tag> {
    try {
      return this.tagsService.findOne(id);
    } catch (error) {
      console.error('Error in tags controller (findOne):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to fetch tag',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a tag' })
  @ApiResponse({ status: 200, description: 'The tag has been successfully updated.' })
  @ApiResponse({ status: 400, description: 'Bad request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateTagDto: UpdateTagDto
  ): Promise<Tag> {
    try {
      return this.tagsService.update(id, updateTagDto);
    } catch (error) {
      console.error('Error in tags controller (update):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to update tag',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.AUTHOR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a tag' })
  @ApiResponse({ status: 200, description: 'The tag has been successfully deleted.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Tag not found.' })
  async remove(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    try {
      return this.tagsService.remove(id);
    } catch (error) {
      console.error('Error in tags controller (remove):', error);
      throw new HttpException(
        {
          statusCode: 500,
          message: 'Failed to delete tag',
          error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error',
        },
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 