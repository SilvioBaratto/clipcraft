import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { b } from '../../../baml_client';
import type { AnimationSet, AnimationScene } from '../../../baml_client/types';

@Injectable()
export class BamlService implements OnModuleInit {
  private readonly logger = new Logger(BamlService.name);

  onModuleInit() {
    this.logger.log('BAML Client initialized successfully');
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
   * Get BAML client instance for advanced usage
   */
  getClient() {
    return b;
  }
}
