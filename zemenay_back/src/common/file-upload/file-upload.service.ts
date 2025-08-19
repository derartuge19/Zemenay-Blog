import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Express } from 'express';

type File = Express.Multer.File;

@Injectable()
export class FileUploadService {
  private readonly uploadDir = path.join(process.cwd(), 'uploads');

  constructor() {
    // Ensure upload directory exists
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file: File): Promise<string> {
    if (!file) {
      throw new HttpException('No file uploaded', HttpStatus.BAD_REQUEST);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new HttpException(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        HttpStatus.BAD_REQUEST,
      );
    }

    // Generate unique filename
    const fileExt = path.extname(file.originalname).toLowerCase();
    const fileName = `${uuidv4()}${fileExt}`;
    const filePath = path.join(this.uploadDir, fileName);

    try {
      // Save file to disk
      await fs.promises.writeFile(filePath, file.buffer);
      
      // Return relative path that can be used in URLs
      return `/uploads/${fileName}`;
    } catch (error) {
      console.error('Error saving file:', error);
      throw new HttpException(
        'Error saving file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async deleteFile(filePath: string): Promise<void> {
    try {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        await fs.promises.unlink(fullPath);
      }
    } catch (error) {
      console.error('Error deleting file:', error);
      // Don't throw error as this is usually a non-critical operation
    }
  }
}
