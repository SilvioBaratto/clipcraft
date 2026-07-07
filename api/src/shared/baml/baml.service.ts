import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Image } from '@boundaryml/baml';
import { b } from '../../../baml_client';
import type {
  AnimationSet,
  AnimationScene,
  PreviewTemplateOption,
  PreviewSelection,
} from '../../../baml_client/types';

@Injectable()
export class BamlService implements OnModuleInit {
  private readonly logger = new Logger(BamlService.name);

  onModuleInit() {
    this.logger.log('BAML Client initialized successfully');
  }

  /**
   * Pick the best-fitting cover template for a video and (for freeform
   * templates) write a short Italian title.
   */
  async pickPreviewTemplate(
    hook: string,
    templates: PreviewTemplateOption[],
  ): Promise<PreviewSelection> {
    try {
      this.logger.log(`Picking preview template among ${templates.length} options`);
      const result = await b.PickPreviewTemplate(hook, templates);
      this.logger.log(`Selected preview template: ${result.template_id}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to pick preview template: ${error.message}`);
      throw error;
    }
  }

  /**
   * Vision-assisted repair of a scene's HTML: Opus sees a screenshot of the
   * current render + the HTML, and returns corrected HTML (layout fixes only).
   */
  async repairSceneHTML(input: {
    html: string;
    screenshotBase64: string;
    mainText: string;
    subText?: string | null;
    sceneNumber: number;
    totalScenes: number;
  }): Promise<string> {
    try {
      this.logger.log(`Repairing scene ${input.sceneNumber}/${input.totalScenes} HTML with Opus (vision)`);
      const screenshot = Image.fromBase64('image/png', input.screenshotBase64);
      const result = await b.RepairSceneHTML(
        input.html,
        screenshot,
        input.mainText,
        input.subText ?? null,
        input.sceneNumber,
        input.totalScenes,
      );
      this.logger.log(`Scene ${input.sceneNumber} repaired (${result.length} chars)`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to repair scene HTML: ${error.message}`);
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
   * Get BAML client instance for advanced usage
   */
  getClient() {
    return b;
  }
}
