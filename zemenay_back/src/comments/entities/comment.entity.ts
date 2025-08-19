import { ApiProperty } from '@nestjs/swagger';

export class Comment {
  @ApiProperty({ description: 'The unique identifier of the comment' })
  id?: string;

  @ApiProperty({ description: 'The content of the comment' })
  content: string;

  @ApiProperty({ description: 'ID of the post this comment belongs to' })
  post_id: string;

  @ApiProperty({ description: 'ID of the user who created the comment' })
  user_id: string;

  @ApiProperty({ description: 'Name of the comment author' })
  author_name: string;

  @ApiProperty({ description: 'Email of the comment author' })
  author_email?: string;

  @ApiProperty({ description: 'URL of the author\'s avatar' })
  author_avatar?: string;

  @ApiProperty({ description: 'ID of the parent comment if this is a reply', nullable: true })
  parent_id?: string | null;

  @ApiProperty({ description: 'Comment status', enum: ['pending', 'approved', 'spam', 'trash'] })
  status: 'pending' | 'approved' | 'spam' | 'trash' = 'pending';

  @ApiProperty({ description: 'Creation timestamp' })
  created_at?: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at?: string;

  @ApiProperty({ description: 'Nested replies to this comment', type: [Comment], required: false })
  replies?: Comment[];
}
