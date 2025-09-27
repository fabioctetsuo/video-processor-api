import { ApiProperty } from '@nestjs/swagger';

export class VideoProcessingResponseDto {
  @ApiProperty({
    description: 'Processing success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Processing message',
    example: 'Video processed successfully! 15 frames extracted.',
  })
  message: string;

  @ApiProperty({
    description: 'Video file ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  videoId: string;

  @ApiProperty({
    description: 'ZIP file name',
    example: 'frames_20231201_143052.zip',
    required: false,
  })
  zipPath?: string;

  @ApiProperty({
    description: 'Number of frames extracted',
    example: 15,
    required: false,
  })
  frameCount?: number;

  @ApiProperty({
    description: 'List of frame file names',
    example: ['frame_0001.png', 'frame_0002.png'],
    type: [String],
    required: false,
  })
  frameNames?: string[];
}
