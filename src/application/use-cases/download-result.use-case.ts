import { Injectable, Inject } from '@nestjs/common';
import type { ProcessingResultRepository } from '../../domain/repositories/processing-result.repository';
import type { FileStorageService } from '../../shared/interfaces/file-storage.interface';
import { ProcessingResultNotFoundException } from '../../domain/exceptions/domain.exception';

@Injectable()
export class DownloadResultUseCase {
  constructor(
    @Inject('ProcessingResultRepository')
    private readonly processingResultRepository: ProcessingResultRepository,
    @Inject('FileStorageService')
    private readonly fileStorageService: FileStorageService,
  ) {}

  async execute(filename: string): Promise<string> {
    const results = await this.processingResultRepository.findAll();
    const result = results.find((r) => r.getZipFileName() === filename);

    if (!result) {
      throw new ProcessingResultNotFoundException(`File ${filename} not found`);
    }

    const zipPath = result.getZipPath();

    if (!(await this.fileStorageService.fileExists(zipPath))) {
      throw new ProcessingResultNotFoundException(
        `File ${filename} no longer exists`,
      );
    }

    return zipPath;
  }
}
