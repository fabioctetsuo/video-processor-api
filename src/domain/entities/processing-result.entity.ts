import { randomUUID } from 'crypto';

export class ProcessingResult {
  private constructor(
    private readonly id: string,
    private readonly videoFileId: string,
    private readonly zipPath: string,
    private readonly frameCount: number,
    private readonly frameNames: string[],
    private readonly createdAt: Date,
  ) {}

  static create(
    videoFileId: string,
    zipPath: string,
    frameCount: number,
    frameNames: string[],
  ): ProcessingResult {
    return new ProcessingResult(
      randomUUID(),
      videoFileId,
      zipPath,
      frameCount,
      frameNames,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    videoFileId: string,
    zipPath: string,
    frameCount: number,
    frameNames: string[],
    createdAt: Date,
  ): ProcessingResult {
    return new ProcessingResult(
      id,
      videoFileId,
      zipPath,
      frameCount,
      frameNames,
      createdAt,
    );
  }

  getId(): string {
    return this.id;
  }

  getVideoFileId(): string {
    return this.videoFileId;
  }

  getZipPath(): string {
    return this.zipPath;
  }

  getFrameCount(): number {
    return this.frameCount;
  }

  getFrameNames(): string[] {
    return [...this.frameNames];
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getZipFileName(): string {
    return this.zipPath.split('/').pop() || this.zipPath;
  }
}
