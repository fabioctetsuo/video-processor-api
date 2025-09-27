import { VideoFile } from '../entities/video-file.entity';

export interface VideoFileRepository {
  save(videoFile: VideoFile): Promise<VideoFile>;
  findById(id: string): Promise<VideoFile | null>;
  findAll(): Promise<VideoFile[]>;
  update(videoFile: VideoFile): Promise<VideoFile>;
  delete(id: string): Promise<void>;
}
