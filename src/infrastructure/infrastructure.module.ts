import { Module } from '@nestjs/common';
import { InMemoryVideoFileRepository } from './repositories/in-memory-video-file.repository';
import { InMemoryProcessingResultRepository } from './repositories/in-memory-processing-result.repository';
import { FFmpegVideoProcessorService } from './services/ffmpeg-video-processor.service';
import { LocalFileStorageService } from './services/local-file-storage.service';

@Module({
  providers: [
    {
      provide: 'VideoFileRepository',
      useClass: InMemoryVideoFileRepository,
    },
    {
      provide: 'ProcessingResultRepository',
      useClass: InMemoryProcessingResultRepository,
    },
    {
      provide: 'VideoProcessorService',
      useClass: FFmpegVideoProcessorService,
    },
    {
      provide: 'FileStorageService',
      useClass: LocalFileStorageService,
    },
  ],
  exports: [
    'VideoFileRepository',
    'ProcessingResultRepository',
    'VideoProcessorService',
    'FileStorageService',
  ],
})
export class InfrastructureModule {}
