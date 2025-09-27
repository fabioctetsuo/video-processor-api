import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

export interface WebhookPayload {
  event: 'video.processing.success' | 'video.processing.failed';
  timestamp: string;
  data: {
    videoId: string;
    userId: string;
    originalName: string;
    status: string;
    processedAt?: string;
    errorMessage?: string;
    downloadUrl?: string;
    frameCount?: number;
    zipFileName?: string;
  };
}

@Injectable()
export class WebhookNotificationService {
  private readonly logger = new Logger(WebhookNotificationService.name);
  private readonly webhookUrl: string;
  private readonly retryAttempts = 3;
  private readonly retryDelay = 2000; // 2 seconds

  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL || '';
    if (!this.webhookUrl) {
      this.logger.warn(
        'WEBHOOK_URL not configured. Webhook notifications will be logged only.',
      );
    }
  }

  async sendSuccessNotification(
    videoId: string,
    userId: string,
    originalName: string,
    downloadUrl: string,
    frameCount: number,
    zipFileName: string,
    processedAt: Date,
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: 'video.processing.success',
      timestamp: new Date().toISOString(),
      data: {
        videoId,
        userId,
        originalName,
        status: 'completed',
        processedAt: processedAt.toISOString(),
        downloadUrl,
        frameCount,
        zipFileName,
      },
    };

    await this.sendWebhook(payload);
  }

  async sendFailureNotification(
    videoId: string,
    userId: string,
    originalName: string,
    errorMessage: string,
    processedAt: Date,
  ): Promise<void> {
    const payload: WebhookPayload = {
      event: 'video.processing.failed',
      timestamp: new Date().toISOString(),
      data: {
        videoId,
        userId,
        originalName,
        status: 'failed',
        processedAt: processedAt.toISOString(),
        errorMessage,
      },
    };

    await this.sendWebhook(payload);
  }

  private async sendWebhook(
    payload: WebhookPayload,
    attempt: number = 1,
  ): Promise<void> {
    try {
      this.logger.log(
        `Sending webhook notification (attempt ${attempt}): ${payload.event} for video ${payload.data.videoId}`,
      );

      if (!this.webhookUrl) {
        this.logger.log(
          `Webhook payload (no URL configured): ${JSON.stringify(payload, null, 2)}`,
        );
        return;
      }

      const response = await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'VideoProcessor-Webhook/1.0',
        },
        timeout: 10000, // 10 seconds timeout
      });

      if (response.status >= 200 && response.status < 300) {
        this.logger.log(
          `Webhook notification sent successfully: ${payload.event} for video ${payload.data.videoId}`,
        );
      } else {
        throw new Error(
          `Webhook returned status ${response.status}: ${response.statusText}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Webhook notification failed (attempt ${attempt}): ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      if (attempt < this.retryAttempts) {
        this.logger.log(
          `Retrying webhook notification in ${this.retryDelay}ms...`,
        );

        setTimeout(() => {
          void this.sendWebhook(payload, attempt + 1);
        }, this.retryDelay);
      } else {
        this.logger.error(
          `Webhook notification failed after ${this.retryAttempts} attempts: ${payload.event} for video ${payload.data.videoId}`,
        );

        // Store failed webhook for later retry mechanism (could be implemented)
        this.logFailedWebhook(payload);
      }
    }
  }

  private logFailedWebhook(payload: WebhookPayload): void {
    this.logger.error(
      `Failed webhook payload: ${JSON.stringify(payload, null, 2)}`,
    );
    // In a production system, you might want to:
    // - Store failed webhooks in database for manual retry
    // - Send to a dead letter queue
    // - Store in file system for later processing
  }

  // Health check method to verify webhook endpoint
  async healthCheck(): Promise<boolean> {
    if (!this.webhookUrl) {
      return true; // No webhook configured is considered "healthy"
    }

    try {
      const response = await axios.get(`${this.webhookUrl}/health`, {
        timeout: 5000,
      });
      return response.status >= 200 && response.status < 300;
    } catch (error) {
      this.logger.warn(
        `Webhook health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return false;
    }
  }
}
