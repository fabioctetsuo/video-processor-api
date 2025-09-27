import { Injectable, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class MockVideoProcessingConsumer implements OnModuleInit {
  private readonly logger = new Logger(MockVideoProcessingConsumer.name);

  onModuleInit(): void {
    this.logger.log('Mock video processing consumer initialized');
  }

  getConsumerStats(): {
    queueStats: {
      messageCount: number;
      consumerCount: number;
    };
    isConnected: boolean;
  } {
    return {
      queueStats: {
        messageCount: 0,
        consumerCount: 1,
      },
      isConnected: true,
    };
  }
}
