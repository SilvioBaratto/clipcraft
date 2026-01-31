import { IsString, IsNotEmpty, MinLength, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GeneratePreviewDto {
  @ApiProperty({
    description: 'Main text/hook for the preview thumbnail',
    example: 'Sapevi che Netflix usa AI per le copertine?',
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Main text must be at least 5 characters long' })
  mainText: string;

  @ApiProperty({
    description: 'Project ID to associate the preview with',
    example: 'clx1234567890',
  })
  @IsString()
  @IsNotEmpty()
  projectId: string;

  @ApiPropertyOptional({
    description: 'Platform for the preview (instagram, tiktok)',
    example: 'instagram',
    default: 'instagram',
  })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Width in pixels',
    example: 1080,
    default: 1080,
  })
  @IsNumber()
  @IsOptional()
  width?: number;

  @ApiPropertyOptional({
    description: 'Height in pixels',
    example: 1920,
    default: 1920,
  })
  @IsNumber()
  @IsOptional()
  height?: number;

  @ApiPropertyOptional({
    description: 'Accent color for the preview',
    example: '#FF5733',
  })
  @IsString()
  @IsOptional()
  colorAccent?: string;

  @ApiPropertyOptional({
    description: 'Highlight text to emphasize',
    example: 'Netflix',
  })
  @IsString()
  @IsOptional()
  highlightText?: string;

  @ApiPropertyOptional({
    description: 'Sub text for additional context',
    example: 'Scopri come funziona',
  })
  @IsString()
  @IsOptional()
  subText?: string;

  @ApiPropertyOptional({
    description: 'Emoji for visual anchor',
    example: '🎬',
  })
  @IsString()
  @IsOptional()
  emoji?: string;

  @ApiPropertyOptional({
    description: 'Label/tag text',
    example: 'Tech',
  })
  @IsString()
  @IsOptional()
  label?: string;
}
