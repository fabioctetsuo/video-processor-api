import { Injectable, Inject } from '@nestjs/common';
import { VideoFile } from '../../domain/entities/video-file.entity';
import type { VideoFileRepository } from '../../domain/repositories/video-file.repository';
import type { FileStorageService } from '../../shared/interfaces/file-storage.interface';
import { InvalidFileFormatException } from '../../domain/exceptions/domain.exception';
import * as path from 'path';

@Injectable()
export class UploadVideoUseCase {
  constructor(
    @Inject('VideoFileRepository')
    private readonly videoFileRepository: VideoFileRepository,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(
    files: Express.Multer.File[],
    userId: string,
  ): Promise<VideoFile[]> {
    if (files.length === 0) {
      throw new Error('At least one video file is required');
    }

    if (files.length > 3) {
      throw new Error('Maximum of 3 video files allowed');
    }

    const results: VideoFile[] = [];
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const extension = path.extname(file.originalname);

      try {
        const storedName = `${timestamp}_${i + 1}_${file.originalname}`;
        const uploadPath = `uploads/${storedName}`;

        await this.fileStorageService.saveFile(file, uploadPath);

        const videoFile = VideoFile.create(
          file.originalname,
          storedName,
          extension,
          file.size,
          userId,
        );

        const savedFile = await this.videoFileRepository.save(videoFile);
        results.push(savedFile);
      } catch (error) {
        if ((error as Error).message.includes('Invalid video file extension')) {
          throw new InvalidFileFormatException(extension);
        }
        throw error;
      }
    }

    return results;
  }

  async executeSingle(
    file: Express.Multer.File,
    userId: string,
  ): Promise<VideoFile> {
    return (await this.execute([file], userId))[0];
  }
}
