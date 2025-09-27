import { ApiProperty } from '@nestjs/swagger';

export class ProcessingFileDto {
  @ApiProperty({
    description: 'ZIP file name',
    example: 'frames_20231201_143052.zip',
  })
  filename: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024768,
  })
  size: number;

  @ApiProperty({
    description: 'File creation date',
    example: '2023-12-01 14:30:52',
  })
  createdAt: string;

  @ApiProperty({
    description: 'Download URL',
    example: '/api/v1/videos/download/frames_20231201_143052.zip',
  })
  downloadUrl: string;

  @ApiProperty({
    description: 'Number of frames in the ZIP',
    example: 15,
  })
  frameCount: number;
}

export class ProcessingStatusResponseDto {
  @ApiProperty({
    description: 'List of processed files',
    type: [ProcessingFileDto],
  })
  files: ProcessingFileDto[];

  @ApiProperty({
    description: 'Total number of files',
    example: 5,
  })
  total: number;
}
