import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import {
  MessageQueueService,
  QueueStats,
} from '../../../shared/interfaces/message-queue.interface';

@Injectable()
export class MockRabbitMQService
  implements MessageQueueService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(MockRabbitMQService.name);
  private connected = true;
  private messageCount = 0;

  onModuleInit(): void {
    this.logger.log('Mock RabbitMQ service initialized');
  }

  onModuleDestroy(): void {
    this.logger.log('Mock RabbitMQ service destroyed');
  }

  connect(): Promise<void> {
    this.logger.log('Mock RabbitMQ connection established');
    return Promise.resolve();
  }

  disconnect(): Promise<void> {
    this.logger.log('Mock RabbitMQ connection closed');
    return Promise.resolve();
  }

  publishMessage(queue: string, message: unknown): Promise<boolean> {
    this.logger.debug(`Mock message published to queue ${queue}:`, message);
    this.messageCount++;
    return Promise.resolve(true);
  }

  consumeMessages(
    queue: string,
    callback: (message: unknown) => Promise<void>,
  ): Promise<void> {
    this.logger.debug(`Mock consumer started for queue ${queue}`);
    // Store callback for potential testing usage
    void callback;
    return Promise.resolve();
  }

  isConnected(): boolean {
    return this.connected;
  }

  getQueueStats(queue: string): Promise<QueueStats> {
    // Store queue parameter for potential testing usage
    void queue;
    return Promise.resolve({
      messageCount: this.messageCount,
      consumerCount: 1,
    });
  }

  // Test helper methods
  setConnected(connected: boolean): void {
    this.connected = connected;
  }

  setMessageCount(count: number): void {
    this.messageCount = count;
  }

  resetMock(): void {
    this.connected = true;
    this.messageCount = 0;
  }
}
