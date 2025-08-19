import { ApiProperty } from '@nestjs/swagger';

export class Category {
  @ApiProperty({ description: 'The unique identifier of the category' })
  id: string;

  @ApiProperty({ description: 'The name of the category' })
  name: string;

  @ApiProperty({ description: 'URL-friendly slug for the category' })
  slug: string;

  @ApiProperty({ description: 'Optional description of the category' })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  created_at: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updated_at: string;
}
