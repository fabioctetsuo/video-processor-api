import { Injectable, Inject } from '@nestjs/common';
import { VideoFile } from '../../domain/entities/video-file.entity';
import { ProcessingResult } from '../../domain/entities/processing-result.entity';
import type { VideoFileRepository } from '../../domain/repositories/video-file.repository';
import type { ProcessingResultRepository } from '../../domain/repositories/processing-result.repository';

export interface VideoWithProcessingResult {
  video: VideoFile;
  processingResult?: ProcessingResult;
}

@Injectable()
export class ListUserVideosUseCase {
  constructor(
    @Inject('VideoFileRepository')
    private readonly videoFileRepository: VideoFileRepository,
    @Inject('ProcessingResultRepository')
    private readonly processingResultRepository: ProcessingResultRepository,
  ) {}

  async execute(userId: string): Promise<VideoWithProcessingResult[]> {
    const videos = await this.videoFileRepository.findByUserId(userId);

    const videosWithResults: VideoWithProcessingResult[] = [];

    for (const video of videos) {
      const processingResult =
        await this.processingResultRepository.findByVideoFileId(video.getId());
      videosWithResults.push({
        video,
        processingResult: processingResult || undefined,
      });
    }

    return videosWithResults;
  }
}
