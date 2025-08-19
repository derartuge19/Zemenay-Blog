import { PartialType } from '@nestjs/swagger';
import { CreatePostDto } from './create-post.dto';
import { IsString, IsOptional, IsIn } from 'class-validator';

export class UpdatePostDto extends PartialType(CreatePostDto) {
  @IsString()
  @IsOptional()
  @IsIn(['published', 'draft', 'archived'])
  status?: 'published' | 'draft' | 'archived';

  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  content?: string;

  // Add any additional fields that should be updatable
}
