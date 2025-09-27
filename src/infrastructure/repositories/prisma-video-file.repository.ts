import { Injectable } from '@nestjs/common';
import {
  VideoFile,
  VideoProcessingStatus,
} from '../../domain/entities/video-file.entity';
import { VideoFileRepository } from '../../domain/repositories/video-file.repository';
import { PrismaService } from '../database/prisma.service';
import type { VideoProcessingStatus as PrismaVideoProcessingStatus } from '@prisma/client';

@Injectable()
export class PrismaVideoFileRepository implements VideoFileRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(videoFile: VideoFile): Promise<VideoFile> {
    const data = {
      id: videoFile.getId(),
      originalName: videoFile.getOriginalName(),
      storedName: videoFile.getStoredName(),
      extension: videoFile.getExtension().getValue(),
      sizeInBytes: videoFile.getSize().getBytes(),
      uploadedAt: videoFile.getUploadedAt(),
      userId: videoFile.getUserId(),
      status: videoFile.getStatus() as PrismaVideoProcessingStatus,
      processedAt: videoFile.getProcessedAt() || undefined,
      errorMessage: videoFile.getErrorMessage() || undefined,
    };

    const createdVideoFile = await this.prisma.videoFile.create({
      data,
    });

    return VideoFile.reconstitute(
      createdVideoFile.id,
      createdVideoFile.originalName,
      createdVideoFile.storedName,
      createdVideoFile.extension,
      createdVideoFile.sizeInBytes,
      createdVideoFile.uploadedAt,
      String(createdVideoFile.userId),
      createdVideoFile.status as VideoProcessingStatus,
      createdVideoFile.processedAt || undefined,
      createdVideoFile.errorMessage || undefined,
    );
  }

  async findById(id: string): Promise<VideoFile | null> {
    const videoFile = await this.prisma.videoFile.findUnique({
      where: { id },
    });

    if (!videoFile) {
      return null;
    }

    return VideoFile.reconstitute(
      videoFile.id,
      videoFile.originalName,
      videoFile.storedName,
      videoFile.extension,
      videoFile.sizeInBytes,
      videoFile.uploadedAt,
      String(videoFile.userId),
      videoFile.status as VideoProcessingStatus,
      videoFile.processedAt || undefined,
      videoFile.errorMessage || undefined,
    );
  }

  async findAll(): Promise<VideoFile[]> {
    const videoFiles = await this.prisma.videoFile.findMany({
      orderBy: { uploadedAt: 'desc' },
    });

    return videoFiles.map((videoFile) =>
      VideoFile.reconstitute(
        videoFile.id,
        videoFile.originalName,
        videoFile.storedName,
        videoFile.extension,
        videoFile.sizeInBytes,
        videoFile.uploadedAt,
        String(videoFile.userId),
        videoFile.status as VideoProcessingStatus,
        videoFile.processedAt || undefined,
        videoFile.errorMessage || undefined,
      ),
    );
  }

  async findByUserId(userId: string): Promise<VideoFile[]> {
    const videoFiles = await this.prisma.videoFile.findMany({
      where: { userId },
      orderBy: { uploadedAt: 'desc' },
    });

    return videoFiles.map((videoFile) =>
      VideoFile.reconstitute(
        videoFile.id,
        videoFile.originalName,
        videoFile.storedName,
        videoFile.extension,
        videoFile.sizeInBytes,
        videoFile.uploadedAt,
        String(videoFile.userId),
        videoFile.status as VideoProcessingStatus,
        videoFile.processedAt || undefined,
        videoFile.errorMessage || undefined,
      ),
    );
  }

  async update(videoFile: VideoFile): Promise<VideoFile> {
    const updatedVideoFile = await this.prisma.videoFile.update({
      where: { id: videoFile.getId() },
      data: {
        originalName: videoFile.getOriginalName(),
        storedName: videoFile.getStoredName(),
        extension: videoFile.getExtension().getValue(),
        sizeInBytes: videoFile.getSize().getBytes(),
        uploadedAt: videoFile.getUploadedAt(),
        userId: videoFile.getUserId(),
        status: videoFile.getStatus() as PrismaVideoProcessingStatus,
        processedAt: videoFile.getProcessedAt() || undefined,
        errorMessage: videoFile.getErrorMessage() || undefined,
      },
    });

    return VideoFile.reconstitute(
      updatedVideoFile.id,
      updatedVideoFile.originalName,
      updatedVideoFile.storedName,
      updatedVideoFile.extension,
      updatedVideoFile.sizeInBytes,
      updatedVideoFile.uploadedAt,
      String(updatedVideoFile.userId),
      updatedVideoFile.status as VideoProcessingStatus,
      updatedVideoFile.processedAt || undefined,
      updatedVideoFile.errorMessage || undefined,
    );
  }

  async delete(id: string): Promise<void> {
    await this.prisma.videoFile.delete({
      where: { id },
    });
  }
}
