import { Module } from '@nestjs/common';
import { UploadController } from './upload.controller';
import { FileUploadModule } from '../common/file-upload/file-upload.module';

@Module({
  imports: [FileUploadModule],
  controllers: [UploadController],
  exports: []
})
export class UploadModule {}
