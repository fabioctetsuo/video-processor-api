import {
  UploadVideoDto,
  UploadSingleVideoDto,
} from '../../../../src/application/dto/upload-video.dto';

describe('UploadVideoDto', () => {
  describe('UploadVideoDto', () => {
    it('should create instance with videos array', () => {
      const mockFiles = [
        { originalname: 'video1.mp4' } as Express.Multer.File,
        { originalname: 'video2.mp4' } as Express.Multer.File,
      ];

      const dto = new UploadVideoDto();
      dto.videos = mockFiles;

      expect(dto).toBeDefined();
      expect(dto.videos).toEqual(mockFiles);
      expect(dto.videos).toHaveLength(2);
    });

    it('should handle single video file', () => {
      const mockFile = { originalname: 'video.mp4' } as Express.Multer.File;

      const dto = new UploadVideoDto();
      dto.videos = [mockFile];

      expect(dto.videos).toHaveLength(1);
      expect(dto.videos[0]).toEqual(mockFile);
    });

    it('should handle maximum videos (3 files)', () => {
      const mockFiles = [
        { originalname: 'video1.mp4' } as Express.Multer.File,
        { originalname: 'video2.mp4' } as Express.Multer.File,
        { originalname: 'video3.mp4' } as Express.Multer.File,
      ];

      const dto = new UploadVideoDto();
      dto.videos = mockFiles;

      expect(dto.videos).toHaveLength(3);
    });
  });

  describe('UploadSingleVideoDto', () => {
    it('should create instance with single video', () => {
      const mockFile = {
        originalname: 'single-video.mp4',
        size: 50 * 1024 * 1024, // 50MB
      } as Express.Multer.File;

      const dto = new UploadSingleVideoDto();
      dto.video = mockFile;

      expect(dto).toBeDefined();
      expect(dto.video).toEqual(mockFile);
      expect(dto.video.originalname).toBe('single-video.mp4');
    });

    it('should handle different video formats', () => {
      const formats = ['mp4', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'webm'];

      formats.forEach((format) => {
        const mockFile = {
          originalname: `video.${format}`,
        } as Express.Multer.File;

        const dto = new UploadSingleVideoDto();
        dto.video = mockFile;

        expect(dto.video.originalname).toBe(`video.${format}`);
      });
    });
  });
});
