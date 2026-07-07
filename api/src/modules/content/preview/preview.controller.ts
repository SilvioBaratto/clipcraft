import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Res,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString } from 'class-validator';
import { createReadStream } from 'fs';
import type { Response } from 'express';
import { PreviewService } from './preview.service';
import { Platform, PreviewTemplateService } from './preview-template.service';

class OverridePreviewBody {
  @IsOptional()
  @IsString()
  templateId?: string;

  @IsOptional()
  @IsString()
  title?: string | null;

  @IsOptional()
  @IsInt()
  parte?: number | null;
}

@ApiTags('Preview')
@Controller()
export class PreviewController {
  constructor(
    private readonly previewService: PreviewService,
    private readonly templates: PreviewTemplateService,
  ) {}

  @Get('content/preview/templates')
  @ApiOperation({ summary: 'List available cover templates (for the override picker)' })
  listTemplates() {
    return this.templates.list();
  }

  @Post('projects/:id/generate/previews')
  @ApiOperation({ summary: 'LLM-pick + render the Instagram/TikTok covers for a project' })
  generate(@Param('id') id: string) {
    return this.previewService.generateForProject(id);
  }

  @Patch('projects/:id/preview')
  @ApiOperation({ summary: 'Override the preview (template / title / parte) and re-render' })
  override(@Param('id') id: string, @Body() dto: OverridePreviewBody) {
    return this.previewService.override(id, dto);
  }

  @Get('projects/:id/preview/:platform')
  @ApiOperation({ summary: 'Stream the rendered cover PNG for a platform' })
  async image(
    @Param('id') id: string,
    @Param('platform') platform: string,
    @Res() res: Response,
  ): Promise<void> {
    if (platform !== 'instagram' && platform !== 'tiktok') {
      throw new BadRequestException('platform must be "instagram" or "tiktok"');
    }
    const file = await this.previewService.getImageFile(id, platform as Platform);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Cache-Control', 'no-store');
    createReadStream(file).pipe(res);
  }
}
