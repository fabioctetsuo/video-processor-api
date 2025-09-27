import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ProcessVideoUseCase } from '../use-cases/process-video.use-case';
import { RabbitMQService } from '../../infrastructure/services/rabbitmq.service';
import {
  VideoProcessingMessage,
  ProcessingResultMessage,
  VIDEO_PROCESSING_QUEUE,
  PROCESSING_RESULTS_QUEUE,
} from '../../shared/interfaces/message-queue.interface';

@Injectable()
export class VideoProcessingConsumer implements OnModuleInit {
  private readonly logger = new Logger(VideoProcessingConsumer.name);

  constructor(
    private readonly processVideoUseCase: ProcessVideoUseCase,
    private readonly rabbitMQService: RabbitMQService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Start consuming video processing messages
    await this.startConsuming();
  }

  private async startConsuming(): Promise<void> {
    try {
      await this.rabbitMQService.consumeMessages(
        VIDEO_PROCESSING_QUEUE,
        (message: VideoProcessingMessage) => this.processVideoMessage(message),
      );

      this.logger.log('Video processing consumer started successfully');
    } catch (error) {
      this.logger.error(
        'Failed to start video processing consumer:',
        (error as Error).message,
      );
      // Retry after a delay
      setTimeout(() => void this.startConsuming(), 10000);
    }
  }

  private async processVideoMessage(
    message: VideoProcessingMessage,
  ): Promise<void> {
    const startTime = Date.now();
    this.logger.log(
      `Processing video batch: ${message.videoFileIds.length} videos`,
    );

    try {
      // Process the videos using the existing use case
      const results = await this.processVideoUseCase.execute(
        message.videoFileIds,
      );

      // Create success result message
      const resultMessage: ProcessingResultMessage = {
        videoFileIds: message.videoFileIds,
        results: results.map((result) => ({
          videoId: result.getVideoFileId(),
          originalName: '', // Will be populated by the caller if needed
          zipPath: result.getZipFileName(),
          frameCount: result.getFrameCount(),
          frameNames: result.getFrameNames(),
        })),
        status: 'completed',
        timestamp: new Date(),
      };

      // Publish result to results queue
      await this.rabbitMQService.publishMessage(
        PROCESSING_RESULTS_QUEUE,
        resultMessage,
      );

      const processingTime = Date.now() - startTime;
      this.logger.log(
        `Video batch processed successfully in ${processingTime}ms: ${message.videoFileIds.length} videos`,
      );

      // Log processing statistics
      this.logProcessingStats(message, results.length, processingTime);
    } catch (error) {
      this.logger.error(
        `Failed to process video batch [${message.videoFileIds.join(', ')}]:`,
        (error as Error).message,
      );

      // Create failure result message
      const resultMessage: ProcessingResultMessage = {
        videoFileIds: message.videoFileIds,
        results: [],
        status: 'failed',
        error: (error as Error).message,
        timestamp: new Date(),
      };

      // Publish failure result to results queue
      try {
        await this.rabbitMQService.publishMessage(
          PROCESSING_RESULTS_QUEUE,
          resultMessage,
        );
      } catch (publishError) {
        this.logger.error(
          'Failed to publish failure result:',
          (publishError as Error).message,
        );
      }

      // Re-throw to trigger retry mechanism
      throw error;
    }
  }

  private logProcessingStats(
    message: VideoProcessingMessage,
    processedCount: number,
    processingTime: number,
  ): void {
    const avgTimePerVideo = processingTime / message.videoFileIds.length;

    this.logger.log('Processing Statistics:', {
      videoCount: message.videoFileIds.length,
      processedCount,
      totalTime: `${processingTime}ms`,
      avgTimePerVideo: `${avgTimePerVideo.toFixed(2)}ms`,
      priority: message.priority,
      retryCount: message.retryCount || 0,
    });
  }

  async getConsumerStats(): Promise<{
    queueStats: {
      messageCount: number;
      consumerCount: number;
    } | null;
    isConnected: boolean;
  }> {
    try {
      const queueStats = await this.rabbitMQService.getQueueStats(
        VIDEO_PROCESSING_QUEUE,
      );
      return {
        queueStats,
        isConnected: this.rabbitMQService.isConnected(),
      };
    } catch (error) {
      this.logger.error(
        'Failed to get consumer stats:',
        (error as Error).message,
      );
      return {
        queueStats: null,
        isConnected: false,
      };
    }
  }
}
