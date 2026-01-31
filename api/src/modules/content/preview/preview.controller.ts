import { Body, Controller, Post, HttpCode, HttpStatus, BadRequestException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PreviewService } from './preview.service';
import { GeneratePreviewDto } from './dto/generate-preview.dto';

@ApiTags('Preview')
@Controller('content/preview')
export class PreviewController {
  constructor(private readonly previewService: PreviewService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate preview',
    description: 'Generates a preview thumbnail and saves it to the database',
  })
  @ApiResponse({
    status: 201,
    description: 'Preview generated and saved successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'projectId is required',
  })
  async generatePreview(@Body() dto: GeneratePreviewDto) {
    if (!dto.projectId) {
      throw new BadRequestException('projectId is required');
    }

    const preview = await this.previewService.generateAndSavePreview(
      dto.projectId,
      dto.mainText,
      dto.platform || 'instagram',
      dto.width || 1080,
      dto.height || 1920,
      dto.colorAccent || '#FF5733',
      undefined,
      dto.highlightText,
      dto.subText,
      dto.emoji,
      dto.label,
    );

    return preview;
  }
}
