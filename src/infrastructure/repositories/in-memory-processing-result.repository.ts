import { Injectable } from '@nestjs/common';
import { ProcessingResult } from '../../domain/entities/processing-result.entity';
import { ProcessingResultRepository } from '../../domain/repositories/processing-result.repository';

@Injectable()
export class InMemoryProcessingResultRepository
  implements ProcessingResultRepository
{
  private results: Map<string, ProcessingResult> = new Map();

  save(result: ProcessingResult): Promise<ProcessingResult> {
    this.results.set(result.getId(), result);
    return Promise.resolve(result);
  }

  findById(id: string): Promise<ProcessingResult | null> {
    return Promise.resolve(this.results.get(id) || null);
  }

  findByVideoFileId(videoFileId: string): Promise<ProcessingResult | null> {
    const results = Array.from(this.results.values());
    return Promise.resolve(
      results.find((result) => result.getVideoFileId() === videoFileId) || null,
    );
  }

  findAll(): Promise<ProcessingResult[]> {
    return Promise.resolve(Array.from(this.results.values()));
  }

  delete(id: string): Promise<void> {
    this.results.delete(id);
    return Promise.resolve();
  }
}
