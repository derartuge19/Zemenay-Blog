import { ApiProperty } from '@nestjs/swagger';

export class Tag {
  @ApiProperty({
    description: 'The unique identifier of the tag',
    example: '123e4567-e89b-12d3-a456-426614174000'
  })
  id: string;

  @ApiProperty({
    description: 'The name of the tag',
    example: 'Technology'
  })
  name: string;

  @ApiProperty({
    description: 'The URL-friendly slug of the tag',
    example: 'technology'
  })
  slug: string;

  @ApiProperty({
    description: 'The timestamp when the tag was created',
    example: '2024-01-01T00:00:00.000Z'
  })
  created_at: Date;

  @ApiProperty({
    description: 'The timestamp when the tag was last updated',
    example: '2024-01-01T00:00:00.000Z'
  })
  updated_at: Date;
} 