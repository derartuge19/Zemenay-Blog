import { ApiProperty } from '@nestjs/swagger';

export type PostStatus = 'published' | 'draft' | 'archived';

export class Post {
  @ApiProperty({ description: 'The unique identifier of the post' })
  id?: string;

  @ApiProperty({ description: 'The title of the post' })
  title: string;

  @ApiProperty({ description: 'The URL-friendly slug of the post' })
  slug: string;

  @ApiProperty({ description: 'The content of the post (markdown supported)' })
  content: string;

  @ApiProperty({ description: 'Brief excerpt for preview' })
  excerpt?: string;

  @ApiProperty({ description: 'Post status', enum: ['published', 'draft', 'archived'] })
  status: PostStatus;

  @ApiProperty({ description: 'ID of the author (user)' })
  author_id: string;

  @ApiProperty({ description: 'Name of the author' })
  author_name?: string;

  @ApiProperty({ description: 'URL of the featured image' })
  featured_image?: string;

  @ApiProperty({ description: 'Number of views' })
  views: number;

  @ApiProperty({ description: 'Number of comments' })
  comments_count: number;

  @ApiProperty({ description: 'List of category IDs' })
  categories?: string[];

  @ApiProperty({ description: 'List of tag IDs' })
  tags?: string[];

  @ApiProperty({ description: 'SEO meta title' })
  meta_title?: string;

  @ApiProperty({ description: 'SEO meta description' })
  meta_description?: string;

  @ApiProperty({ description: 'Date when the post was published' })
  published_at?: string | null;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at?: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at?: string;
}
