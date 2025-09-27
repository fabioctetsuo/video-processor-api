import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RabbitMQService } from '../../infrastructure/services/rabbitmq.service';
import { VideoProcessingConsumer } from '../../application/consumers/video-processing.consumer';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly rabbitMQService: RabbitMQService,
    private readonly videoProcessingConsumer: VideoProcessingConsumer,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get system health status' })
  @ApiResponse({
    status: 200,
    description: 'System is healthy',
    schema: {
      type: 'object',
      properties: {
        status: { type: 'string' },
        timestamp: { type: 'string' },
        services: {
          type: 'object',
          properties: {
            rabbitmq: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                connected: { type: 'boolean' },
              },
            },
            consumer: {
              type: 'object',
              properties: {
                status: { type: 'string' },
                queueStats: { type: 'object' },
              },
            },
          },
        },
      },
    },
  })
  @ApiResponse({ status: 503, description: 'System is unhealthy' })
  async getHealth(): Promise<{
    status: string;
    timestamp: string;
    services: {
      rabbitmq: { status: string; connected: boolean };
      consumer: { status: string; queueStats: any };
    };
  }> {
    try {
      const [consumerStats] = await Promise.all([
        this.videoProcessingConsumer.getConsumerStats(),
      ]);

      const rabbitmqHealthy = this.rabbitMQService.isConnected();
      const consumerHealthy = consumerStats.isConnected;

      const overallHealthy = rabbitmqHealthy && consumerHealthy;

      const response = {
        status: overallHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        services: {
          rabbitmq: {
            status: rabbitmqHealthy ? 'healthy' : 'unhealthy',
            connected: rabbitmqHealthy,
          },
          consumer: {
            status: consumerHealthy ? 'healthy' : 'unhealthy',
            queueStats: consumerStats.queueStats,
          },
        },
      };

      if (!overallHealthy) {
        throw new HttpException(response, HttpStatus.SERVICE_UNAVAILABLE);
      }

      return response;
    } catch (error) {
      this.logger.error('Health check failed:', (error as Error).message);

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        {
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: 'Health check failed',
        },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  @Get('ready')
  @ApiOperation({ summary: 'Check if system is ready to accept requests' })
  @ApiResponse({ status: 200, description: 'System is ready' })
  @ApiResponse({ status: 503, description: 'System is not ready' })
  getReadiness(): Promise<{ status: string; ready: boolean }> {
    const isReady = this.rabbitMQService.isConnected();

    if (!isReady) {
      throw new HttpException(
        { status: 'not ready', ready: false },
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }

    return Promise.resolve({ status: 'ready', ready: true });
  }
}
