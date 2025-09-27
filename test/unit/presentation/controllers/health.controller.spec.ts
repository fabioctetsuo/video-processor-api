import { Test, TestingModule } from '@nestjs/testing';
import { HttpException, HttpStatus } from '@nestjs/common';
import { HealthController } from '../../../../src/presentation/controllers/health.controller';
import { RabbitMQService } from '../../../../src/infrastructure/services/rabbitmq.service';
import { VideoProcessingConsumer } from '../../../../src/application/consumers/video-processing.consumer';

describe('HealthController', () => {
  let controller: HealthController;
  let rabbitMQService: jest.Mocked<RabbitMQService>;
  let videoProcessingConsumer: jest.Mocked<VideoProcessingConsumer>;

  beforeEach(async () => {
    const mockRabbitMQService = {
      isConnected: jest.fn(),
      connect: jest.fn(),
      disconnect: jest.fn(),
      sendMessage: jest.fn(),
      setupQueues: jest.fn(),
      getQueueStats: jest.fn(),
    };

    const mockVideoProcessingConsumer = {
      getConsumerStats: jest.fn(),
      start: jest.fn(),
      stop: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
        {
          provide: VideoProcessingConsumer,
          useValue: mockVideoProcessingConsumer,
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
    rabbitMQService = module.get(RabbitMQService);
    videoProcessingConsumer = module.get(VideoProcessingConsumer);
  });

  describe('getHealth', () => {
    it('should return healthy status when all services are healthy', async () => {
      const mockConsumerStats = {
        isConnected: true,
        queueStats: { messageCount: 0, consumerCount: 1 },
      };

      rabbitMQService.isConnected.mockReturnValue(true);
      videoProcessingConsumer.getConsumerStats.mockResolvedValue(
        mockConsumerStats,
      );

      const result = await controller.getHealth();

      expect(result.status).toBe('healthy');
      expect(result.services.rabbitmq.status).toBe('healthy');
      expect(result.services.rabbitmq.connected).toBe(true);
      expect(result.services.consumer.status).toBe('healthy');
      expect(result.services.consumer.queueStats).toEqual(
        mockConsumerStats.queueStats,
      );
      expect(result.timestamp).toBeDefined();
    });

    it('should throw HttpException with 503 when RabbitMQ is unhealthy', async () => {
      const mockConsumerStats = {
        isConnected: true,
        queueStats: { messageCount: 0, consumerCount: 1 },
      };

      rabbitMQService.isConnected.mockReturnValue(false);
      videoProcessingConsumer.getConsumerStats.mockResolvedValue(
        mockConsumerStats,
      );

      await expect(controller.getHealth()).rejects.toThrow(HttpException);

      try {
        await controller.getHealth();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.services.rabbitmq.status).toBe('unhealthy');
        expect(response.services.consumer.status).toBe('healthy');
      }
    });

    it('should throw HttpException with 503 when consumer is unhealthy', async () => {
      const mockConsumerStats = {
        isConnected: false,
        queueStats: { messageCount: 0, consumerCount: 0 },
      };

      rabbitMQService.isConnected.mockReturnValue(true);
      videoProcessingConsumer.getConsumerStats.mockResolvedValue(
        mockConsumerStats,
      );

      await expect(controller.getHealth()).rejects.toThrow(HttpException);

      try {
        await controller.getHealth();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.services.rabbitmq.status).toBe('healthy');
        expect(response.services.consumer.status).toBe('unhealthy');
      }
    });

    it('should throw HttpException with 503 when both services are unhealthy', async () => {
      const mockConsumerStats = {
        isConnected: false,
        queueStats: { messageCount: 0, consumerCount: 0 },
      };

      rabbitMQService.isConnected.mockReturnValue(false);
      videoProcessingConsumer.getConsumerStats.mockResolvedValue(
        mockConsumerStats,
      );

      await expect(controller.getHealth()).rejects.toThrow(HttpException);

      try {
        await controller.getHealth();
      } catch (error) {
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.services.rabbitmq.status).toBe('unhealthy');
        expect(response.services.consumer.status).toBe('unhealthy');
      }
    });

    it('should handle consumer stats error and return 503', async () => {
      rabbitMQService.isConnected.mockReturnValue(true);
      videoProcessingConsumer.getConsumerStats.mockRejectedValue(
        new Error('Consumer error'),
      );

      await expect(controller.getHealth()).rejects.toThrow(HttpException);

      try {
        await controller.getHealth();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.error).toBe('Health check failed');
      }
    });

    it('should preserve HttpException when service throws it', async () => {
      rabbitMQService.isConnected.mockReturnValue(false);
      videoProcessingConsumer.getConsumerStats.mockResolvedValue({
        isConnected: true,
        queueStats: {},
      });

      await expect(controller.getHealth()).rejects.toThrow(HttpException);

      try {
        await controller.getHealth();
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('unhealthy');
        expect(response.services).toBeDefined();
      }
    });
  });

  describe('getReadiness', () => {
    it('should return ready status when RabbitMQ is connected', async () => {
      rabbitMQService.isConnected.mockReturnValue(true);

      const result = await controller.getReadiness();

      expect(result.status).toBe('ready');
      expect(result.ready).toBe(true);
    });

    it('should throw HttpException with 503 when RabbitMQ is not connected', async () => {
      rabbitMQService.isConnected.mockReturnValue(false);

      try {
        await controller.getReadiness();
        fail('Expected HttpException to be thrown');
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(
          HttpStatus.SERVICE_UNAVAILABLE,
        );
        const response = (error as HttpException).getResponse() as any;
        expect(response.status).toBe('not ready');
        expect(response.ready).toBe(false);
      }
    });
  });
});
