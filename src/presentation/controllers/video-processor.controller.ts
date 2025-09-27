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
  Res,
  Logger,
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
import { GetProcessingStatusUseCase } from '../../application/use-cases/get-processing-status.use-case';
import { DownloadResultUseCase } from '../../application/use-cases/download-result.use-case';
import { VideoProcessingResponseDto } from '../../application/dto/video-processing-response.dto';
import { ProcessingStatusResponseDto } from '../../application/dto/processing-status-response.dto';
import {
  UploadVideoDto,
  UploadSingleVideoDto,
} from '../../application/dto/upload-video.dto';
import { multerConfig } from '../../shared/utils/multer-config';
import {
  VideoFileNotFoundException,
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
    private readonly getProcessingStatusUseCase: GetProcessingStatusUseCase,
    private readonly downloadResultUseCase: DownloadResultUseCase,
  ) {}

  @Post('upload')
  @ApiOperation({
    summary: 'Upload and process multiple video files (1-3 videos)',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Multiple video files upload (1-3 files)',
    type: UploadVideoDto,
  })
  @ApiResponse({
    status: 200,
    description: 'Videos processed successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              videoId: { type: 'string' },
              originalName: { type: 'string' },
              zipPath: { type: 'string' },
              frameCount: { type: 'number' },
              frameNames: { type: 'array', items: { type: 'string' } },
            },
          },
        },
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
  ): Promise<{ success: boolean; message: string; results: any[] }> {
    if (!files || files.length === 0) {
      throw new HttpException(
        'At least one video file is required',
        HttpStatus.BAD_REQUEST,
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

      const videoFiles = await this.uploadVideoUseCase.execute(files);
      this.logger.log(
        `Videos uploaded with IDs: ${videoFiles.map((v) => v.getId()).join(', ')}`,
      );

      const videoIds = videoFiles.map((v) => v.getId());
      const results = await this.processVideoUseCase.execute(videoIds);
      this.logger.log(`Videos processed successfully: ${results.length} files`);

      const responseResults = results.map((result, index) => ({
        videoId: videoFiles[index].getId(),
        originalName: videoFiles[index].getOriginalName(),
        zipPath: result.getZipFileName(),
        frameCount: result.getFrameCount(),
        frameNames: result.getFrameNames(),
      }));

      const totalFrames = results.reduce(
        (sum, result) => sum + result.getFrameCount(),
        0,
      );

      return {
        success: true,
        message: `${files.length} video(s) processed successfully! ${totalFrames} total frames extracted.`,
        results: responseResults,
      };
    } catch (error) {
      this.logger.error(`Videos processing failed: ${error.message}`);

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
        'An unexpected error occurred during videos processing',
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
  ): Promise<VideoProcessingResponseDto> {
    if (!file) {
      throw new HttpException('Video file is required', HttpStatus.BAD_REQUEST);
    }

    try {
      this.logger.log(`Uploading video: ${file.originalname}`);

      const videoFile = await this.uploadVideoUseCase.executeSingle(file);
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

  @Get('status')
  @ApiOperation({ summary: 'Get processing status of all videos' })
  @ApiResponse({
    status: 200,
    description: 'Processing status retrieved successfully',
    type: ProcessingStatusResponseDto,
  })
  async getStatus(): Promise<ProcessingStatusResponseDto> {
    try {
      const statusData = await this.getProcessingStatusUseCase.execute();

      return {
        files: statusData.files,
        total: statusData.total,
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
}
