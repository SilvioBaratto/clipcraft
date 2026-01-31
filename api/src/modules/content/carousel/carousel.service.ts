import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { BamlService } from '../../../shared/baml/baml.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { Carousel } from '../../../../baml_client/types';
import type { Carousel as PrismaCarousel, CarouselSlide, Preview } from '@prisma/client';

export interface CarouselWithSlides extends PrismaCarousel {
  slides: CarouselSlide[];
}

export interface CarouselWithSlidesAndPreview extends PrismaCarousel {
  slides: CarouselSlide[];
  preview: Preview | null;
}

@Injectable()
export class CarouselService {
  private readonly logger = new Logger(CarouselService.name);

  constructor(
    private readonly bamlService: BamlService,
    private readonly prisma: PrismaService,
  ) {}

  async generateCarousel(
    topic: string,
    platform: string = 'Instagram',
    canvas: string = 'Square',
    ratio: string = '1:1',
  ): Promise<Carousel> {
    try {
      this.logger.log(`Generating carousel for topic: ${topic}`);

      // The BAML function expects a script and platform parameters
      // We'll use the topic as the script input for structuring
      const carousel = await this.bamlService.structureCarousel(topic, platform, canvas, ratio);

      this.logger.log(`Successfully generated carousel with ${carousel.total_slides} slides`);
      return carousel;
    } catch (error) {
      this.logger.error(`Failed to generate carousel: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to generate carousel. Please try again later.',
      );
    }
  }

  async generateCarouselWithHTML(
    topic: string,
    platform: string = 'Instagram',
    canvas: string = 'Square',
    ratio: string = '1:1',
    width: number = 1080,
    height: number = 1080,
  ): Promise<{
    carousel: Carousel;
    htmlSlides: string[];
  }> {
    try {
      this.logger.log(`Generating carousel with HTML for topic: ${topic}`);
      const carousel = await this.bamlService.structureCarousel(topic, platform, canvas, ratio);
      const htmlSlides = await this.bamlService.generateCarouselHTML(carousel, width, height);

      this.logger.log(
        `Successfully generated carousel with HTML (${carousel.total_slides} slides)`,
      );

      return {
        carousel,
        htmlSlides,
      };
    } catch (error) {
      this.logger.error(`Failed to generate carousel with HTML: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to generate carousel with HTML. Please try again later.',
      );
    }
  }

  /**
   * Generate carousel with HTML and save to database
   * @param projectId - The project ID to associate the carousel with
   * @param topic - The topic/script for generation
   * @param platform - Platform (e.g., 'Instagram')
   * @param canvas - Canvas size (e.g., '1080x1350')
   * @param ratio - Aspect ratio (e.g., '4:5')
   * @param width - Width in pixels
   * @param height - Height in pixels
   * @returns The saved carousel with slides
   */
  async generateAndSaveCarousel(
    projectId: string,
    topic: string,
    platform: string = 'Instagram',
    canvas: string = '1080x1350',
    ratio: string = '4:5',
    width: number = 1080,
    height: number = 1350,
  ): Promise<CarouselWithSlides> {
    try {
      this.logger.log(`Generating and saving carousel for project: ${projectId}`);

      // Generate carousel structure and HTML
      const carousel = await this.bamlService.structureCarousel(topic, platform, canvas, ratio);
      const htmlSlides = await this.bamlService.generateCarouselHTML(carousel, width, height);

      // Map slide types from BAML to Prisma enums
      const mapSlideType = (type: string): 'HOOK' | 'CONTENT' | 'CTA' => {
        const typeUpper = type.toUpperCase();
        if (typeUpper === 'HOOK') return 'HOOK';
        if (typeUpper === 'CTA') return 'CTA';
        return 'CONTENT';
      };

      // Save to database with nested create
      const savedCarousel = await this.prisma.carousel.create({
        data: {
          projectId,
          topic: carousel.topic,
          totalSlides: carousel.total_slides,
          colorAccent: carousel.color_accent,
          secondaryAccent: carousel.secondary_accent || null,
          platform,
          canvas,
          ratio,
          sourceScript: topic,
          status: 'COMPLETED',
          slides: {
            create: carousel.slides.map((slide, index) => ({
              slideNumber: slide.slide_number,
              slideType: mapSlideType(slide.slide_type),
              mainText: slide.main_text,
              highlightText: slide.highlight_text || null,
              subText: slide.sub_text || null,
              dataVisual: slide.data_visual || null,
              emoji: slide.emoji || null,
              label: slide.label || null,
              generationPrompt: `Slide ${slide.slide_number}: ${slide.main_text}`,
              generatedHtml: htmlSlides[index] || null,
            })),
          },
        },
        include: {
          slides: {
            orderBy: { slideNumber: 'asc' },
          },
        },
      });

      this.logger.log(
        `Successfully saved carousel ${savedCarousel.id} with ${savedCarousel.slides.length} slides`,
      );

      return savedCarousel;
    } catch (error) {
      this.logger.error(
        `Failed to generate and save carousel: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate carousel. Please try again later.',
      );
    }
  }
}
