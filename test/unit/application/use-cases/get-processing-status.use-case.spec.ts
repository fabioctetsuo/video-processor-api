import { Test, TestingModule } from '@nestjs/testing';
import { GetProcessingStatusUseCase } from '../../../../src/application/use-cases/get-processing-status.use-case';
import { ProcessingResultRepository } from '../../../../src/domain/repositories/processing-result.repository';
import { VideoFileRepository } from '../../../../src/domain/repositories/video-file.repository';
import { FileStorageService } from '../../../../src/shared/interfaces/file-storage.interface';
import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';
import { VideoFile } from '../../../../src/domain/entities/video-file.entity';

describe('GetProcessingStatusUseCase', () => {
  let useCase: GetProcessingStatusUseCase;
  let processingResultRepository: jest.Mocked<ProcessingResultRepository>;
  let videoFileRepository: jest.Mocked<VideoFileRepository>;
  let fileStorageService: jest.Mocked<FileStorageService>;

  beforeEach(async () => {
    const mockProcessingResultRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByVideoFileId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockVideoFileRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByUserId: jest.fn(),
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
        GetProcessingStatusUseCase,
        {
          provide: 'ProcessingResultRepository',
          useValue: mockProcessingResultRepository,
        },
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

    useCase = module.get<GetProcessingStatusUseCase>(
      GetProcessingStatusUseCase,
    );
    processingResultRepository = module.get('ProcessingResultRepository');
    videoFileRepository = module.get('VideoFileRepository');
    fileStorageService = module.get('FileStorageService');
  });

  describe('execute', () => {
    it('should return all processing results when no userId provided', async () => {
      const mockResult = ProcessingResult.reconstitute(
        'result-1',
        'video-1',
        'outputs/frames_2025-01-01T12-00-00-000Z.zip',
        10,
        ['frame1.png', 'frame2.png'],
        new Date('2025-01-01T12:00:00.000Z'),
      );

      processingResultRepository.findAll.mockResolvedValue([mockResult]);
      fileStorageService.fileExists.mockResolvedValue(true);
      fileStorageService.getFileSize.mockResolvedValue(1024);

      const result = await useCase.execute();

      expect(processingResultRepository.findAll).toHaveBeenCalledTimes(1);
      expect(videoFileRepository.findByUserId).not.toHaveBeenCalled();
      expect(result.files).toHaveLength(1);
      expect(result.total).toBe(1);

      const file = result.files[0];
      expect(file.filename).toBe('frames_2025-01-01T12-00-00-000Z.zip');
      expect(file.size).toBe(1024);
      expect(file.createdAt).toBe('2025-01-01 12:00:00');
      expect(file.downloadUrl).toBe(
        '/api/v1/videos/download/frames_2025-01-01T12-00-00-000Z.zip',
      );
      expect(file.frameCount).toBe(10);
    });

    it('should return user-specific processing results when userId provided', async () => {
      const userId = 'user-123';
      const mockVideo = VideoFile.create(
        'video.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        userId,
      );
      const mockResult = ProcessingResult.create(
        mockVideo.getId(),
        'outputs/frames.zip',
        5,
        ['frame1.png'],
      );

      videoFileRepository.findByUserId.mockResolvedValue([mockVideo]);
      processingResultRepository.findByVideoFileId.mockResolvedValue(
        mockResult,
      );
      fileStorageService.fileExists.mockResolvedValue(true);
      fileStorageService.getFileSize.mockResolvedValue(2048);

      const result = await useCase.execute(userId);

      expect(videoFileRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(processingResultRepository.findByVideoFileId).toHaveBeenCalledWith(
        mockVideo.getId(),
      );
      expect(processingResultRepository.findAll).not.toHaveBeenCalled();

      expect(result.files).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.files[0].size).toBe(2048);
      expect(result.files[0].frameCount).toBe(5);
    });

    it('should exclude files that do not exist in storage', async () => {
      const mockResult1 = ProcessingResult.create(
        'video-1',
        'outputs/exists.zip',
        5,
        ['frame1.png'],
      );
      const mockResult2 = ProcessingResult.create(
        'video-2',
        'outputs/missing.zip',
        10,
        ['frame2.png'],
      );

      processingResultRepository.findAll.mockResolvedValue([
        mockResult1,
        mockResult2,
      ]);
      fileStorageService.fileExists
        .mockResolvedValueOnce(true)
        .mockResolvedValueOnce(false);
      fileStorageService.getFileSize.mockResolvedValue(1024);

      const result = await useCase.execute();

      expect(fileStorageService.fileExists).toHaveBeenCalledTimes(2);
      expect(fileStorageService.getFileSize).toHaveBeenCalledTimes(1);
      expect(result.files).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.files[0].filename).toBe('exists.zip');
    });

    it('should return empty result when no processing results found', async () => {
      processingResultRepository.findAll.mockResolvedValue([]);

      const result = await useCase.execute();

      expect(result.files).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should handle user with no videos', async () => {
      const userId = 'user-123';
      videoFileRepository.findByUserId.mockResolvedValue([]);

      const result = await useCase.execute(userId);

      expect(result.files).toEqual([]);
      expect(result.total).toBe(0);
      expect(
        processingResultRepository.findByVideoFileId,
      ).not.toHaveBeenCalled();
    });

    it('should handle videos with no processing results', async () => {
      const userId = 'user-123';
      const mockVideo = VideoFile.create(
        'video.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        userId,
      );

      videoFileRepository.findByUserId.mockResolvedValue([mockVideo]);
      processingResultRepository.findByVideoFileId.mockResolvedValue(null);

      const result = await useCase.execute(userId);

      expect(result.files).toEqual([]);
      expect(result.total).toBe(0);
    });

    it('should format created date correctly', async () => {
      const createdAt = new Date('2025-01-01T12:30:45.123Z');
      const mockResult = ProcessingResult.reconstitute(
        'result-1',
        'video-1',
        'outputs/frames.zip',
        10,
        ['frame1.png'],
        createdAt,
      );

      processingResultRepository.findAll.mockResolvedValue([mockResult]);
      fileStorageService.fileExists.mockResolvedValue(true);
      fileStorageService.getFileSize.mockResolvedValue(1024);

      const result = await useCase.execute();

      expect(result.files[0].createdAt).toBe('2025-01-01 12:30:45');
    });

    it('should handle file storage errors gracefully', async () => {
      const mockResult = ProcessingResult.create(
        'video-1',
        'outputs/frames.zip',
        5,
        ['frame1.png'],
      );

      processingResultRepository.findAll.mockResolvedValue([mockResult]);
      fileStorageService.fileExists.mockRejectedValue(
        new Error('Storage error'),
      );

      await expect(useCase.execute()).rejects.toThrow('Storage error');
    });

    it('should handle multiple user videos with mixed results', async () => {
      const userId = 'user-123';
      const mockVideo1 = VideoFile.create(
        'video1.mp4',
        'stored1.mp4',
        '.mp4',
        1024,
        userId,
      );
      const mockVideo2 = VideoFile.create(
        'video2.mp4',
        'stored2.mp4',
        '.mp4',
        2048,
        userId,
      );
      const mockResult1 = ProcessingResult.create(
        mockVideo1.getId(),
        'outputs/frames1.zip',
        5,
        ['frame1.png'],
      );

      videoFileRepository.findByUserId.mockResolvedValue([
        mockVideo1,
        mockVideo2,
      ]);
      processingResultRepository.findByVideoFileId
        .mockResolvedValueOnce(mockResult1)
        .mockResolvedValueOnce(null);
      fileStorageService.fileExists.mockResolvedValue(true);
      fileStorageService.getFileSize.mockResolvedValue(1024);

      const result = await useCase.execute(userId);

      expect(result.files).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(
        processingResultRepository.findByVideoFileId,
      ).toHaveBeenCalledTimes(2);
    });

    it('should handle getFileSize errors', async () => {
      const mockResult = ProcessingResult.create(
        'video-1',
        'outputs/frames.zip',
        5,
        ['frame1.png'],
      );

      processingResultRepository.findAll.mockResolvedValue([mockResult]);
      fileStorageService.fileExists.mockResolvedValue(true);
      fileStorageService.getFileSize.mockRejectedValue(new Error('Size error'));

      await expect(useCase.execute()).rejects.toThrow('Size error');
    });
  });
});
