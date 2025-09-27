import { BadRequestException } from '@nestjs/common';
import { multerConfig } from '../../../../src/shared/utils/multer-config';

describe('MulterConfig', () => {
  describe('limits', () => {
    it('should have correct file size limit', () => {
      expect(multerConfig.limits?.fileSize).toBe(100 * 1024 * 1024); // 100MB
    });
  });

  describe('fileFilter', () => {
    it('should accept valid video file extensions', () => {
      const validFiles = ['test.mp4', 'video.avi', 'movie.mov', 'clip.mkv'];

      validFiles.forEach((filename) => {
        const mockFile = { originalname: filename } as Express.Multer.File;
        const callback = jest.fn();

        multerConfig.fileFilter?.(null as any, mockFile, callback);

        expect(callback).toHaveBeenCalledWith(null, true);
        callback.mockClear();
      });
    });

    it('should reject invalid file extensions', () => {
      const invalidFiles = [
        'image.jpg',
        'document.pdf',
        'text.txt',
        'archive.zip',
      ];

      invalidFiles.forEach((filename) => {
        const mockFile = { originalname: filename } as Express.Multer.File;
        const callback = jest.fn();

        multerConfig.fileFilter?.(null as any, mockFile, callback);

        expect(callback).toHaveBeenCalledWith(
          expect.any(BadRequestException),
          false,
        );
        callback.mockClear();
      });
    });

    it('should handle files without extension', () => {
      const mockFile = {
        originalname: 'filenoextension',
      } as Express.Multer.File;
      const callback = jest.fn();

      multerConfig.fileFilter?.(null as any, mockFile, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        false,
      );
    });

    it('should handle undefined originalname', () => {
      const mockFile = { originalname: undefined } as Express.Multer.File;
      const callback = jest.fn();

      multerConfig.fileFilter?.(null as any, mockFile, callback);

      expect(callback).toHaveBeenCalledWith(
        expect.any(BadRequestException),
        false,
      );
    });
  });
});
