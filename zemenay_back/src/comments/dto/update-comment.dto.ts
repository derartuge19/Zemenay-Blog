import { PartialType } from '@nestjs/swagger';
import { CreateCommentDto } from './create-comment.dto';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateCommentDto extends PartialType(CreateCommentDto) {
  @IsOptional()
  @IsEnum(['pending', 'approved', 'spam', 'trash'], {
    message: 'Status must be one of: pending, approved, spam, trash',
  })
  status?: 'pending' | 'approved' | 'spam' | 'trash';
}
