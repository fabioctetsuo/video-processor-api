import { Module } from '@nestjs/common';
import { PrismaVideoFileRepository } from './repositories/prisma-video-file.repository';
import { PrismaProcessingResultRepository } from './repositories/prisma-processing-result.repository';
import { FFmpegVideoProcessorService } from './services/ffmpeg-video-processor.service';
import { LocalFileStorageService } from './services/local-file-storage.service';
import { PrismaService } from './database/prisma.service';

@Module({
  providers: [
    PrismaService,
    {
      provide: 'VideoFileRepository',
      useClass: PrismaVideoFileRepository,
    },
    {
      provide: 'ProcessingResultRepository',
      useClass: PrismaProcessingResultRepository,
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
    PrismaService,
    'VideoFileRepository',
    'ProcessingResultRepository',
    'VideoProcessorService',
    'FileStorageService',
  ],
})
export class InfrastructureModule {}
