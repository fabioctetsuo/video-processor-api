/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import {
  Controller,
  Post,
  Get,
  Param,
  UploadedFile,
  UploadedFiles,
  UseInterceptors,
  HttpException,
  HttpStatus,
  HttpCode,
  Res,
  Logger,
  Headers,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { UploadVideoUseCase } from '../../application/use-cases/upload-video.use-case';
import { ProcessVideoUseCase } from '../../application/use-cases/process-video.use-case';
import { QueueVideoProcessingUseCase } from '../../application/use-cases/queue-video-processing.use-case';
import { GetProcessingStatusUseCase } from '../../application/use-cases/get-processing-status.use-case';
import { DownloadResultUseCase } from '../../application/use-cases/download-result.use-case';
import { ListUserVideosUseCase } from '../../application/use-cases/list-user-videos.use-case';
import { VideoProcessingResponseDto } from '../../application/dto/video-processing-response.dto';
import {
  UploadVideoDto,
  UploadSingleVideoDto,
} from '../../application/dto/upload-video.dto';
import { multerConfig } from '../../shared/utils/multer-config';
import {
  ProcessingResultNotFoundException,
  InvalidFileFormatException,
  VideoProcessingException,
} from '../../domain/exceptions/domain.exception';

@ApiTags('Video Processing')
@Controller('videos')
export class VideoProcessorController {
  private readonly logger = new Logger(VideoProcessorController.name);

  constructor(
    private readonly uploadVideoUseCase: UploadVideoUseCase,
    private readonly processVideoUseCase: ProcessVideoUseCase,
    private readonly queueVideoProcessingUseCase: QueueVideoProcessingUseCase,
    private readonly getProcessingStatusUseCase: GetProcessingStatusUseCase,
    private readonly downloadResultUseCase: DownloadResultUseCase,
    private readonly listUserVideosUseCase: ListUserVideosUseCase,
  ) {}

  @Post('upload')
  @HttpCode(202)
  @ApiOperation({
    summary: 'Upload and process multiple video files (1-3 videos)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple video files upload (1-3 files)',
    type: UploadVideoDto,
  })
  @ApiResponse({
    status: 202,
    description: 'Videos queued for processing',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        videoIds: { type: 'array', items: { type: 'string' } },
        queuePosition: { type: 'number' },
        estimatedProcessingTime: { type: 'string' },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file format, size, or count',
  })
  @ApiResponse({ status: 500, description: 'Video processing failed' })
  @UseInterceptors(FilesInterceptor('videos', 3, multerConfig))
  async uploadVideos(
    @UploadedFiles() files: Express.Multer.File[],
    @Headers('x-user-id') userId: string,
  ): Promise<{
    success: boolean;
    message: string;
    videoIds: string[];
    queuePosition?: number;
    estimatedProcessingTime?: string;
  }> {
    if (!files || files.length === 0) {
      throw new HttpException(
        'At least one video file is required',
        HttpStatus.BAD_REQUEST,
      );
    }

    if (!userId) {
      throw new HttpException(
        'User authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (files.length > 3) {
      throw new HttpException(
        'Maximum of 3 video files allowed',
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      this.logger.log(
        `Uploading ${files.length} video(s): ${files.map((f) => f.originalname).join(', ')}`,
      );

      // Upload videos first
      const videoFiles = await this.uploadVideoUseCase.execute(files, userId);
      this.logger.log(
        `Videos uploaded with IDs: ${videoFiles.map((v) => v.getId()).join(', ')}`,
      );

      // Queue for processing instead of processing immediately
      const videoIds = videoFiles.map((v) => v.getId());
      const queueResult = await this.queueVideoProcessingUseCase.execute(
        videoIds,
        1,
      );

      if (!queueResult.queued) {
        throw new Error('Failed to queue videos for processing');
      }

      this.logger.log(`Videos queued for processing: ${videoIds.length} files`);

      // Estimate processing time (rough calculation: 30 seconds per video + queue wait)
      const estimatedSeconds =
        videoIds.length * 30 + (queueResult.queuePosition || 0) * 90;
      const estimatedTime = this.formatEstimatedTime(estimatedSeconds);

      return {
        success: true,
        message: `${files.length} video(s) uploaded and queued for processing. You will be notified when processing is complete.`,
        videoIds,
        queuePosition: queueResult.queuePosition,
        estimatedProcessingTime: estimatedTime,
      };
    } catch (error) {
      this.logger.error(`Video upload/queue failed: ${error.message}`);

      if (error instanceof InvalidFileFormatException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      throw new HttpException(
        'An unexpected error occurred during video upload or queuing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('upload-single')
  @ApiOperation({ summary: 'Upload and process a single video file' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Single video file upload',
    type: UploadSingleVideoDto,
    schema: {
      type: 'object',
      properties: {
        video: {
          type: 'string',
          format: 'binary',
          description:
            'Video file to process (MP4, AVI, MOV, MKV, WMV, FLV, WebM)',
          example: 'video.mp4',
        },
      },
      required: ['video'],
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Video processed successfully',
    type: VideoProcessingResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid file format or size' })
  @ApiResponse({ status: 500, description: 'Video processing failed' })
  @UseInterceptors(FileInterceptor('video', multerConfig))
  async uploadSingleVideo(
    @UploadedFile() file: Express.Multer.File,
    @Headers('x-user-id') userId: string,
  ): Promise<VideoProcessingResponseDto> {
    if (!file) {
      throw new HttpException('Video file is required', HttpStatus.BAD_REQUEST);
    }

    if (!userId) {
      throw new HttpException(
        'User authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      this.logger.log(`Uploading video: ${file.originalname}`);

      const videoFile = await this.uploadVideoUseCase.executeSingle(
        file,
        userId,
      );
      this.logger.log(`Video uploaded with ID: ${videoFile.getId()}`);

      const result = await this.processVideoUseCase.executeSingle(
        videoFile.getId(),
      );
      this.logger.log(`Video processed successfully: ${result.getId()}`);

      return {
        success: true,
        message: `Video processed successfully! ${result.getFrameCount()} frames extracted.`,
        videoId: videoFile.getId(),
        zipPath: result.getZipFileName(),
        frameCount: result.getFrameCount(),
        frameNames: result.getFrameNames(),
      };
    } catch (error) {
      this.logger.error(`Video processing failed: ${error.message}`);

      if (error instanceof InvalidFileFormatException) {
        throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
      }

      if (error instanceof VideoProcessingException) {
        throw new HttpException(
          error.message,
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }

      throw new HttpException(
        'An unexpected error occurred during video processing',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get()
  @ApiOperation({
    summary: 'List all videos for authenticated user with processing results',
  })
  @ApiResponse({
    status: 200,
    description: 'User videos retrieved successfully with processing results',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          originalName: { type: 'string' },
          status: { type: 'string' },
          uploadedAt: { type: 'string' },
          processedAt: { type: 'string' },
          errorMessage: { type: 'string' },
          processingResult: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              zipPath: { type: 'string' },
              zipFileName: { type: 'string' },
              frameCount: { type: 'number' },
              frameNames: { type: 'array', items: { type: 'string' } },
              createdAt: { type: 'string' },
            },
          },
        },
      },
    },
  })
  async listUserVideos(@Headers('x-user-id') userId: string): Promise<any[]> {
    if (!userId) {
      throw new HttpException(
        'User authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const videosWithResults =
        await this.listUserVideosUseCase.execute(userId);
      return videosWithResults.map(({ video, processingResult }) => ({
        id: video.getId(),
        originalName: video.getOriginalName(),
        status: video.getStatus(),
        uploadedAt: video.getUploadedAt(),
        processedAt: video.getProcessedAt(),
        errorMessage: video.getErrorMessage(),
        processingResult: processingResult
          ? {
              id: processingResult.getId(),
              zipPath: processingResult.getZipPath(),
              zipFileName: processingResult.getZipFileName(),
              frameCount: processingResult.getFrameCount(),
              frameNames: processingResult.getFrameNames(),
              createdAt: processingResult.getCreatedAt(),
            }
          : null,
      }));
    } catch (error) {
      this.logger.error(`Failed to list user videos: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve user videos',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('status')
  @ApiOperation({
    summary: 'Get processing status of all videos and queue stats',
  })
  @ApiResponse({
    status: 200,
    description: 'Processing status and queue stats retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        files: { type: 'array' },
        total: { type: 'number' },
        queue: {
          type: 'object',
          properties: {
            messageCount: { type: 'number' },
            consumerCount: { type: 'number' },
            isConnected: { type: 'boolean' },
          },
        },
      },
    },
  })
  async getStatus(@Headers('x-user-id') userId: string): Promise<{
    files: any[];
    total: number;
    queue: {
      messageCount: number;
      consumerCount: number;
      isConnected: boolean;
    };
  }> {
    if (!userId) {
      throw new HttpException(
        'User authentication required',
        HttpStatus.UNAUTHORIZED,
      );
    }

    try {
      const [statusData, queueStats] = await Promise.all([
        this.getProcessingStatusUseCase.execute(userId),
        this.queueVideoProcessingUseCase.getQueueStats(),
      ]);

      return {
        files: statusData.files,
        total: statusData.total,
        queue: queueStats,
      };
    } catch (error) {
      this.logger.error(`Failed to get status: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve processing status',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('download/:filename')
  @ApiOperation({ summary: 'Download processed video frames as ZIP' })
  @ApiResponse({
    status: 200,
    description: 'File downloaded successfully',
    schema: {
      type: 'string',
      format: 'binary',
    },
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  async downloadFile(
    @Param('filename') filename: string,
    @Res() res: Response,
  ): Promise<void> {
    try {
      const filePath = await this.downloadResultUseCase.execute(filename);

      res.setHeader('Content-Description', 'File Transfer');
      res.setHeader('Content-Transfer-Encoding', 'binary');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.setHeader('Content-Type', 'application/zip');

      res.sendFile(filePath, { root: '.' });
    } catch (error) {
      this.logger.error(`Download failed: ${error.message}`);

      if (error instanceof ProcessingResultNotFoundException) {
        throw new HttpException('File not found', HttpStatus.NOT_FOUND);
      }

      throw new HttpException(
        'Failed to download file',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('queue/stats')
  @ApiOperation({ summary: 'Get detailed queue statistics' })
  @ApiResponse({
    status: 200,
    description: 'Queue statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        messageCount: { type: 'number' },
        consumerCount: { type: 'number' },
        isConnected: { type: 'boolean' },
        estimatedWaitTime: { type: 'string' },
      },
    },
  })
  async getQueueStats(): Promise<{
    messageCount: number;
    consumerCount: number;
    isConnected: boolean;
    estimatedWaitTime: string;
  }> {
    try {
      const stats = await this.queueVideoProcessingUseCase.getQueueStats();

      // Estimate wait time based on queue size and consumer count
      const avgProcessingTime = 90; // seconds per batch
      const waitTimeSeconds =
        stats.consumerCount > 0
          ? (stats.messageCount * avgProcessingTime) / stats.consumerCount
          : stats.messageCount * avgProcessingTime;

      return {
        ...stats,
        estimatedWaitTime: this.formatEstimatedTime(waitTimeSeconds),
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats: ${error.message}`);
      throw new HttpException(
        'Failed to retrieve queue statistics',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  private formatEstimatedTime(seconds: number): string {
    if (seconds < 60) {
      return `${seconds} seconds`;
    } else if (seconds < 3600) {
      const minutes = Math.ceil(seconds / 60);
      return `${minutes} minute${minutes > 1 ? 's' : ''}`;
    } else {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.ceil((seconds % 3600) / 60);
      return `${hours} hour${hours > 1 ? 's' : ''} ${minutes > 0 ? `${minutes} minute${minutes > 1 ? 's' : ''}` : ''}`;
    }
  }
}
