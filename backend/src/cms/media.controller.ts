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
import { memoryStorage } from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import * as streamifier from 'streamifier';
import { ActivityLogService } from '../activity-log/activity-log.service';
import { ConfigService } from '@nestjs/config';

@Controller('cms/media')
export class MediaController {
  constructor(
    private readonly activityLogService: ActivityLogService,
    private readonly configService: ConfigService,
  ) {
    cloudinary.config({
      cloud_name: this.configService.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.configService.get('CLOUDINARY_API_KEY'),
      api_secret: this.configService.get('CLOUDINARY_API_SECRET'),
    });
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPERADMIN')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
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
          cb(
            new BadRequestException(
              'Invalid file type. Only images and videos are allowed.',
            ),
            false,
          );
        }
      },
      limits: {
        fileSize: 20 * 1024 * 1024, // 20MB limit
      },
    }),
  )
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Request() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    try {
      const isVideo = file.mimetype.startsWith('video/');
      const uploadResult = await new Promise<any>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'protocol_cms',
            resource_type: isVideo ? 'video' : 'image',
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        streamifier.createReadStream(file.buffer).pipe(uploadStream);
      });

      await this.activityLogService.log(
        req.user.userId,
        'UPLOAD_MEDIA',
        {
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          cloudinaryId: uploadResult.public_id,
        },
        undefined,
        req.ip,
      );

      return {
        success: true,
        url: uploadResult.secure_url,
        filename: file.originalname,
        mimetype: file.mimetype,
        public_id: uploadResult.public_id,
      };
    } catch (error) {
      console.error('Cloudinary Upload Error:', error);
      throw new BadRequestException(
        error.message || 'Failed to upload file to Cloudinary',
      );
    }
  }
}
