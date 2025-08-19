import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { PostsController } from './posts.controller';
import { DatabaseModule } from '../database/database.module';
import { CategoriesModule } from '../categories/categories.module';
import { CommentsModule } from '../comments/comments.module';
import { FileUploadModule } from '../common/file-upload/file-upload.module';

@Module({
  imports: [
    DatabaseModule, 
    CategoriesModule,
    CommentsModule, 
    MulterModule.register({
      dest: './uploads',
      limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
      },
    }),
    FileUploadModule,
  ],
  controllers: [PostsController],
  providers: [PostsService],
  exports: [PostsService],
})
export class PostsModule {}
