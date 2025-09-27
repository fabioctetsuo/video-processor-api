import { Module } from '@nestjs/common';
import { UploadVideoUseCase } from './use-cases/upload-video.use-case';
import { ProcessVideoUseCase } from './use-cases/process-video.use-case';
import { QueueVideoProcessingUseCase } from './use-cases/queue-video-processing.use-case';
import { GetProcessingStatusUseCase } from './use-cases/get-processing-status.use-case';
import { DownloadResultUseCase } from './use-cases/download-result.use-case';
import { ListUserVideosUseCase } from './use-cases/list-user-videos.use-case';
import { VideoProcessingConsumer } from './consumers/video-processing.consumer';
import { WebhookNotificationService } from '../shared/services/webhook-notification.service';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';
import { MessagingModule } from '../infrastructure/messaging/messaging.module';

@Module({
  imports: [InfrastructureModule, MessagingModule],
  providers: [
    UploadVideoUseCase,
    ProcessVideoUseCase,
    QueueVideoProcessingUseCase,
    GetProcessingStatusUseCase,
    DownloadResultUseCase,
    ListUserVideosUseCase,
    VideoProcessingConsumer,
    WebhookNotificationService,
  ],
  exports: [
    UploadVideoUseCase,
    ProcessVideoUseCase,
    QueueVideoProcessingUseCase,
    GetProcessingStatusUseCase,
    DownloadResultUseCase,
    ListUserVideosUseCase,
    VideoProcessingConsumer,
  ],
})
export class ApplicationModule {}
