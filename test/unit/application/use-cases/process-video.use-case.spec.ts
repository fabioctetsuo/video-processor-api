import { Test, TestingModule } from '@nestjs/testing';
import { ProcessVideoUseCase } from '../../../../src/application/use-cases/process-video.use-case';
import { VideoFileRepository } from '../../../../src/domain/repositories/video-file.repository';
import { ProcessingResultRepository } from '../../../../src/domain/repositories/processing-result.repository';
import { VideoProcessorService } from '../../../../src/shared/interfaces/video-processor.interface';
import { FileStorageService } from '../../../../src/shared/interfaces/file-storage.interface';
import { WebhookNotificationService } from '../../../../src/shared/services/webhook-notification.service';
import { VideoFile } from '../../../../src/domain/entities/video-file.entity';
import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';
import {
  VideoFileNotFoundException,
  VideoProcessingException,
} from '../../../../src/domain/exceptions/domain.exception';

describe('ProcessVideoUseCase', () => {
  let useCase: ProcessVideoUseCase;
  let videoFileRepository: jest.Mocked<VideoFileRepository>;
  let processingResultRepository: jest.Mocked<ProcessingResultRepository>;
  let videoProcessorService: jest.Mocked<VideoProcessorService>;
  let fileStorageService: jest.Mocked<FileStorageService>;
  let webhookNotificationService: jest.Mocked<WebhookNotificationService>;

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

    const mockVideoProcessorService = {
      extractFrames: jest.fn(),
    };

    const mockFileStorageService = {
      saveFile: jest.fn(),
      deleteFile: jest.fn(),
      fileExists: jest.fn(),
      getFileSize: jest.fn(),
      createZip: jest.fn(),
    };

    const mockWebhookNotificationService = {
      sendSuccessNotification: jest.fn(),
      sendFailureNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessVideoUseCase,
        {
          provide: 'VideoFileRepository',
          useValue: mockVideoFileRepository,
        },
        {
          provide: 'ProcessingResultRepository',
          useValue: mockProcessingResultRepository,
        },
        {
          provide: 'VideoProcessorService',
          useValue: mockVideoProcessorService,
        },
        {
          provide: 'FileStorageService',
          useValue: mockFileStorageService,
        },
        {
          provide: WebhookNotificationService,
          useValue: mockWebhookNotificationService,
        },
      ],
    }).compile();

    useCase = module.get<ProcessVideoUseCase>(ProcessVideoUseCase);
    videoFileRepository = module.get('VideoFileRepository');
    processingResultRepository = module.get('ProcessingResultRepository');
    videoProcessorService = module.get('VideoProcessorService');
    fileStorageService = module.get('FileStorageService');
    webhookNotificationService = module.get(WebhookNotificationService);
  });

  describe('execute', () => {
    it('should throw error when no video file IDs provided', async () => {
      await expect(useCase.execute([])).rejects.toThrow(
        'At least one video file ID is required',
      );
    });

    it('should throw error when more than 3 video files provided', async () => {
      const videoFileIds = ['1', '2', '3', '4'];
      await expect(useCase.execute(videoFileIds)).rejects.toThrow(
        'Maximum of 3 videos can be processed simultaneously',
      );
    });

    it('should throw VideoFileNotFoundException when video file not found', async () => {
      const videoFileIds = ['non-existent-id'];
      videoFileRepository.findById.mockResolvedValue(null);

      await expect(useCase.execute(videoFileIds)).rejects.toThrow(
        VideoFileNotFoundException,
      );
    });

    it('should process single video successfully', async () => {
      const mockVideo = VideoFile.create(
        'test.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        'user-123',
      );
      const mockResult = ProcessingResult.create(
        'video-id',
        'outputs/frames.zip',
        10,
        ['frame1.png'],
      );

      videoFileRepository.findById.mockResolvedValue(mockVideo);
      videoFileRepository.update.mockResolvedValue(mockVideo);
      videoProcessorService.extractFrames.mockResolvedValue([
        'temp/frame1.png',
      ]);
      fileStorageService.createZip.mockResolvedValue();
      fileStorageService.deleteFile.mockResolvedValue();
      processingResultRepository.save.mockResolvedValue(mockResult);
      webhookNotificationService.sendSuccessNotification.mockResolvedValue();

      const result = await useCase.execute([mockVideo.getId()]);

      expect(result).toHaveLength(1);
      expect(videoFileRepository.update).toHaveBeenCalledTimes(2); // processing + completed
      expect(
        webhookNotificationService.sendSuccessNotification,
      ).toHaveBeenCalled();
    });

    it('should handle processing failures and mark videos as failed', async () => {
      const mockVideo = VideoFile.create(
        'test.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        'user-123',
      );

      videoFileRepository.findById.mockResolvedValue(mockVideo);
      videoFileRepository.update.mockResolvedValue(mockVideo);
      videoProcessorService.extractFrames.mockRejectedValue(
        new Error('Processing failed'),
      );
      webhookNotificationService.sendFailureNotification.mockResolvedValue();

      await expect(useCase.execute([mockVideo.getId()])).rejects.toThrow(
        VideoProcessingException,
      );
      expect(
        webhookNotificationService.sendFailureNotification,
      ).toHaveBeenCalled();
    });
  });

  describe('executeSingle', () => {
    it('should execute single video processing', async () => {
      const mockVideo = VideoFile.create(
        'test.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        'user-123',
      );
      const mockResult = ProcessingResult.create(
        'video-id',
        'outputs/frames.zip',
        10,
        ['frame1.png'],
      );

      videoFileRepository.findById.mockResolvedValue(mockVideo);
      videoFileRepository.update.mockResolvedValue(mockVideo);
      videoProcessorService.extractFrames.mockResolvedValue([
        'temp/frame1.png',
      ]);
      fileStorageService.createZip.mockResolvedValue();
      fileStorageService.deleteFile.mockResolvedValue();
      processingResultRepository.save.mockResolvedValue(mockResult);
      webhookNotificationService.sendSuccessNotification.mockResolvedValue();

      const result = await useCase.executeSingle(mockVideo.getId());

      expect(result).toBe(mockResult);
    });

    it('should handle mixed processing states when error occurs', async () => {
      const videoFile1 = VideoFile.create(
        'test1.mp4',
        'stored1.mp4',
        '.mp4',
        1024,
        new Date(),
        'user-123',
      );
      const videoFile2 = VideoFile.create(
        'test2.mp4',
        'stored2.mp4',
        '.mp4',
        1024,
        new Date(),
        'user-123',
      );

      // Mock the repositories to avoid actual state changes
      videoFileRepository.findById.mockImplementation((id) => {
        if (id === videoFile1.getId()) return Promise.resolve(videoFile1);
        if (id === videoFile2.getId()) return Promise.resolve(videoFile2);
        return Promise.resolve(null);
      });
      videoFileRepository.update.mockResolvedValue(videoFile1);

      // Mock isProcessing to simulate different states after processing starts
      jest.spyOn(videoFile1, 'isProcessing').mockReturnValue(true);
      jest.spyOn(videoFile2, 'isProcessing').mockReturnValue(false);

      videoProcessorService.extractFrames.mockRejectedValue(
        new Error('Processing failed'),
      );

      await expect(
        useCase.execute([videoFile1.getId(), videoFile2.getId()]),
      ).rejects.toThrow(VideoProcessingException);

      // Should only send failure notification for the processing video
      expect(
        webhookNotificationService.sendFailureNotification,
      ).toHaveBeenCalledWith(
        videoFile1.getId(),
        videoFile1.getUserId(),
        videoFile1.getOriginalName(),
        'Processing failed',
        expect.any(Date),
      );

      // Should process exactly one failure notification (only for processing video)
      expect(
        webhookNotificationService.sendFailureNotification,
      ).toHaveBeenCalledTimes(1);
    });

    it('should handle case when no frames extracted from video', async () => {
      const videoFile = VideoFile.create(
        'test.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        new Date(),
        'user-123',
      );

      videoFileRepository.findById.mockResolvedValue(videoFile);
      videoFileRepository.update.mockResolvedValue(videoFile);
      // Mock extractFrames to return empty array after video is marked as processing
      videoProcessorService.extractFrames.mockResolvedValue([]); // No frames
      // Mock other required services
      fileStorageService.createZip.mockResolvedValue();
      webhookNotificationService.sendFailureNotification.mockResolvedValue();

      await expect(useCase.execute([videoFile.getId()])).rejects.toThrow(
        VideoProcessingException,
      );

      // Create a fresh video file for the second test call
      const videoFile2 = VideoFile.create(
        'test.mp4',
        'stored.mp4',
        '.mp4',
        1024,
        new Date(),
        'user-123',
      );
      videoFileRepository.findById.mockResolvedValue(videoFile2);

      await expect(useCase.execute([videoFile2.getId()])).rejects.toThrow(
        'No frames were extracted from video: test.mp4',
      );
    });

    it('should validate maximum video limit', async () => {
      const videoIds = ['id1', 'id2', 'id3', 'id4']; // 4 videos (exceeds limit of 3)

      await expect(useCase.execute(videoIds)).rejects.toThrow(
        'Maximum of 3 videos can be processed simultaneously',
      );
    });

    it('should validate empty video file IDs', async () => {
      await expect(useCase.execute([])).rejects.toThrow(
        'At least one video file ID is required',
      );
    });
  });
});
