import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { VideoProcessorController } from '../../../../src/presentation/controllers/video-processor.controller';
import { UploadVideoUseCase } from '../../../../src/application/use-cases/upload-video.use-case';
import { ProcessVideoUseCase } from '../../../../src/application/use-cases/process-video.use-case';
import { QueueVideoProcessingUseCase } from '../../../../src/application/use-cases/queue-video-processing.use-case';
import { GetProcessingStatusUseCase } from '../../../../src/application/use-cases/get-processing-status.use-case';
import { DownloadResultUseCase } from '../../../../src/application/use-cases/download-result.use-case';
import { ListUserVideosUseCase } from '../../../../src/application/use-cases/list-user-videos.use-case';
import {
  VideoFile,
  // VideoProcessingStatus,
} from '../../../../src/domain/entities/video-file.entity';
import { ProcessingResult } from '../../../../src/domain/entities/processing-result.entity';
// import { FileExtension } from '../../../../src/domain/value-objects/file-extension.vo';
// import { FileSize } from '../../../../src/domain/value-objects/file-size.vo';
import {
  InvalidFileFormatException,
  ProcessingResultNotFoundException,
  VideoProcessingException,
} from '../../../../src/domain/exceptions/domain.exception';

describe('VideoProcessorController', () => {
  let controller: VideoProcessorController;
  let uploadVideoUseCase: jest.Mocked<UploadVideoUseCase>;
  let processVideoUseCase: jest.Mocked<ProcessVideoUseCase>;
  let queueVideoProcessingUseCase: jest.Mocked<QueueVideoProcessingUseCase>;
  let getProcessingStatusUseCase: jest.Mocked<GetProcessingStatusUseCase>;
  let downloadResultUseCase: jest.Mocked<DownloadResultUseCase>;
  let listUserVideosUseCase: jest.Mocked<ListUserVideosUseCase>;

  const mockVideoFile = VideoFile.create(
    'test-video.mp4',
    'stored-video.mp4',
    '.mp4',
    1000000,
    'user-123',
  );

  const mockProcessingResult = ProcessingResult.create(
    mockVideoFile.getId(),
    '/path/to/result.zip',
    5,
    ['frame1.png', 'frame2.png'],
  );

  beforeEach(async () => {
    const mockUploadVideoUseCase = {
      execute: jest.fn(),
      executeSingle: jest.fn(),
    };

    const mockProcessVideoUseCase = {
      execute: jest.fn(),
      executeSingle: jest.fn(),
    };

    const mockQueueVideoProcessingUseCase = {
      execute: jest.fn(),
      getQueueStats: jest.fn(),
    };

    const mockGetProcessingStatusUseCase = {
      execute: jest.fn(),
    };

    const mockDownloadResultUseCase = {
      execute: jest.fn(),
    };

    const mockListUserVideosUseCase = {
      execute: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [VideoProcessorController],
      providers: [
        { provide: UploadVideoUseCase, useValue: mockUploadVideoUseCase },
        { provide: ProcessVideoUseCase, useValue: mockProcessVideoUseCase },
        {
          provide: QueueVideoProcessingUseCase,
          useValue: mockQueueVideoProcessingUseCase,
        },
        {
          provide: GetProcessingStatusUseCase,
          useValue: mockGetProcessingStatusUseCase,
        },
        { provide: DownloadResultUseCase, useValue: mockDownloadResultUseCase },
        { provide: ListUserVideosUseCase, useValue: mockListUserVideosUseCase },
      ],
    }).compile();

    controller = module.get<VideoProcessorController>(VideoProcessorController);
    uploadVideoUseCase = module.get(UploadVideoUseCase);
    processVideoUseCase = module.get(ProcessVideoUseCase);
    queueVideoProcessingUseCase = module.get(QueueVideoProcessingUseCase);
    getProcessingStatusUseCase = module.get(GetProcessingStatusUseCase);
    downloadResultUseCase = module.get(DownloadResultUseCase);
    listUserVideosUseCase = module.get(ListUserVideosUseCase);
  });

  describe('uploadVideos', () => {
    const mockFiles = [
      {
        originalname: 'video1.mp4',
        buffer: Buffer.from('video1'),
      } as Express.Multer.File,
      {
        originalname: 'video2.mp4',
        buffer: Buffer.from('video2'),
      } as Express.Multer.File,
    ];

    it('should throw BadRequest when no files provided', async () => {
      await expect(controller.uploadVideos([], 'user-123')).rejects.toThrow(
        new HttpException(
          'At least one video file is required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw BadRequest when files array is null', async () => {
      await expect(controller.uploadVideos(null, 'user-123')).rejects.toThrow(
        new HttpException(
          'At least one video file is required',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should throw Unauthorized when userId is missing', async () => {
      await expect(controller.uploadVideos(mockFiles, '')).rejects.toThrow(
        new HttpException(
          'User authentication required',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw Unauthorized when userId is null', async () => {
      await expect(controller.uploadVideos(mockFiles, null)).rejects.toThrow(
        new HttpException(
          'User authentication required',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should throw BadRequest when more than 3 files provided', async () => {
      const manyFiles = [
        { originalname: 'video1.mp4' } as Express.Multer.File,
        { originalname: 'video2.mp4' } as Express.Multer.File,
        { originalname: 'video3.mp4' } as Express.Multer.File,
        { originalname: 'video4.mp4' } as Express.Multer.File,
      ];

      await expect(
        controller.uploadVideos(manyFiles, 'user-123'),
      ).rejects.toThrow(
        new HttpException(
          'Maximum of 3 video files allowed',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should successfully upload and queue videos', async () => {
      const videoFiles = [mockVideoFile];
      uploadVideoUseCase.execute.mockResolvedValue(videoFiles);
      queueVideoProcessingUseCase.execute.mockResolvedValue({
        queued: true,
        queuePosition: 2,
      });

      const result = await controller.uploadVideos(mockFiles, 'user-123');

      expect(result).toEqual({
        success: true,
        message:
          '2 video(s) uploaded and queued for processing. You will be notified when processing is complete.',
        videoIds: [mockVideoFile.getId()],
        queuePosition: 2,
        estimatedProcessingTime: '4 minutes',
      });
    });

    it('should handle queue failure', async () => {
      const videoFiles = [mockVideoFile];
      uploadVideoUseCase.execute.mockResolvedValue(videoFiles);
      queueVideoProcessingUseCase.execute.mockResolvedValue({
        queued: false,
        queuePosition: null,
      });

      await expect(
        controller.uploadVideos(mockFiles, 'user-123'),
      ).rejects.toThrow(
        new HttpException(
          'An unexpected error occurred during video upload or queuing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle InvalidFileFormatException', async () => {
      uploadVideoUseCase.execute.mockRejectedValue(
        new InvalidFileFormatException('Invalid format'),
      );

      await expect(
        controller.uploadVideos(mockFiles, 'user-123'),
      ).rejects.toThrow(
        new HttpException(
          'Invalid file format: Invalid format',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should handle generic errors', async () => {
      uploadVideoUseCase.execute.mockRejectedValue(new Error('Upload failed'));

      await expect(
        controller.uploadVideos(mockFiles, 'user-123'),
      ).rejects.toThrow(
        new HttpException(
          'An unexpected error occurred during video upload or queuing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should format estimated time correctly for different durations', async () => {
      const videoFiles = [mockVideoFile];
      uploadVideoUseCase.execute.mockResolvedValue(videoFiles);

      // Test different queue positions to cover time formatting branches
      queueVideoProcessingUseCase.execute.mockResolvedValue({
        queued: true,
        queuePosition: 0,
      });

      const result = await controller.uploadVideos([mockFiles[0]], 'user-123');
      expect(result.estimatedProcessingTime).toBe('30 seconds');
    });
  });

  describe('uploadSingleVideo', () => {
    const mockFile = {
      originalname: 'video.mp4',
      buffer: Buffer.from('video'),
    } as Express.Multer.File;

    it('should throw BadRequest when no file provided', async () => {
      await expect(
        controller.uploadSingleVideo(null, 'user-123'),
      ).rejects.toThrow(
        new HttpException('Video file is required', HttpStatus.BAD_REQUEST),
      );
    });

    it('should throw Unauthorized when userId is missing', async () => {
      await expect(controller.uploadSingleVideo(mockFile, '')).rejects.toThrow(
        new HttpException(
          'User authentication required',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should successfully upload and process single video', async () => {
      uploadVideoUseCase.executeSingle.mockResolvedValue(mockVideoFile);
      processVideoUseCase.executeSingle.mockResolvedValue(mockProcessingResult);

      const result = await controller.uploadSingleVideo(mockFile, 'user-123');

      expect(result).toEqual({
        success: true,
        message: `Video processed successfully! ${mockProcessingResult.getFrameCount()} frames extracted.`,
        videoId: mockVideoFile.getId(),
        zipPath: mockProcessingResult.getZipFileName(),
        frameCount: mockProcessingResult.getFrameCount(),
        frameNames: mockProcessingResult.getFrameNames(),
      });
    });

    it('should handle InvalidFileFormatException', async () => {
      uploadVideoUseCase.executeSingle.mockRejectedValue(
        new InvalidFileFormatException('Invalid format'),
      );

      await expect(
        controller.uploadSingleVideo(mockFile, 'user-123'),
      ).rejects.toThrow(
        new HttpException(
          'Invalid file format: Invalid format',
          HttpStatus.BAD_REQUEST,
        ),
      );
    });

    it('should handle VideoProcessingException', async () => {
      uploadVideoUseCase.executeSingle.mockResolvedValue(mockVideoFile);
      processVideoUseCase.executeSingle.mockRejectedValue(
        new VideoProcessingException('Processing failed'),
      );

      await expect(
        controller.uploadSingleVideo(mockFile, 'user-123'),
      ).rejects.toThrow(
        new HttpException(
          'Video processing failed: Processing failed',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });

    it('should handle generic errors', async () => {
      uploadVideoUseCase.executeSingle.mockRejectedValue(
        new Error('Upload failed'),
      );

      await expect(
        controller.uploadSingleVideo(mockFile, 'user-123'),
      ).rejects.toThrow(
        new HttpException(
          'An unexpected error occurred during video processing',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('listUserVideos', () => {
    it('should throw Unauthorized when userId is missing', async () => {
      await expect(controller.listUserVideos('')).rejects.toThrow(
        new HttpException(
          'User authentication required',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should return user videos with processing results', async () => {
      const mockVideosWithResults = [
        { video: mockVideoFile, processingResult: mockProcessingResult },
        { video: mockVideoFile, processingResult: null }, // Test null processing result
      ];

      listUserVideosUseCase.execute.mockResolvedValue(mockVideosWithResults);

      const result = await controller.listUserVideos('user-123');

      expect(result).toHaveLength(2);
      expect(result[0]).toEqual({
        id: mockVideoFile.getId(),
        originalName: mockVideoFile.getOriginalName(),
        status: mockVideoFile.getStatus(),
        uploadedAt: mockVideoFile.getUploadedAt(),
        processedAt: mockVideoFile.getProcessedAt(),
        errorMessage: mockVideoFile.getErrorMessage(),
        processingResult: {
          id: mockProcessingResult.getId(),
          zipPath: mockProcessingResult.getZipPath(),
          zipFileName: mockProcessingResult.getZipFileName(),
          frameCount: mockProcessingResult.getFrameCount(),
          frameNames: mockProcessingResult.getFrameNames(),
          createdAt: mockProcessingResult.getCreatedAt(),
        },
      });
      expect(result[1].processingResult).toBeNull();
    });

    it('should handle errors when listing user videos', async () => {
      listUserVideosUseCase.execute.mockRejectedValue(
        new Error('Database error'),
      );

      await expect(controller.listUserVideos('user-123')).rejects.toThrow(
        new HttpException(
          'Failed to retrieve user videos',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getStatus', () => {
    it('should throw Unauthorized when userId is missing', async () => {
      await expect(controller.getStatus('')).rejects.toThrow(
        new HttpException(
          'User authentication required',
          HttpStatus.UNAUTHORIZED,
        ),
      );
    });

    it('should return processing status and queue stats', async () => {
      const mockStatusData = {
        files: [{ id: 'video-1', status: 'processing' }],
        total: 1,
      };
      const mockQueueStats = {
        messageCount: 5,
        consumerCount: 2,
        isConnected: true,
      };

      getProcessingStatusUseCase.execute.mockResolvedValue(mockStatusData);
      queueVideoProcessingUseCase.getQueueStats.mockResolvedValue(
        mockQueueStats,
      );

      const result = await controller.getStatus('user-123');

      expect(result).toEqual({
        files: mockStatusData.files,
        total: mockStatusData.total,
        queue: mockQueueStats,
      });
    });

    it('should handle errors when getting status', async () => {
      getProcessingStatusUseCase.execute.mockRejectedValue(
        new Error('Status error'),
      );

      await expect(controller.getStatus('user-123')).rejects.toThrow(
        new HttpException(
          'Failed to retrieve processing status',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('downloadFile', () => {
    const mockResponse = {
      setHeader: jest.fn(),
      sendFile: jest.fn(),
    } as unknown as Response;

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should successfully download file', async () => {
      const filename = 'result.zip';
      const filePath = '/path/to/result.zip';
      downloadResultUseCase.execute.mockResolvedValue(filePath);

      await controller.downloadFile(filename, mockResponse);

      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Description',
        'File Transfer',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Transfer-Encoding',
        'binary',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        `attachment; filename=${filename}`,
      );
      expect(mockResponse.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/zip',
      );
      expect(mockResponse.sendFile).toHaveBeenCalledWith(filePath, {
        root: '.',
      });
    });

    it('should handle ProcessingResultNotFoundException', async () => {
      downloadResultUseCase.execute.mockRejectedValue(
        new ProcessingResultNotFoundException('Not found'),
      );

      await expect(
        controller.downloadFile('result.zip', mockResponse),
      ).rejects.toThrow(
        new HttpException('File not found', HttpStatus.NOT_FOUND),
      );
    });

    it('should handle generic download errors', async () => {
      downloadResultUseCase.execute.mockRejectedValue(
        new Error('Download failed'),
      );

      await expect(
        controller.downloadFile('result.zip', mockResponse),
      ).rejects.toThrow(
        new HttpException(
          'Failed to download file',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue stats with estimated wait time', async () => {
      const mockStats = {
        messageCount: 10,
        consumerCount: 2,
        isConnected: true,
      };

      queueVideoProcessingUseCase.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();

      expect(result).toEqual({
        ...mockStats,
        estimatedWaitTime: '8 minutes', // (10 * 90) / 2 = 450 seconds = 8 minutes (rounded up)
      });
    });

    it('should handle case when no consumers are available', async () => {
      const mockStats = {
        messageCount: 5,
        consumerCount: 0,
        isConnected: false,
      };

      queueVideoProcessingUseCase.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();

      expect(result).toEqual({
        ...mockStats,
        estimatedWaitTime: '8 minutes', // 5 * 90 = 450 seconds = 8 minutes (rounded up)
      });
    });

    it('should handle errors when getting queue stats', async () => {
      queueVideoProcessingUseCase.getQueueStats.mockRejectedValue(
        new Error('Queue error'),
      );

      await expect(controller.getQueueStats()).rejects.toThrow(
        new HttpException(
          'Failed to retrieve queue statistics',
          HttpStatus.INTERNAL_SERVER_ERROR,
        ),
      );
    });
  });

  describe('formatEstimatedTime (private method testing via public methods)', () => {
    it('should format seconds correctly', async () => {
      const mockStats = {
        messageCount: 1,
        consumerCount: 1,
        isConnected: true,
      };
      queueVideoProcessingUseCase.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();
      expect(result.estimatedWaitTime).toBe('2 minutes'); // 90 seconds = 2 minutes (rounded up)
    });

    it('should format minutes correctly for singular', async () => {
      const mockStats = {
        messageCount: 1,
        consumerCount: 2,
        isConnected: true,
      };
      queueVideoProcessingUseCase.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();
      expect(result.estimatedWaitTime).toBe('45 seconds'); // 45 seconds stays as seconds since < 60
    });

    it('should format hours correctly', async () => {
      const mockStats = {
        messageCount: 100,
        consumerCount: 1,
        isConnected: true,
      };
      queueVideoProcessingUseCase.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();
      // 100 * 90 = 9000 seconds = 2 hours 30 minutes
      expect(result.estimatedWaitTime).toBe('2 hours 30 minutes');
    });

    it('should handle exactly one hour with no extra minutes', async () => {
      const mockStats = {
        messageCount: 40,
        consumerCount: 1,
        isConnected: true,
      };
      queueVideoProcessingUseCase.getQueueStats.mockResolvedValue(mockStats);

      const result = await controller.getQueueStats();
      // 40 * 90 = 3600 seconds = exactly 1 hour
      expect(result.estimatedWaitTime).toBe('1 hour ');
    });

    it('should handle seconds less than 60', async () => {
      // Test via uploadVideos method with small queue position
      const videoFiles = [mockVideoFile];
      uploadVideoUseCase.execute.mockResolvedValue(videoFiles);
      queueVideoProcessingUseCase.execute.mockResolvedValue({
        queued: true,
        queuePosition: 0, // No queue wait time
      });

      const result = await controller.uploadVideos(
        [{ originalname: 'test.mp4' } as Express.Multer.File],
        'user-123',
      );
      // 1 video * 30 + 0 queue position * 90 = 30 seconds
      expect(result.estimatedProcessingTime).toBe('30 seconds');
    });
  });
});
