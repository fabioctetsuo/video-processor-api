import { Module } from '@nestjs/common';
import { UploadVideoUseCase } from './use-cases/upload-video.use-case';
import { ProcessVideoUseCase } from './use-cases/process-video.use-case';
import { GetProcessingStatusUseCase } from './use-cases/get-processing-status.use-case';
import { DownloadResultUseCase } from './use-cases/download-result.use-case';
import { InfrastructureModule } from '../infrastructure/infrastructure.module';

@Module({
  imports: [InfrastructureModule],
  providers: [
    UploadVideoUseCase,
    ProcessVideoUseCase,
    GetProcessingStatusUseCase,
    DownloadResultUseCase,
  ],
  exports: [
    UploadVideoUseCase,
    ProcessVideoUseCase,
    GetProcessingStatusUseCase,
    DownloadResultUseCase,
  ],
})
export class ApplicationModule {}
