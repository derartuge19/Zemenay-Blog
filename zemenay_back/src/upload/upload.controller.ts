import { 
  Controller, 
  Post, 
  UseInterceptors, 
  UploadedFile, 
  UseGuards, 
  Req,
  BadRequestException
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileUploadService } from '../common/file-upload/file-upload.service';
import { ApiBearerAuth, ApiConsumes, ApiBody, ApiTags } from '@nestjs/swagger';

type File = Express.Multer.File;

@ApiTags('upload')
@Controller('upload')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UploadController {
  constructor(private readonly fileUploadService: FileUploadService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          description: 'Optional folder to organize uploads'
        }
      },
    },
  })
  async uploadFile(
    @UploadedFile() file: File,
    @Req() req: any
  ) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const filePath = await this.fileUploadService.uploadFile(file);
      return {
        url: `${req.protocol}://${req.get('host')}${filePath}`,
        path: filePath
      };
    } catch (error) {
      throw new BadRequestException(error.message || 'Error uploading file');
    }
  }
}
