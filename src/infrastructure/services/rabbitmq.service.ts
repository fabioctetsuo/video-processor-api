/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp from 'amqplib';
import {
  MessageQueueService,
  QueueStats,
  VIDEO_PROCESSING_QUEUE,
  PROCESSING_RESULTS_QUEUE,
  DEAD_LETTER_QUEUE,
} from '../../shared/interfaces/message-queue.interface';

@Injectable()
export class RabbitMQService
  implements MessageQueueService, OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(RabbitMQService.name);
  private connection: any = null;
  private channel: any = null;
  private readonly maxRetries = 5;
  private readonly retryDelay = 5000; // 5 seconds

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    await this.connect();
    await this.setupQueues();
  }

  async onModuleDestroy(): Promise<void> {
    await this.disconnect();
  }

  async connect(): Promise<void> {
    const rabbitmqUrl = this.configService.get<string>(
      'RABBITMQ_URL',
      'amqp://localhost:5672',
    );
    let retries = 0;

    while (retries < this.maxRetries && !this.connection) {
      try {
        this.logger.log(
          `Attempting to connect to RabbitMQ... (attempt ${retries + 1}/${this.maxRetries})`,
        );

        this.connection = await amqp.connect(rabbitmqUrl);
        this.channel = await this.connection.createChannel();

        this.connection.on('error', (err: unknown) => {
          this.logger.error('RabbitMQ connection error:', err);
          this.connection = null;
          this.channel = null;
        });

        this.connection.on('close', () => {
          this.logger.warn('RabbitMQ connection closed');
          this.connection = null;
          this.channel = null;
        });

        this.logger.log('Successfully connected to RabbitMQ');
        break;
      } catch (error) {
        retries++;
        this.logger.error(
          `Failed to connect to RabbitMQ (attempt ${retries}/${this.maxRetries}):`,
          error.message,
        );

        if (retries < this.maxRetries) {
          await this.sleep(this.retryDelay);
        } else {
          throw new Error(
            `Failed to connect to RabbitMQ after ${this.maxRetries} attempts`,
          );
        }
      }
    }
  }

  async disconnect(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      this.logger.log('Disconnected from RabbitMQ');
    } catch (error) {
      this.logger.error(
        'Error disconnecting from RabbitMQ:',
        (error as Error).message,
      );
    }
  }

  async publishMessage(queue: string, message: unknown): Promise<boolean> {
    await this.ensureConnection();

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      const published = this.channel.sendToQueue(queue, messageBuffer, {
        persistent: true,
        timestamp: Date.now(),
      });

      if (!published) {
        this.logger.warn(
          `Message not published to queue ${queue} - queue may be full`,
        );
      } else {
        this.logger.debug(`Message published to queue ${queue}`);
      }

      return published;
    } catch (error) {
      this.logger.error(
        `Failed to publish message to queue ${queue}:`,
        error.message,
      );
      throw error;
    }
  }

  async consumeMessages(
    queue: string,
    callback: (message: any) => Promise<void>,
  ): Promise<void> {
    await this.ensureConnection();

    try {
      await this.channel.consume(queue, async (msg: any) => {
        if (msg) {
          try {
            const messageContent = JSON.parse(msg.content.toString());
            this.logger.debug(`Processing message from queue ${queue}`);

            await callback(messageContent);

            this.channel.ack(msg);
            this.logger.debug(
              `Message processed successfully from queue ${queue}`,
            );
          } catch (error) {
            this.logger.error(
              `Error processing message from queue ${queue}:`,
              error.message,
            );

            // Reject and requeue the message up to max retries
            const retryCount =
              (msg.properties.headers?.['x-retry-count'] || 0) + 1;
            const maxRetries = msg.properties.headers?.['x-max-retries'] || 3;

            if (retryCount <= maxRetries) {
              // Requeue with retry count
              await this.publishMessage(queue, {
                ...JSON.parse(msg.content.toString()),
                retryCount,
                maxRetries,
              });
              this.channel.ack(msg);
            } else {
              // Send to dead letter queue
              await this.publishMessage(DEAD_LETTER_QUEUE, {
                originalQueue: queue,
                message: JSON.parse(msg.content.toString()),
                error: error.message,
                finalRetryCount: retryCount,
              });
              this.channel.ack(msg);
            }
          }
        }
      });

      this.logger.log(`Started consuming messages from queue ${queue}`);
    } catch (error) {
      this.logger.error(
        `Failed to consume messages from queue ${queue}:`,
        error.message,
      );
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }

  async getQueueStats(queue: string): Promise<QueueStats> {
    await this.ensureConnection();

    try {
      const queueInfo = await this.channel.checkQueue(queue);
      return {
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get stats for queue ${queue}:`,
        error.message,
      );
      throw error;
    }
  }

  private async setupQueues(): Promise<void> {
    await this.ensureConnection();

    try {
      // Declare main processing queue with dead letter exchange
      await this.channel.assertQueue(VIDEO_PROCESSING_QUEUE, {
        durable: true,
        arguments: {
          'x-dead-letter-exchange': '',
          'x-dead-letter-routing-key': DEAD_LETTER_QUEUE,
        },
      });

      // Declare results queue
      await this.channel.assertQueue(PROCESSING_RESULTS_QUEUE, {
        durable: true,
      });

      // Declare dead letter queue
      await this.channel.assertQueue(DEAD_LETTER_QUEUE, {
        durable: true,
      });

      // Set QoS to process one message at a time per consumer
      await this.channel.prefetch(1);

      this.logger.log('RabbitMQ queues setup completed');
    } catch (error) {
      this.logger.error('Failed to setup RabbitMQ queues:', error.message);
      throw error;
    }
  }

  private async ensureConnection(): Promise<void> {
    if (!this.isConnected()) {
      await this.connect();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
