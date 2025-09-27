import { Injectable } from '@nestjs/common';
import { VideoFile } from '../../domain/entities/video-file.entity';
import { VideoFileRepository } from '../../domain/repositories/video-file.repository';

@Injectable()
export class InMemoryVideoFileRepository implements VideoFileRepository {
  private videoFiles: Map<string, VideoFile> = new Map();

  async save(videoFile: VideoFile): Promise<VideoFile> {
    this.videoFiles.set(videoFile.getId(), videoFile);
    return videoFile;
  }

  async findById(id: string): Promise<VideoFile | null> {
    return this.videoFiles.get(id) || null;
  }

  async findAll(): Promise<VideoFile[]> {
    return Array.from(this.videoFiles.values());
  }

  async update(videoFile: VideoFile): Promise<VideoFile> {
    this.videoFiles.set(videoFile.getId(), videoFile);
    return videoFile;
  }

  async delete(id: string): Promise<void> {
    this.videoFiles.delete(id);
  }
}
