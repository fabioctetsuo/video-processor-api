export interface VideoProcessorService {
  extractFrames(videoPath: string, outputDir: string): Promise<string[]>;
}
