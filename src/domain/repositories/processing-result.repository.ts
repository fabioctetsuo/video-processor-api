import { ProcessingResult } from '../entities/processing-result.entity';

export interface ProcessingResultRepository {
  save(result: ProcessingResult): Promise<ProcessingResult>;
  findById(id: string): Promise<ProcessingResult | null>;
  findByVideoFileId(videoFileId: string): Promise<ProcessingResult | null>;
  findAll(): Promise<ProcessingResult[]>;
  delete(id: string): Promise<void>;
}
