import { Test, TestingModule } from '@nestjs/testing';
import { VideoProcessingConsumer } from '../../../../src/application/consumers/video-processing.consumer';
import { ProcessVideoUseCase } from '../../../../src/application/use-cases/process-video.use-case';
import { RabbitMQService } from '../../../../src/infrastructure/services/rabbitmq.service';

describe('VideoProcessingConsumer', () => {
  let consumer: VideoProcessingConsumer;
  let processVideoUseCase: jest.Mocked<ProcessVideoUseCase>;
  let rabbitMQService: jest.Mocked<RabbitMQService>;

  beforeEach(async () => {
    const mockProcessVideoUseCase = {
      execute: jest.fn(),
      executeSingle: jest.fn(),
    };

    const mockRabbitMQService = {
      isConnected: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      getQueueStats: jest.fn(),
      publishMessage: jest.fn(),
      setupQueues: jest.fn(),
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VideoProcessingConsumer,
        {
          provide: ProcessVideoUseCase,
          useValue: mockProcessVideoUseCase,
        },
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    consumer = module.get<VideoProcessingConsumer>(VideoProcessingConsumer);
    processVideoUseCase = module.get(ProcessVideoUseCase);
    rabbitMQService = module.get(RabbitMQService);
  });

  describe('getConsumerStats', () => {
    it('should return consumer stats when connected', async () => {
      const mockQueueStats = { messageCount: 5, consumerCount: 1 };
      rabbitMQService.getQueueStats.mockResolvedValue(mockQueueStats);
      rabbitMQService.isConnected.mockReturnValue(true);

      const result = await consumer.getConsumerStats();

      expect(result).toEqual({
        isConnected: true,
        queueStats: mockQueueStats,
      });
    });

    it('should return disconnected stats when not connected', async () => {
      rabbitMQService.isConnected.mockReturnValue(false);
      rabbitMQService.getQueueStats.mockRejectedValue(
        new Error('Not connected'),
      );

      const result = await consumer.getConsumerStats();

      expect(result).toEqual({
        isConnected: false,
        queueStats: null,
      });
    });

    it('should handle getQueueStats errors', async () => {
      rabbitMQService.isConnected.mockReturnValue(false);
      rabbitMQService.getQueueStats.mockRejectedValue(new Error('Queue error'));

      const result = await consumer.getConsumerStats();

      expect(result).toEqual({
        isConnected: false,
        queueStats: null,
      });
    });

    it('should handle successful queue stats retrieval when connected', async () => {
      const mockQueueStats = { messageCount: 10, consumerCount: 2 };
      rabbitMQService.isConnected.mockReturnValue(true);
      rabbitMQService.getQueueStats.mockResolvedValue(mockQueueStats);

      const result = await consumer.getConsumerStats();

      expect(result).toEqual({
        isConnected: true,
        queueStats: mockQueueStats,
      });
    });
  });

  describe('processVideoMessage', () => {
    it('should process video messages successfully', async () => {
      const mockMessage = {
        videoFileIds: ['video-1', 'video-2'],
        priority: 'high' as const,
        retryCount: 0,
      };

      const mockResults = [
        {
          getVideoFileId: () => 'video-1',
          getZipFileName: () => 'result1.zip',
          getFrameCount: () => 10,
          getFrameNames: () => ['frame1.png'],
        },
        {
          getVideoFileId: () => 'video-2',
          getZipFileName: () => 'result2.zip',
          getFrameCount: () => 15,
          getFrameNames: () => ['frame2.png'],
        },
      ];

      processVideoUseCase.execute.mockResolvedValue(mockResults);
      rabbitMQService.publishMessage.mockResolvedValue(true);

      // Call the private method through reflection for testing
      const processMethod = (consumer as any).processVideoMessage.bind(
        consumer,
      );
      await processMethod(mockMessage);

      expect(processVideoUseCase.execute).toHaveBeenCalledWith([
        'video-1',
        'video-2',
      ]);
      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(
        'video.processing.results',
        expect.objectContaining({
          videoFileIds: ['video-1', 'video-2'],
          status: 'completed',
          results: expect.arrayContaining([
            expect.objectContaining({
              videoId: 'video-1',
              zipPath: 'result1.zip',
              frameCount: 10,
            }),
          ]),
        }),
      );
    });

    it('should handle processing errors and publish failure message', async () => {
      const mockMessage = {
        videoFileIds: ['video-1'],
        priority: 'normal' as const,
        retryCount: 0,
      };

      const error = new Error('Processing failed');
      processVideoUseCase.execute.mockRejectedValue(error);
      rabbitMQService.publishMessage.mockResolvedValue(true);

      const processMethod = (consumer as any).processVideoMessage.bind(
        consumer,
      );

      await expect(processMethod(mockMessage)).rejects.toThrow(
        'Processing failed',
      );

      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(
        'video.processing.results',
        expect.objectContaining({
          videoFileIds: ['video-1'],
          status: 'failed',
          error: 'Processing failed',
          results: [],
        }),
      );
    });

    it('should handle publish failure errors gracefully', async () => {
      const mockMessage = {
        videoFileIds: ['video-1'],
        priority: 'normal' as const,
        retryCount: 0,
      };

      const error = new Error('Processing failed');
      processVideoUseCase.execute.mockRejectedValue(error);
      rabbitMQService.publishMessage.mockRejectedValue(
        new Error('Publish failed'),
      );

      const processMethod = (consumer as any).processVideoMessage.bind(
        consumer,
      );

      // Should still throw the original error
      await expect(processMethod(mockMessage)).rejects.toThrow(
        'Processing failed',
      );
    });
  });
});
