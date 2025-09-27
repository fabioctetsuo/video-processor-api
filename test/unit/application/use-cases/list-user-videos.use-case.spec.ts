import { Test, TestingModule } from '@nestjs/testing';
import { ListUserVideosUseCase } from '../../../../src/application/use-cases/list-user-videos.use-case';
import { VideoFileRepository } from '../../../../src/domain/repositories/video-file.repository';
import { ProcessingResultRepository } from '../../../../src/domain/repositories/processing-result.repository';
import { VideoFile } from '../../../../src/domain/entities/video-file.entity';
import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';

describe('ListUserVideosUseCase', () => {
  let useCase: ListUserVideosUseCase;
  let videoFileRepository: jest.Mocked<VideoFileRepository>;
  let processingResultRepository: jest.Mocked<ProcessingResultRepository>;

  beforeEach(async () => {
    const mockVideoFileRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByUserId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const mockProcessingResultRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findByVideoFileId: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ListUserVideosUseCase,
        {
          provide: 'VideoFileRepository',
          useValue: mockVideoFileRepository,
        },
        {
          provide: 'ProcessingResultRepository',
          useValue: mockProcessingResultRepository,
        },
      ],
    }).compile();

    useCase = module.get<ListUserVideosUseCase>(ListUserVideosUseCase);
    videoFileRepository = module.get('VideoFileRepository');
    processingResultRepository = module.get('ProcessingResultRepository');
  });

  describe('execute', () => {
    it('should return videos with their processing results', async () => {
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
      const mockProcessingResult = ProcessingResult.create(
        mockVideo1.getId(),
        'frames1.zip',
        10,
        ['frame1.png', 'frame2.png'],
      );

      videoFileRepository.findByUserId.mockResolvedValue([
        mockVideo1,
        mockVideo2,
      ]);
      processingResultRepository.findByVideoFileId
        .mockResolvedValueOnce(mockProcessingResult)
        .mockResolvedValueOnce(null);

      const result = await useCase.execute(userId);

      expect(videoFileRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(processingResultRepository.findByVideoFileId).toHaveBeenCalledWith(
        mockVideo1.getId(),
      );
      expect(processingResultRepository.findByVideoFileId).toHaveBeenCalledWith(
        mockVideo2.getId(),
      );

      expect(result).toHaveLength(2);
      expect(result[0].video).toBe(mockVideo1);
      expect(result[0].processingResult).toBe(mockProcessingResult);
      expect(result[1].video).toBe(mockVideo2);
      expect(result[1].processingResult).toBeUndefined();
    });

    it('should return empty array when user has no videos', async () => {
      const userId = 'user-123';
      videoFileRepository.findByUserId.mockResolvedValue([]);

      const result = await useCase.execute(userId);

      expect(videoFileRepository.findByUserId).toHaveBeenCalledWith(userId);
      expect(
        processingResultRepository.findByVideoFileId,
      ).not.toHaveBeenCalled();
      expect(result).toEqual([]);
    });

    it('should handle videos without processing results', async () => {
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

      expect(result).toHaveLength(1);
      expect(result[0].video).toBe(mockVideo);
      expect(result[0].processingResult).toBeUndefined();
    });

    it('should handle repository errors', async () => {
      const userId = 'user-123';
      const error = new Error('Database error');
      videoFileRepository.findByUserId.mockRejectedValue(error);

      await expect(useCase.execute(userId)).rejects.toThrow('Database error');
    });

    it('should handle processing result repository errors', async () => {
      const userId = 'user-123';
      const mockVideo = VideoFile.create(
        'video.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        userId,
      );

      videoFileRepository.findByUserId.mockResolvedValue([mockVideo]);
      processingResultRepository.findByVideoFileId.mockRejectedValue(
        new Error('Processing result error'),
      );

      await expect(useCase.execute(userId)).rejects.toThrow(
        'Processing result error',
      );
    });
  });
});
