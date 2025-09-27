import { Module } from '@nestjs/common';
import { VideoProcessorController } from './controllers/video-processor.controller';
import { HealthController } from './controllers/health.controller';
import { ApplicationModule } from '../application/application.module';
import { MessagingModule } from '../infrastructure/messaging/messaging.module';

@Module({
  imports: [ApplicationModule, MessagingModule],
  controllers: [VideoProcessorController, HealthController],
})
export class PresentationModule {}
