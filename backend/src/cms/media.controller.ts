import {
  Controller,
  Post,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  BadRequestException,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { diskStorage } from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path = require('path');
import { ActivityLogService } from '../activity-log/activity-log.service';

@Controller('cms/media')
export class MediaController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const filename: string =
            path.parse(file.originalname).name.replace(/\s/g, '') + uuidv4();
          const extension: string = path.parse(file.originalname).ext;
          cb(null, `${filename}${extension}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/webp',
          'video/mp4',
          'video/webm',
          'video/quicktime',
        ];
        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new BadRequestException('Invalid file type. Only images and videos are allowed.'), false);
        }
      },
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: any, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    const host = req.get('host');
    const protocol = req.protocol;
    const fileUrl = `${protocol}://${host}/uploads/${file.filename}`;

    await this.activityLogService.log(
      req.user.userId,
      'UPLOAD_MEDIA',
      { filename: file.filename, mimetype: file.mimetype, size: file.size },
      undefined,
      req.ip,
    );

    return {
      success: true,
      url: fileUrl,
      filename: file.filename,
      mimetype: file.mimetype,
    };
  }
}
