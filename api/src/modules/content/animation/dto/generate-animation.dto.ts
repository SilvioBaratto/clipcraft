import { IsString, IsNotEmpty, MinLength, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateAnimationDto {
  @ApiProperty({
    description: 'Topic or script content for the animation generation',
    example: 'The water cycle explained',
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Topic must be at least 5 characters long' })
  topic: string;

  @ApiPropertyOptional({
    description: 'Project ID to associate the animation with',
    example: 'clx1234567890',
  })
  @IsString()
  @IsOptional()
  projectId?: string;
}
