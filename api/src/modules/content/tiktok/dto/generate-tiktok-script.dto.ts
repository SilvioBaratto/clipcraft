import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateTikTokScriptDto {
  @ApiProperty({
    description: 'Topic or script content for the TikTok script generation',
    example: 'How to make the perfect espresso at home',
    minLength: 5,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(5, { message: 'Topic must be at least 5 characters long' })
  topic: string;
}
