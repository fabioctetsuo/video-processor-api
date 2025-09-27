import { ApiProperty } from '@nestjs/swagger';

export class UploadVideoDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description:
      'Video files to process (1-3 files). Supported formats: MP4, AVI, MOV, MKV, WMV, FLV, WebM. Maximum size: 100MB per file.',
    maxItems: 3,
    minItems: 1,
  })
  videos: Express.Multer.File[];
}

export class UploadSingleVideoDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description:
      'Single video file to process. Supported formats: MP4, AVI, MOV, MKV, WMV, FLV, WebM. Maximum size: 100MB.',
    example: 'sample-video.mp4',
  })
  video: Express.Multer.File;
}
