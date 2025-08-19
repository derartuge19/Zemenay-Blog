import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNotEmpty, MaxLength } from 'class-validator';

export class UpdateCategoryDto {
  @ApiProperty({
    description: 'The name of the category',
    example: 'Technology',
    required: false,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'The description of the category',
    example: 'All about technology',
    required: false,
  })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  description?: string;
}
