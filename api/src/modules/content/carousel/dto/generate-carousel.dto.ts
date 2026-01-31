import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateCarouselDto {
  @ApiProperty({
    description: 'Topic or script content for the carousel generation',
    example: '5 tips for better productivity',
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Topic must be at least 5 characters long' })
  topic: string;

  @ApiPropertyOptional({
    description: 'Project ID to associate the carousel with',
    example: 'clx1234567890',
  })
  @IsString()
  @IsOptional()
  projectId?: string;

  @ApiPropertyOptional({
    description: 'Platform for the carousel',
    example: 'Instagram',
    default: 'Instagram',
  })
  @IsString()
  @IsOptional()
  platform?: string;

  @ApiPropertyOptional({
    description: 'Canvas type for the carousel',
    example: 'Square',
    default: 'Square',
  })
  @IsString()
  @IsOptional()
  canvas?: string;

  @ApiPropertyOptional({
    description: 'Aspect ratio for the carousel',
    example: '1:1',
    default: '1:1',
  })
  @IsString()
  @IsOptional()
  ratio?: string;
}
