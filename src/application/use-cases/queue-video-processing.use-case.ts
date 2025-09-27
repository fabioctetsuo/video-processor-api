import { Injectable, Logger } from '@nestjs/common';
import { RabbitMQService } from '../../infrastructure/services/rabbitmq.service';
import {
  VideoProcessingMessage,
  VIDEO_PROCESSING_QUEUE,
} from '../../shared/interfaces/message-queue.interface';

@Injectable()
export class QueueVideoProcessingUseCase {
  private readonly logger = new Logger(QueueVideoProcessingUseCase.name);

  constructor(private readonly rabbitMQService: RabbitMQService) {}

  async execute(
    videoFileIds: string[],
    priority: number = 1,
  ): Promise<{ queued: boolean; queuePosition?: number }> {
    try {
      const message: VideoProcessingMessage = {
        videoFileIds,
        priority,
        timestamp: new Date(),
        maxRetries: 3,
      };

      const queued = await this.rabbitMQService.publishMessage(
        VIDEO_PROCESSING_QUEUE,
        message,
      );

      if (queued) {
        this.logger.log(
          `Queued ${videoFileIds.length} video(s) for processing with priority ${priority}`,
        );

        // Get current queue stats to estimate position
        try {
          const stats = await this.rabbitMQService.getQueueStats(
            VIDEO_PROCESSING_QUEUE,
          );
          return {
            queued: true,
            queuePosition: stats.messageCount,
          };
        } catch (error) {
          this.logger.warn(
            'Failed to get queue position:',
            (error as Error).message,
          );
          return { queued: true };
        }
      } else {
        this.logger.error(
          `Failed to queue ${videoFileIds.length} video(s) for processing`,
        );
        return { queued: false };
      }
    } catch (error) {
      this.logger.error(
        'Error queuing video processing:',
        (error as Error).message,
      );
      throw error;
    }
  }

  async getQueueStats(): Promise<{
    messageCount: number;
    consumerCount: number;
    isConnected: boolean;
  }> {
    try {
      const stats = await this.rabbitMQService.getQueueStats(
        VIDEO_PROCESSING_QUEUE,
      );
      return {
        ...stats,
        isConnected: this.rabbitMQService.isConnected(),
      };
    } catch (error) {
      this.logger.error('Failed to get queue stats:', (error as Error).message);
      return {
        messageCount: 0,
        consumerCount: 0,
        isConnected: false,
      };
    }
  }
}
