import { Module } from '@nestjs/common';
import { VideoProcessorController } from './controllers/video-processor.controller';
import { ApplicationModule } from '../application/application.module';

@Module({
  imports: [ApplicationModule],
  controllers: [VideoProcessorController],
})
export class PresentationModule {}
