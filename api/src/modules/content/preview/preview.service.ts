import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { BamlService } from '../../../shared/baml/baml.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { Preview as PrismaPreview } from '@prisma/client';

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);

  constructor(
    private readonly bamlService: BamlService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Generate preview HTML without saving to database
   */
  async generatePreviewHTML(
    mainText: string,
    platform: string = 'instagram',
    width: number = 1080,
    height: number = 1920,
    colorAccent: string = '#FF5733',
    highlightText?: string,
    subText?: string,
    emoji?: string,
    label?: string,
  ): Promise<string> {
    try {
      this.logger.log(`Generating preview HTML for platform: ${platform}`);

      const generationPrompt = `Create a scroll-stopping ${platform} preview thumbnail for: "${mainText}"`;

      const html = await this.bamlService.generatePreviewHTML(
        generationPrompt,
        width,
        height,
        colorAccent,
        null,
        mainText,
        highlightText || null,
        subText || null,
        emoji || null,
        label || null,
      );

      this.logger.log(`Successfully generated preview HTML for ${platform}`);
      return html;
    } catch (error) {
      this.logger.error(`Failed to generate preview HTML: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to generate preview. Please try again later.',
      );
    }
  }

  /**
   * Generate and save preview to database
   */
  async generateAndSavePreview(
    projectId: string,
    mainText: string,
    platform: string = 'instagram',
    width: number = 1080,
    height: number = 1920,
    colorAccent: string = '#FF5733',
    secondaryAccent?: string,
    highlightText?: string,
    subText?: string,
    emoji?: string,
    label?: string,
  ): Promise<PrismaPreview> {
    try {
      this.logger.log(`Generating and saving ${platform} preview for project: ${projectId}`);

      const generationPrompt = `Create a scroll-stopping ${platform} preview thumbnail for: "${mainText}"`;

      // Generate HTML
      const generatedHtml = await this.bamlService.generatePreviewHTML(
        generationPrompt,
        width,
        height,
        colorAccent,
        secondaryAccent || null,
        mainText,
        highlightText || null,
        subText || null,
        emoji || null,
        label || null,
      );

      // Save to database
      const preview = await this.prisma.preview.create({
        data: {
          projectId,
          platform,
          width,
          height,
          colorAccent,
          secondaryAccent: secondaryAccent || null,
          mainText,
          highlightText: highlightText || null,
          subText: subText || null,
          emoji: emoji || null,
          label: label || null,
          generationPrompt,
          generatedHtml,
          status: 'COMPLETED',
        },
      });

      this.logger.log(`Successfully saved ${platform} preview ${preview.id}`);
      return preview;
    } catch (error) {
      this.logger.error(
        `Failed to generate and save preview: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate preview. Please try again later.',
      );
    }
  }

  /**
   * Generate both Instagram and TikTok previews for a project
   */
  async generateAllPreviewsForProject(
    projectId: string,
    mainText: string,
    colorAccent: string = '#FF5733',
    secondaryAccent?: string,
    highlightText?: string,
    subText?: string,
    emoji?: string,
    label?: string,
  ): Promise<PrismaPreview[]> {
    this.logger.log(`Generating all previews for project: ${projectId}`);

    const previews = await Promise.all([
      // Instagram preview (9:16 portrait)
      this.generateAndSavePreview(
        projectId,
        mainText,
        'instagram',
        1080,
        1920,
        colorAccent,
        secondaryAccent,
        highlightText,
        subText,
        emoji,
        label,
      ),
      // TikTok preview (3:4 portrait)
      this.generateAndSavePreview(
        projectId,
        mainText,
        'tiktok',
        1080,
        1440,
        colorAccent,
        secondaryAccent,
        highlightText,
        subText,
        emoji,
        label,
      ),
    ]);

    this.logger.log(`Successfully generated ${previews.length} previews for project ${projectId}`);
    return previews;
  }
}
