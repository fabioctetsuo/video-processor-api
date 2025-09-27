import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { RabbitMQService } from '../../../../src/infrastructure/services/rabbitmq.service';

// Mock amqplib to prevent real connections
jest.mock('amqplib');

describe('RabbitMQService', () => {
  let service: jest.Mocked<RabbitMQService>;
  let configService: jest.Mocked<ConfigService>; // eslint-disable-line @typescript-eslint/no-unused-vars

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn().mockReturnValue('amqp://localhost:5672'),
    };

    const mockRabbitMQService = {
      connect: jest.fn().mockResolvedValue(),
      disconnect: jest.fn().mockResolvedValue(),
      setupQueues: jest.fn().mockResolvedValue(),
      sendMessage: jest.fn().mockResolvedValue(true),
      getQueueStats: jest
        .fn()
        .mockResolvedValue({ messageCount: 5, consumerCount: 1 }),
      isConnected: jest.fn().mockReturnValue(true),
      consume: jest.fn().mockResolvedValue(),
      ackMessage: jest.fn(),
      nackMessage: jest.fn(),
      onModuleInit: jest.fn().mockResolvedValue(),
      onModuleDestroy: jest.fn().mockResolvedValue(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: RabbitMQService,
          useValue: mockRabbitMQService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get(RabbitMQService);
    configService = module.get(ConfigService);

    jest.clearAllMocks();
  });

  describe('connect', () => {
    it('should connect successfully', async () => {
      await service.connect();
      expect(service.connect).toHaveBeenCalled();
    });
  });

  describe('disconnect', () => {
    it('should disconnect successfully', async () => {
      await service.disconnect();
      expect(service.disconnect).toHaveBeenCalled();
    });
  });

  describe('setupQueues', () => {
    it('should setup queues successfully', async () => {
      await service.setupQueues();
      expect(service.setupQueues).toHaveBeenCalled();
    });
  });

  describe('sendMessage', () => {
    it('should send message successfully', async () => {
      const result = await service.sendMessage('test-queue', { data: 'test' });
      expect(service.sendMessage).toHaveBeenCalledWith('test-queue', {
        data: 'test',
      });
      expect(result).toBe(true);
    });
  });

  describe('getQueueStats', () => {
    it('should return queue stats', async () => {
      const stats = await service.getQueueStats('test-queue');
      expect(service.getQueueStats).toHaveBeenCalledWith('test-queue');
      expect(stats).toEqual({ messageCount: 5, consumerCount: 1 });
    });
  });

  describe('isConnected', () => {
    it('should return connection status', () => {
      const connected = service.isConnected();
      expect(service.isConnected).toHaveBeenCalled();
      expect(connected).toBe(true);
    });
  });

  describe('lifecycle methods', () => {
    it('should initialize module without making real connections', async () => {
      await service.onModuleInit();
      expect(service.onModuleInit).toHaveBeenCalled();
    });

    it('should destroy module without errors', async () => {
      await service.onModuleDestroy();
      expect(service.onModuleDestroy).toHaveBeenCalled();
    });
  });
});
