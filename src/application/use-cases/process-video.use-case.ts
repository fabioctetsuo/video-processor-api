import { Injectable, Inject } from '@nestjs/common';
import { VideoFile } from '../../domain/entities/video-file.entity';
import { ProcessingResult } from '../../domain/entities/processing-result.entity';
import type { VideoFileRepository } from '../../domain/repositories/video-file.repository';
import type { ProcessingResultRepository } from '../../domain/repositories/processing-result.repository';
import type { VideoProcessorService } from '../../shared/interfaces/video-processor.interface';
import type { FileStorageService } from '../../shared/interfaces/file-storage.interface';
import {
  VideoFileNotFoundException,
  VideoProcessingException,
} from '../../domain/exceptions/domain.exception';
import * as path from 'path';

@Injectable()
export class ProcessVideoUseCase {
  constructor(
    @Inject('VideoFileRepository')
    private readonly videoFileRepository: VideoFileRepository,
    @Inject('ProcessingResultRepository')
    private readonly processingResultRepository: ProcessingResultRepository,
    @Inject('VideoProcessorService')
    private readonly videoProcessorService: VideoProcessorService,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(videoFileIds: string[]): Promise<ProcessingResult[]> {
    if (videoFileIds.length === 0) {
      throw new Error('At least one video file ID is required');
    }

    if (videoFileIds.length > 3) {
      throw new Error('Maximum of 3 videos can be processed simultaneously');
    }

    const videoFiles = await Promise.all(
      videoFileIds.map((id) => this.videoFileRepository.findById(id)),
    );

    const missingFiles = videoFiles
      .map((file, index) => ({ file, id: videoFileIds[index] }))
      .filter(({ file }) => !file);

    if (missingFiles.length > 0) {
      throw new VideoFileNotFoundException(missingFiles[0].id);
    }

    const validVideoFiles = videoFiles as VideoFile[];

    try {
      for (const videoFile of validVideoFiles) {
        videoFile.markAsProcessing();
        await this.videoFileRepository.update(videoFile);
      }

      const processingPromises = validVideoFiles.map((videoFile, index) =>
        this.processSingleVideo(videoFile, index),
      );

      const results = await Promise.all(processingPromises);

      for (const videoFile of validVideoFiles) {
        videoFile.markAsCompleted();
        await this.videoFileRepository.update(videoFile);
      }

      return results;
    } catch (error) {
      for (const videoFile of validVideoFiles) {
        if (videoFile.isProcessing()) {
          videoFile.markAsFailed(error.message);
          await this.videoFileRepository.update(videoFile);
        }
      }
      throw new VideoProcessingException(error.message);
    }
  }

  async executeSingle(videoFileId: string): Promise<ProcessingResult> {
    return (await this.execute([videoFileId]))[0];
  }

  private async processSingleVideo(
    videoFile: VideoFile,
    index: number,
  ): Promise<ProcessingResult> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const tempDir = `temp/${timestamp}_${index + 1}`;
    const videoPath = `uploads/${videoFile.getStoredName()}`;

    const frameFiles = await this.videoProcessorService.extractFrames(
      videoPath,
      tempDir,
    );

    if (frameFiles.length === 0) {
      throw new VideoProcessingException(
        `No frames were extracted from video: ${videoFile.getOriginalName()}`,
      );
    }

    const zipFileName = `frames_${timestamp}_${index + 1}.zip`;
    const zipPath = `outputs/${zipFileName}`;

    await this.fileStorageService.createZip(frameFiles, zipPath);

    for (const frameFile of frameFiles) {
      await this.fileStorageService.deleteFile(frameFile);
    }
    await this.fileStorageService.deleteFile(videoPath);

    const frameNames = frameFiles.map((file) => path.basename(file));
    const result = ProcessingResult.create(
      videoFile.getId(),
      zipPath,
      frameFiles.length,
      frameNames,
    );

    return await this.processingResultRepository.save(result);
  }
}
