import { Injectable, Inject } from '@nestjs/common';
import type { ProcessingResultRepository } from '../../domain/repositories/processing-result.repository';
import type { FileStorageService } from '../../shared/interfaces/file-storage.interface';
import { ProcessingResult } from '../../domain/entities/processing-result.entity';

export interface ProcessingStatusItem {
  filename: string;
  size: number;
  createdAt: string;
  downloadUrl: string;
  frameCount: number;
}

@Injectable()
export class GetProcessingStatusUseCase {
  constructor(
    @Inject('ProcessingResultRepository')
    private readonly processingResultRepository: ProcessingResultRepository,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(): Promise<{ files: ProcessingStatusItem[]; total: number }> {
    const results = await this.processingResultRepository.findAll();

    const files: ProcessingStatusItem[] = [];

    for (const result of results) {
      const zipPath = result.getZipPath();

      if (await this.fileStorageService.fileExists(zipPath)) {
        const size = await this.fileStorageService.getFileSize(zipPath);
        const filename = result.getZipFileName();

        files.push({
          filename,
          size,
          createdAt: result
            .getCreatedAt()
            .toISOString()
            .replace('T', ' ')
            .split('.')[0],
          downloadUrl: `/api/v1/videos/download/${filename}`,
          frameCount: result.getFrameCount(),
        });
      }
    }

    return {
      files,
      total: files.length,
    };
  }
}
