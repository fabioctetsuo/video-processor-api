export interface MessageQueueService {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  publishMessage(queue: string, message: unknown): Promise<boolean>;
  consumeMessages(
    queue: string,
    callback: (message: unknown) => Promise<void>,
  ): Promise<void>;
  isConnected(): boolean;
  getQueueStats(queue: string): Promise<QueueStats>;
}

export interface QueueStats {
  messageCount: number;
  consumerCount: number;
}

export interface VideoProcessingMessage {
  videoFileIds: string[];
  priority: number;
  timestamp: Date;
  retryCount?: number;
  maxRetries?: number;
}

export interface ProcessingResultMessage {
  videoFileIds: string[];
  results: ProcessingResultData[];
  status: 'completed' | 'failed';
  error?: string;
  timestamp: Date;
}

export interface ProcessingResultData {
  videoId: string;
  originalName: string;
  zipPath: string;
  frameCount: number;
  frameNames: string[];
}

export const VIDEO_PROCESSING_QUEUE = 'video.processing';
export const PROCESSING_RESULTS_QUEUE = 'video.processing.results';
export const DEAD_LETTER_QUEUE = 'video.processing.dlq';
