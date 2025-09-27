import { Injectable, Logger } from '@nestjs/common';
import { spawn } from 'child_process';
import { readdir, mkdir } from 'fs/promises';
import * as path from 'path';
import { VideoProcessorService } from '../../shared/interfaces/video-processor.interface';
import { VideoProcessingException } from '../../domain/exceptions/domain.exception';

@Injectable()
export class FFmpegVideoProcessorService implements VideoProcessorService {
  private readonly logger = new Logger(FFmpegVideoProcessorService.name);

  async extractFrames(videoPath: string, outputDir: string): Promise<string[]> {
    try {
      // Ensure output directory exists
      await mkdir(outputDir, { recursive: true });

      const framePattern = path.join(outputDir, 'frame_%04d.png');

      const args = ['-i', videoPath, '-vf', 'fps=1', '-y', framePattern];

      this.logger.log(`Executing FFmpeg command: ffmpeg ${args.join(' ')}`);

      await this.executeFFmpeg(args);

      // Read extracted frames
      const files = await readdir(outputDir);
      const frameFiles = files
        .filter((file) => file.endsWith('.png'))
        .sort()
        .map((file) => path.join(outputDir, file));

      this.logger.log(`Extracted ${frameFiles.length} frames`);

      return frameFiles;
    } catch (error) {
      this.logger.error(
        `FFmpeg processing failed: ${(error as Error).message}`,
      );
      throw new VideoProcessingException((error as Error).message);
    }
  }

  private executeFFmpeg(args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const ffmpeg = spawn('ffmpeg', args);
      let stderr = '';

      ffmpeg.stderr.on('data', (data: Buffer) => {
        stderr += data.toString();
      });

      ffmpeg.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(
            new Error(`FFmpeg process exited with code ${code}: ${stderr}`),
          );
        }
      });

      ffmpeg.on('error', (error) => {
        reject(new Error(`Failed to start FFmpeg: ${error.message}`));
      });
    });
  }
}
