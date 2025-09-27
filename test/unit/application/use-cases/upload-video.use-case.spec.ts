import { Test, TestingModule } from '@nestjs/testing';
import { Readable } from 'stream';
import { UploadVideoUseCase } from '../../../../src/application/use-cases/upload-video.use-case';
import { VideoFileRepository } from '../../../../src/domain/repositories/video-file.repository';
import { FileStorageService } from '../../../../src/shared/interfaces/file-storage.interface';
import { VideoFile } from '../../../../src/domain/entities/video-file.entity';
import { InvalidFileFormatException } from '../../../../src/domain/exceptions/domain.exception';

describe('UploadVideoUseCase', () => {
  let useCase: UploadVideoUseCase;
  let videoFileRepository: jest.Mocked<VideoFileRepository>;
  let fileStorageService: jest.Mocked<FileStorageService>;

  beforeEach(async () => {
    const mockVideoFileRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockFileStorageService = {
      saveFile: jest.fn(),
      deleteFile: jest.fn(),
      fileExists: jest.fn(),
      getFileSize: jest.fn(),
      createZip: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UploadVideoUseCase,
        {
          provide: 'VideoFileRepository',
          useValue: mockVideoFileRepository,
        },
        {
          provide: 'FileStorageService',
          useValue: mockFileStorageService,
        },
      ],
    }).compile();

    useCase = module.get<UploadVideoUseCase>(UploadVideoUseCase);
    videoFileRepository = module.get('VideoFileRepository');
    fileStorageService = module.get('FileStorageService');
  });

  describe('execute', () => {
    const mockFile: Express.Multer.File = {
      originalname: 'test-video.mp4',
      size: 1024,
      buffer: Buffer.from('test'),
      fieldname: 'video',
      encoding: '7bit',
      mimetype: 'video/mp4',
      destination: '',
      filename: 'test-video.mp4',
      path: '',
      stream: new Readable(),
    };

    it('should upload single video successfully', async () => {
      const mockVideoFile = VideoFile.create(
        'test-video.mp4',
        expect.any(String) as string,
        '.mp4',
        1024,
        'user-123',
      );

      fileStorageService.saveFile.mockResolvedValue('uploads/test-video.mp4');
      videoFileRepository.save.mockResolvedValue(mockVideoFile);

      const result = await useCase.execute([mockFile], 'user-123');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(fileStorageService.saveFile).toHaveBeenCalledWith(
        mockFile,
        expect.stringContaining('uploads/') as string,
      );
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(videoFileRepository.save).toHaveBeenCalled();
      expect(result).toHaveLength(1);
      expect(result[0]).toBe(mockVideoFile);
    });

    it('should upload multiple videos successfully', async () => {
      const mockFile2: Express.Multer.File = {
        originalname: 'test-video-2.mp4',
        size: 2048,
        buffer: Buffer.from('test2'),
        fieldname: 'video',
        encoding: '7bit',
        mimetype: 'video/mp4',
        destination: '',
        filename: 'test-video-2.mp4',
        path: '',
        stream: new Readable(),
      };

      const mockVideoFile1 = VideoFile.create(
        'test-video.mp4',
        expect.any(String) as string,
        '.mp4',
        1024,
        'user-123',
      );
      const mockVideoFile2 = VideoFile.create(
        'test-video-2.mp4',
        expect.any(String) as string,
        '.mp4',
        2048,
        'user-123',
      );

      fileStorageService.saveFile.mockResolvedValue('uploads/test-video.mp4');
      videoFileRepository.save
        .mockResolvedValueOnce(mockVideoFile1)
        .mockResolvedValueOnce(mockVideoFile2);

      const result = await useCase.execute([mockFile, mockFile2], 'user-123');

      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(fileStorageService.saveFile).toHaveBeenCalledTimes(2);
      // eslint-disable-next-line @typescript-eslint/unbound-method
      expect(videoFileRepository.save).toHaveBeenCalledTimes(2);
      expect(result).toHaveLength(2);
    });

    it('should use executeSingle for backward compatibility', async () => {
      const mockVideoFile = VideoFile.create(
        'test-video.mp4',
        expect.any(String) as string,
        '.mp4',
        1024,
        'user-123',
      );

      fileStorageService.saveFile.mockResolvedValue('uploads/test-video.mp4');
      videoFileRepository.save.mockResolvedValue(mockVideoFile);

      const result = await useCase.executeSingle(mockFile, 'user-123');

      expect(result).toBe(mockVideoFile);
    });

    it('should throw InvalidFileFormatException for unsupported format', async () => {
      const mockFileWithInvalidFormat: Express.Multer.File = {
        ...mockFile,
        originalname: 'test-file.txt',
      };

      await expect(
        useCase.execute([mockFileWithInvalidFormat], 'user-123'),
      ).rejects.toThrow(InvalidFileFormatException);
    });

    it('should throw error for empty file array', async () => {
      await expect(useCase.execute([], 'user-123')).rejects.toThrow(
        'At least one video file is required',
      );
    });

    it('should throw error for too many files', async () => {
      const files = [mockFile, mockFile, mockFile, mockFile]; // 4 files

      await expect(useCase.execute(files, 'user-123')).rejects.toThrow(
        'Maximum of 3 video files allowed',
      );
    });

    it('should handle file storage errors', async () => {
      fileStorageService.saveFile.mockRejectedValue(new Error('Storage error'));

      await expect(useCase.execute([mockFile], 'user-123')).rejects.toThrow(
        'Storage error',
      );
    });
  });
});
