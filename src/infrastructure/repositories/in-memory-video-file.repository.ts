import { Injectable } from '@nestjs/common';
import { VideoFile } from '../../domain/entities/video-file.entity';
import { VideoFileRepository } from '../../domain/repositories/video-file.repository';

@Injectable()
export class InMemoryVideoFileRepository implements VideoFileRepository {
  private videoFiles: Map<string, VideoFile> = new Map();

  save(videoFile: VideoFile): Promise<VideoFile> {
    this.videoFiles.set(videoFile.getId(), videoFile);
    return Promise.resolve(videoFile);
  }

  findById(id: string): Promise<VideoFile | null> {
    return Promise.resolve(this.videoFiles.get(id) || null);
  }

  findAll(): Promise<VideoFile[]> {
    return Promise.resolve(Array.from(this.videoFiles.values()));
  }

  findByUserId(userId: string): Promise<VideoFile[]> {
    const userVideos = Array.from(this.videoFiles.values()).filter(
      (video) => video.getUserId() === userId,
    );
    return Promise.resolve(userVideos);
  }

  update(videoFile: VideoFile): Promise<VideoFile> {
    this.videoFiles.set(videoFile.getId(), videoFile);
    return Promise.resolve(videoFile);
  }

  delete(id: string): Promise<void> {
    this.videoFiles.delete(id);
    return Promise.resolve();
  }
}
