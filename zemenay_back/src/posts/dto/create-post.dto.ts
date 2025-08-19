import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsArray, IsIn } from 'class-validator';
import { PostStatus } from '../entities/post.entity';

export class CreatePostDto {
  @ApiProperty({ description: 'The title of the post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The URL-friendly slug of the post' })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiProperty({ description: 'The content of the post (markdown supported)' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'Brief excerpt for preview', required: false })
  @IsString()
  @IsOptional()
  excerpt?: string;

  @ApiProperty({ 
    description: 'Post status', 
    enum: ['published', 'draft', 'archived'],
    default: 'draft'
  })
  @IsIn(['published', 'draft', 'archived'])
  @IsOptional()
  status?: PostStatus;

  @ApiProperty({ 
    description: 'URL of the featured image (automatically set when uploading a file)', 
    required: false 
  })
  @IsOptional()
  featured_image?: string;

  @ApiProperty({ description: 'List of category IDs', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  categories?: string[];

  @ApiProperty({ description: 'List of tag IDs', required: false })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiProperty({ description: 'SEO meta title', required: false })
  @IsString()
  @IsOptional()
  meta_title?: string;

  @ApiProperty({ description: 'SEO meta description', required: false })
  @IsString()
  @IsOptional()
  meta_description?: string;

  @ApiProperty({ 
    description: 'Date when the post was published (ISO string)',
    required: false 
  })
  @IsString()
  @IsOptional()
  published_at?: string | null;
}
