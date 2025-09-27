import { Injectable } from '@nestjs/common';
import { ProcessingResult } from '../../domain/entities/processing-result.entity';
import { ProcessingResultRepository } from '../../domain/repositories/processing-result.repository';

@Injectable()
export class InMemoryProcessingResultRepository
  implements ProcessingResultRepository
{
  private results: Map<string, ProcessingResult> = new Map();

  async save(result: ProcessingResult): Promise<ProcessingResult> {
    this.results.set(result.getId(), result);
    return result;
  }

  async findById(id: string): Promise<ProcessingResult | null> {
    return this.results.get(id) || null;
  }

  async findByVideoFileId(
    videoFileId: string,
  ): Promise<ProcessingResult | null> {
    const results = Array.from(this.results.values());
    return (
      results.find((result) => result.getVideoFileId() === videoFileId) || null
    );
  }

  async findAll(): Promise<ProcessingResult[]> {
    return Array.from(this.results.values());
  }

  async delete(id: string): Promise<void> {
    this.results.delete(id);
  }
}
