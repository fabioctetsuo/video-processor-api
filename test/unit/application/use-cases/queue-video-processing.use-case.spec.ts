import { Test, TestingModule } from '@nestjs/testing';
import { QueueVideoProcessingUseCase } from '../../../../src/application/use-cases/queue-video-processing.use-case';
import { RabbitMQService } from '../../../../src/infrastructure/services/rabbitmq.service';
import { VIDEO_PROCESSING_QUEUE } from '../../../../src/shared/interfaces/message-queue.interface';

describe('QueueVideoProcessingUseCase', () => {
  let useCase: QueueVideoProcessingUseCase;
  let rabbitMQService: jest.Mocked<RabbitMQService>;

  beforeEach(async () => {
    const mockRabbitMQService = {
      publishMessage: jest.fn(),
      getQueueStats: jest.fn(),
      isConnected: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      setupQueues: jest.fn(),
      sendMessage: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueueVideoProcessingUseCase,
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
      ],
    }).compile();

    useCase = module.get<QueueVideoProcessingUseCase>(
      QueueVideoProcessingUseCase,
    );
    rabbitMQService = module.get(RabbitMQService);
  });

  describe('execute', () => {
    it('should queue video processing successfully with queue position', async () => {
      const videoFileIds = ['video-1', 'video-2'];
      const priority = 1;
      const mockQueueStats = { messageCount: 5, consumerCount: 2 };

      rabbitMQService.publishMessage.mockResolvedValue(true);
      rabbitMQService.getQueueStats.mockResolvedValue(mockQueueStats);

      const result = await useCase.execute(videoFileIds, priority);

      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(
        VIDEO_PROCESSING_QUEUE,
        expect.objectContaining({
          videoFileIds,
          priority,
          maxRetries: 3,
          timestamp: expect.any(Date),
        }),
      );

      expect(rabbitMQService.getQueueStats).toHaveBeenCalledWith(
        VIDEO_PROCESSING_QUEUE,
      );

      expect(result).toEqual({
        queued: true,
        queuePosition: 5,
      });
    });

    it('should queue video processing with default priority', async () => {
      const videoFileIds = ['video-1'];
      const mockQueueStats = { messageCount: 3, consumerCount: 1 };

      rabbitMQService.publishMessage.mockResolvedValue(true);
      rabbitMQService.getQueueStats.mockResolvedValue(mockQueueStats);

      const result = await useCase.execute(videoFileIds);

      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(
        VIDEO_PROCESSING_QUEUE,
        expect.objectContaining({
          videoFileIds,
          priority: 1, // default priority
          maxRetries: 3,
        }),
      );

      expect(result.queued).toBe(true);
      expect(result.queuePosition).toBe(3);
    });

    it('should handle queue stats error and still return success', async () => {
      const videoFileIds = ['video-1'];

      rabbitMQService.publishMessage.mockResolvedValue(true);
      rabbitMQService.getQueueStats.mockRejectedValue(
        new Error('Queue stats error'),
      );

      const result = await useCase.execute(videoFileIds);

      expect(result).toEqual({ queued: true });
    });

    it('should return failure when publish message fails', async () => {
      const videoFileIds = ['video-1'];

      rabbitMQService.publishMessage.mockResolvedValue(false);

      const result = await useCase.execute(videoFileIds);

      expect(result).toEqual({ queued: false });
      expect(rabbitMQService.getQueueStats).not.toHaveBeenCalled();
    });

    it('should handle publish message error', async () => {
      const videoFileIds = ['video-1'];
      const error = new Error('Publish error');

      rabbitMQService.publishMessage.mockRejectedValue(error);

      await expect(useCase.execute(videoFileIds)).rejects.toThrow(
        'Publish error',
      );
    });

    it('should handle empty video file IDs array', async () => {
      const videoFileIds: string[] = [];
      const mockQueueStats = { messageCount: 0, consumerCount: 1 };

      rabbitMQService.publishMessage.mockResolvedValue(true);
      rabbitMQService.getQueueStats.mockResolvedValue(mockQueueStats);

      const result = await useCase.execute(videoFileIds);

      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(
        VIDEO_PROCESSING_QUEUE,
        expect.objectContaining({
          videoFileIds: [],
          priority: 1,
        }),
      );

      expect(result.queued).toBe(true);
    });

    it('should handle custom priority', async () => {
      const videoFileIds = ['video-1'];
      const priority = 5;
      const mockQueueStats = { messageCount: 2, consumerCount: 1 };

      rabbitMQService.publishMessage.mockResolvedValue(true);
      rabbitMQService.getQueueStats.mockResolvedValue(mockQueueStats);

      await useCase.execute(videoFileIds, priority);

      expect(rabbitMQService.publishMessage).toHaveBeenCalledWith(
        VIDEO_PROCESSING_QUEUE,
        expect.objectContaining({
          priority: 5,
        }),
      );
    });
  });

  describe('getQueueStats', () => {
    it('should return queue stats with connection status when successful', async () => {
      const mockStats = { messageCount: 10, consumerCount: 2 };

      rabbitMQService.getQueueStats.mockResolvedValue(mockStats);
      rabbitMQService.isConnected.mockReturnValue(true);

      const result = await useCase.getQueueStats();

      expect(rabbitMQService.getQueueStats).toHaveBeenCalledWith(
        VIDEO_PROCESSING_QUEUE,
      );
      expect(result).toEqual({
        messageCount: 10,
        consumerCount: 2,
        isConnected: true,
      });
    });

    it('should return disconnected stats when getQueueStats fails', async () => {
      rabbitMQService.getQueueStats.mockRejectedValue(new Error('Queue error'));
      rabbitMQService.isConnected.mockReturnValue(false);

      const result = await useCase.getQueueStats();

      expect(result).toEqual({
        messageCount: 0,
        consumerCount: 0,
        isConnected: false,
      });
    });

    it('should return queue stats with connection status false', async () => {
      const mockStats = { messageCount: 5, consumerCount: 1 };

      rabbitMQService.getQueueStats.mockResolvedValue(mockStats);
      rabbitMQService.isConnected.mockReturnValue(false);

      const result = await useCase.getQueueStats();

      expect(result).toEqual({
        messageCount: 5,
        consumerCount: 1,
        isConnected: false,
      });
    });

    it('should handle queue stats error gracefully', async () => {
      rabbitMQService.getQueueStats.mockRejectedValue(
        new Error('Connection lost'),
      );

      const result = await useCase.getQueueStats();

      expect(result.messageCount).toBe(0);
      expect(result.consumerCount).toBe(0);
      expect(result.isConnected).toBe(false);
    });
  });
});
