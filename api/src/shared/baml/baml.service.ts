import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { b } from '../../../baml_client';
import type {
  TikTokScript,
  Carousel,
  AnimationSet,
  CarouselSlide,
  AnimationScene,
} from '../../../baml_client/types';

@Injectable()
export class BamlService implements OnModuleInit {
  private readonly logger = new Logger(BamlService.name);

  onModuleInit() {
    this.logger.log('BAML Client initialized successfully');
  }

  /**
   * Generate a complete TikTok script from raw script text
   */
  async generateCompleteTikTokScript(rawScript: string): Promise<TikTokScript> {
    try {
      this.logger.log(`Generating complete TikTok script from raw script`);
      const result = await b.GenerateCompleteTikTokScript(rawScript);
      this.logger.log(`Successfully generated TikTok script: ${result.folder_name}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to generate TikTok script: ${error.message}`);
      throw error;
    }
  }

  /**
   * Structure a carousel from a script with platform and canvas parameters
   */
  async structureCarousel(
    script: string,
    platform: string = 'Instagram',
    canvas: string = 'Square',
    ratio: string = '1:1',
  ): Promise<Carousel> {
    try {
      this.logger.log(`Structuring carousel for platform: ${platform}`);
      const result = await b.StructureCarousel(script, platform, canvas, ratio);
      this.logger.log(`Successfully structured carousel with ${result.total_slides} slides`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to structure carousel: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate HTML for a single carousel slide
   */
  async generateSlideHTML(
    slide: CarouselSlide,
    totalSlides: number,
    width: number,
    height: number,
    colorAccent: string,
    secondaryAccent?: string | null,
  ): Promise<string> {
    try {
      this.logger.log(`Generating HTML for slide ${slide.slide_number}/${totalSlides}`);
      const result = await b.GenerateSlideHTML(
        slide.generation_prompt,
        slide.slide_number,
        totalSlides,
        width,
        height,
        colorAccent,
        secondaryAccent,
        slide.main_text,
        slide.highlight_text,
        slide.sub_text,
        slide.data_visual,
        slide.emoji,
        slide.label,
      );
      this.logger.log(`Successfully generated HTML for slide ${slide.slide_number}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to generate slide HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate HTML for all slides in a carousel
   */
  async generateCarouselHTML(
    carousel: Carousel,
    width: number = 1080,
    height: number = 1080,
  ): Promise<string[]> {
    try {
      this.logger.log(`Generating HTML for carousel: ${carousel.topic}`);
      const htmlSlides = await Promise.all(
        carousel.slides.map((slide) =>
          this.generateSlideHTML(
            slide,
            carousel.total_slides,
            width,
            height,
            carousel.color_accent,
            carousel.secondary_accent,
          ),
        ),
      );
      this.logger.log(`Successfully generated HTML for ${htmlSlides.length} slides`);
      return htmlSlides;
    } catch (error) {
      this.logger.error(`Failed to generate carousel HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Structure animations from a script
   */
  async structureAnimations(script: string): Promise<AnimationSet> {
    try {
      this.logger.log(`Structuring animations from script`);
      const result = await b.StructureAnimations(script);
      this.logger.log(`Successfully structured animation set with ${result.total_scenes} scenes`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to structure animations: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate HTML for a single animation scene
   */
  async generateAnimationSceneHTML(
    scene: AnimationScene,
    totalScenes: number,
    colorAccent: string,
    secondaryAccent?: string | null,
  ): Promise<string> {
    try {
      this.logger.log(`Generating HTML for scene ${scene.scene_number}/${totalScenes}`);
      const result = await b.GenerateAnimationHTML(
        scene.generation_prompt,
        scene.scene_number,
        totalScenes,
        colorAccent,
        secondaryAccent,
        scene.main_text,
        scene.sub_text,
        scene.visual_type,
        scene.visual_elements,
        scene.emoji,
        scene.label,
      );
      this.logger.log(`Successfully generated HTML for scene ${scene.scene_number}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to generate animation scene HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate HTML for all scenes in an animation set
   */
  async generateAnimationHTML(animationSet: AnimationSet): Promise<string[]> {
    try {
      this.logger.log(`Generating HTML for animation: ${animationSet.topic}`);
      const htmlScenes = await Promise.all(
        animationSet.scenes.map((scene) =>
          this.generateAnimationSceneHTML(
            scene,
            animationSet.total_scenes,
            animationSet.color_accent,
            animationSet.secondary_accent,
          ),
        ),
      );
      this.logger.log(`Successfully generated HTML for ${htmlScenes.length} scenes`);
      return htmlScenes;
    } catch (error) {
      this.logger.error(`Failed to generate animation HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate HTML for a preview thumbnail
   */
  async generatePreviewHTML(
    generationPrompt: string,
    width: number,
    height: number,
    colorAccent: string,
    secondaryAccent: string | null,
    mainText: string,
    highlightText: string | null,
    subText: string | null,
    emoji: string | null,
    label: string | null,
  ): Promise<string> {
    try {
      this.logger.log(`Generating preview HTML (${width}x${height})`);
      const result = await b.GeneratePreviewHTML(
        generationPrompt,
        width,
        height,
        colorAccent,
        secondaryAccent,
        mainText,
        highlightText,
        subText,
        emoji,
        label,
      );
      this.logger.log(`Successfully generated preview HTML`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to generate preview HTML: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get BAML client instance for advanced usage
   */
  getClient() {
    return b;
  }
}
