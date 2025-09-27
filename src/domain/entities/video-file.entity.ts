import { randomUUID } from 'crypto';
import { FileExtension } from '../value-objects/file-extension.vo';
import { FileSize } from '../value-objects/file-size.vo';

export enum VideoProcessingStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export class VideoFile {
  private constructor(
    private readonly id: string,
    private readonly originalName: string,
    private readonly storedName: string,
    private readonly extension: FileExtension,
    private readonly size: FileSize,
    private readonly uploadedAt: Date,
    private status: VideoProcessingStatus = VideoProcessingStatus.PENDING,
    private processedAt?: Date,
    private errorMessage?: string,
  ) {}

  static create(
    originalName: string,
    storedName: string,
    extension: string,
    sizeInBytes: number,
  ): VideoFile {
    const fileExtension = FileExtension.create(extension);
    const fileSize = FileSize.create(sizeInBytes);

    return new VideoFile(
      randomUUID(),
      originalName,
      storedName,
      fileExtension,
      fileSize,
      new Date(),
    );
  }

  static reconstitute(
    id: string,
    originalName: string,
    storedName: string,
    extension: string,
    sizeInBytes: number,
    uploadedAt: Date,
    status: VideoProcessingStatus,
    processedAt?: Date,
    errorMessage?: string,
  ): VideoFile {
    const fileExtension = FileExtension.create(extension);
    const fileSize = FileSize.create(sizeInBytes);

    return new VideoFile(
      id,
      originalName,
      storedName,
      fileExtension,
      fileSize,
      uploadedAt,
      status,
      processedAt,
      errorMessage,
    );
  }

  getId(): string {
    return this.id;
  }

  getOriginalName(): string {
    return this.originalName;
  }

  getStoredName(): string {
    return this.storedName;
  }

  getExtension(): FileExtension {
    return this.extension;
  }

  getSize(): FileSize {
    return this.size;
  }

  getUploadedAt(): Date {
    return this.uploadedAt;
  }

  getStatus(): VideoProcessingStatus {
    return this.status;
  }

  getProcessedAt(): Date | undefined {
    return this.processedAt;
  }

  getErrorMessage(): string | undefined {
    return this.errorMessage;
  }

  markAsProcessing(): void {
    if (this.status !== VideoProcessingStatus.PENDING) {
      throw new Error(
        'Video can only be marked as processing from pending status',
      );
    }
    this.status = VideoProcessingStatus.PROCESSING;
  }

  markAsCompleted(): void {
    if (this.status !== VideoProcessingStatus.PROCESSING) {
      throw new Error(
        'Video can only be marked as completed from processing status',
      );
    }
    this.status = VideoProcessingStatus.COMPLETED;
    this.processedAt = new Date();
    this.errorMessage = undefined;
  }

  markAsFailed(errorMessage: string): void {
    if (this.status !== VideoProcessingStatus.PROCESSING) {
      throw new Error(
        'Video can only be marked as failed from processing status',
      );
    }
    this.status = VideoProcessingStatus.FAILED;
    this.processedAt = new Date();
    this.errorMessage = errorMessage;
  }

  isProcessed(): boolean {
    return this.status === VideoProcessingStatus.COMPLETED;
  }

  isFailed(): boolean {
    return this.status === VideoProcessingStatus.FAILED;
  }

  isProcessing(): boolean {
    return this.status === VideoProcessingStatus.PROCESSING;
  }
}
