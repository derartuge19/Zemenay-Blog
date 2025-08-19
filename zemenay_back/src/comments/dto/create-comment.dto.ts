import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsEmail, IsOptional, IsUUID } from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'The content of the comment' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'ID of the post this comment belongs to' })
  @IsUUID()
  post_id: string;

  @ApiProperty({ description: 'ID of the comment author' })
  @IsUUID()
  @IsNotEmpty()
  author_id: string;

  @ApiProperty({ description: 'Name of the comment author' })
  @IsString()
  @IsNotEmpty()
  author_name: string;

  @ApiProperty({ description: 'Email of the comment author', required: false })
  @IsEmail()
  @IsOptional()
  author_email?: string;

  @ApiProperty({ description: 'URL of the author\'s avatar', required: false })
  @IsString()
  @IsOptional()
  author_avatar?: string;

  @ApiProperty({
    description: 'ID of the parent comment if this is a reply',
    required: false,
    nullable: true,
  })
  @IsUUID()
  @IsOptional()
  parent_id?: string | null;
}
