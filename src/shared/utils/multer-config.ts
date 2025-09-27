import { MulterOptions } from '@nestjs/platform-express/multer/interfaces/multer-options.interface';
import { BadRequestException } from '@nestjs/common';
import { FileExtension } from '../../domain/value-objects/file-extension.vo';

export const multerConfig: MulterOptions = {
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    try {
      const ext = file.originalname.substring(
        file.originalname.lastIndexOf('.'),
      );
      FileExtension.create(ext);
      cb(null, true);
    } catch (error) {
      cb(new BadRequestException(error.message), false);
    }
  },
};
