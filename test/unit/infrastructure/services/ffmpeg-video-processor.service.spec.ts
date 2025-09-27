import { Test, TestingModule } from '@nestjs/testing';
import { FFmpegVideoProcessorService } from '../../../../src/infrastructure/services/ffmpeg-video-processor.service';
import { VideoProcessingException } from '../../../../src/domain/exceptions/domain.exception';

// Mock child_process
jest.mock('child_process', () => ({
  spawn: jest.fn(),
}));

// Mock fs/promises
jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  readdir: jest.fn(),
}));

const mockSpawn = jest.mocked(require('child_process').spawn);
const mockMkdir = jest.mocked(require('fs/promises').mkdir);
const mockReaddir = jest.mocked(require('fs/promises').readdir);

describe('FFmpegVideoProcessorService', () => {
  let service: FFmpegVideoProcessorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [FFmpegVideoProcessorService],
    }).compile();

    service = module.get<FFmpegVideoProcessorService>(
      FFmpegVideoProcessorService,
    );
    jest.clearAllMocks();
  });

  describe('extractFrames', () => {
    it('should extract frames successfully', async () => {
      const mockProcess = {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };

      // Setup mkdir mock
      mockMkdir.mockResolvedValue(undefined);

      // Setup readdir mock to return frame files
      mockReaddir.mockResolvedValue([
        'frame_001.png',
        'frame_002.png',
        'frame_003.png',
      ] as any);

      // Setup spawn mock
      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock process events
      mockProcess.on.mockImplementation(
        (event: string, callback: (...args: any[]) => any) => {
          if (event === 'close') {
            // Simulate successful completion
            setTimeout(() => callback(0), 10);
          }
          return mockProcess;
        },
      );

      const videoPath = 'test/video.mp4';
      const outputDir = 'output/frames';

      const resultPromise = service.extractFrames(videoPath, outputDir);

      // Wait for the promise to resolve
      const result = await resultPromise;

      expect(mockMkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
      expect(mockSpawn).toHaveBeenCalledWith('ffmpeg', [
        '-i',
        videoPath,
        '-vf',
        'fps=1',
        '-y',
        'output/frames/frame_%04d.png',
      ]);
      expect(mockReaddir).toHaveBeenCalledWith(outputDir);
      expect(result).toEqual([
        'output/frames/frame_001.png',
        'output/frames/frame_002.png',
        'output/frames/frame_003.png',
      ]);
    });

    it('should throw VideoProcessingException when FFmpeg fails', async () => {
      const mockProcess = {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };

      mockMkdir.mockResolvedValue(undefined);
      mockSpawn.mockReturnValue(mockProcess as any);

      // Mock process events for failure
      mockProcess.on.mockImplementation(
        (event: string, callback: (...args: any[]) => any) => {
          if (event === 'close') {
            // Simulate failure
            setTimeout(() => callback(1), 10);
          }
          return mockProcess;
        },
      );

      const videoPath = 'test/video.mp4';
      const outputDir = 'output/frames';

      await expect(service.extractFrames(videoPath, outputDir)).rejects.toThrow(
        VideoProcessingException,
      );
    });

    it('should handle spawn error', async () => {
      mockMkdir.mockResolvedValue(undefined);
      mockSpawn.mockImplementation(() => {
        throw new Error('spawn ffmpeg ENOENT');
      });

      const videoPath = 'test/video.mp4';
      const outputDir = 'output/frames';

      await expect(service.extractFrames(videoPath, outputDir)).rejects.toThrow(
        'Video processing failed: spawn ffmpeg ENOENT',
      );
    });

    it('should handle mkdir error', async () => {
      mockMkdir.mockRejectedValue(new Error('Permission denied'));

      const videoPath = 'test/video.mp4';
      const outputDir = 'output/frames';

      await expect(service.extractFrames(videoPath, outputDir)).rejects.toThrow(
        'Permission denied',
      );
    });

    it('should handle readdir error', async () => {
      const mockProcess = {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };

      mockMkdir.mockResolvedValue(undefined);
      mockSpawn.mockReturnValue(mockProcess as any);
      mockReaddir.mockRejectedValue(new Error('Read error'));

      // Mock successful process completion
      mockProcess.on.mockImplementation(
        (event: string, callback: (...args: any[]) => any) => {
          if (event === 'close') {
            setTimeout(() => callback(0), 10);
          }
          return mockProcess;
        },
      );

      const videoPath = 'test/video.mp4';
      const outputDir = 'output/frames';

      await expect(service.extractFrames(videoPath, outputDir)).rejects.toThrow(
        'Read error',
      );
    });

    it('should handle stderr data in FFmpeg process', async () => {
      const mockProcess = {
        on: jest.fn(),
        stdout: { on: jest.fn() },
        stderr: { on: jest.fn() },
      };

      mockMkdir.mockResolvedValue(undefined);
      mockSpawn.mockReturnValue(mockProcess as any);
      mockReaddir.mockResolvedValue(['frame_001.png'] as any);

      // Mock stderr data and process failure
      mockProcess.stderr.on.mockImplementation(
        (event: string, callback: (...args: any[]) => any) => {
          if (event === 'data') {
            setTimeout(() => callback(Buffer.from('FFmpeg stderr output')), 5);
          }
          return mockProcess.stderr;
        },
      );

      mockProcess.on.mockImplementation(
        (event: string, callback: (...args: any[]) => any) => {
          if (event === 'close') {
            // Simulate failure with stderr data
            setTimeout(() => callback(1), 15);
          }
          return mockProcess;
        },
      );

      const videoPath = 'test/video.mp4';
      const outputDir = 'output/frames';

      await expect(service.extractFrames(videoPath, outputDir)).rejects.toThrow(
        VideoProcessingException,
      );
    });
  });
});
