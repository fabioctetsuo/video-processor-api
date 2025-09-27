import { Injectable } from '@nestjs/common';
import { ProcessingResult } from '../../domain/entities/processing-result.entity';
import { ProcessingResultRepository } from '../../domain/repositories/processing-result.repository';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class PrismaProcessingResultRepository
  implements ProcessingResultRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async save(result: ProcessingResult): Promise<ProcessingResult> {
    const data = {
      id: result.getId(),
      videoFileId: result.getVideoFileId(),
      zipPath: result.getZipPath(),
      frameCount: result.getFrameCount(),
      frameNames: result.getFrameNames(),
      createdAt: result.getCreatedAt(),
    };

    const createdResult = await this.prisma.processingResult.create({
      data,
    });

    return ProcessingResult.reconstitute(
      createdResult.id,
      createdResult.videoFileId,
      createdResult.zipPath,
      createdResult.frameCount,
      createdResult.frameNames,
      createdResult.createdAt,
    );
  }

  async findById(id: string): Promise<ProcessingResult | null> {
    const result = await this.prisma.processingResult.findUnique({
      where: { id },
    });

    if (!result) {
      return null;
    }

    return ProcessingResult.reconstitute(
      result.id,
      result.videoFileId,
      result.zipPath,
      result.frameCount,
      result.frameNames,
      result.createdAt,
    );
  }

  async findByVideoFileId(
    videoFileId: string,
  ): Promise<ProcessingResult | null> {
    const result = await this.prisma.processingResult.findFirst({
      where: { videoFileId },
      orderBy: { createdAt: 'desc' },
    });

    if (!result) {
      return null;
    }

    return ProcessingResult.reconstitute(
      result.id,
      result.videoFileId,
      result.zipPath,
      result.frameCount,
      result.frameNames,
      result.createdAt,
    );
  }

  async findAll(): Promise<ProcessingResult[]> {
    const results = await this.prisma.processingResult.findMany({
      orderBy: { createdAt: 'desc' },
    });

    return results.map((result) =>
      ProcessingResult.reconstitute(
        result.id,
        result.videoFileId,
        result.zipPath,
        result.frameCount,
        result.frameNames,
        result.createdAt,
      ),
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.processingResult.delete({
      where: { id },
    });
  }
}
