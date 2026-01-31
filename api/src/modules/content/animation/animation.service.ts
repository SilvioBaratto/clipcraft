import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { BamlService } from '../../../shared/baml/baml.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import type { AnimationSet } from '../../../../baml_client/types';
import type { Animation as PrismaAnimation, AnimationScene } from '@prisma/client';

export interface AnimationWithScenes extends PrismaAnimation {
  scenes: AnimationScene[];
}

@Injectable()
export class AnimationService {
  private readonly logger = new Logger(AnimationService.name);

  constructor(
    private readonly bamlService: BamlService,
    private readonly prisma: PrismaService,
  ) {}

  async generateAnimationSet(topic: string): Promise<AnimationSet> {
    try {
      this.logger.log(`Generating animation set for topic: ${topic}`);

      // The BAML function expects a script, so we'll use the topic as the script input
      const animationSet = await this.bamlService.structureAnimations(topic);

      this.logger.log(
        `Successfully generated animation set with ${animationSet.total_scenes} scenes`,
      );
      return animationSet;
    } catch (error) {
      this.logger.error(`Failed to generate animation set: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to generate animation set. Please try again later.',
      );
    }
  }

  async generateAnimationSetWithHTML(topic: string): Promise<{
    animationSet: AnimationSet;
    htmlScenes: string[];
  }> {
    try {
      this.logger.log(`Generating animation set with HTML for topic: ${topic}`);
      const animationSet = await this.bamlService.structureAnimations(topic);
      const htmlScenes = await this.bamlService.generateAnimationHTML(animationSet);

      this.logger.log(
        `Successfully generated animation set with HTML (${animationSet.total_scenes} scenes)`,
      );

      return {
        animationSet,
        htmlScenes,
      };
    } catch (error) {
      this.logger.error(
        `Failed to generate animation set with HTML: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate animation set with HTML. Please try again later.',
      );
    }
  }

  /**
   * Generate animation set with HTML and save to database
   * @param projectId - The project ID to associate the animation with
   * @param topic - The topic/script for generation
   * @returns The saved animation with scenes
   */
  async generateAndSaveAnimation(
    projectId: string,
    topic: string,
  ): Promise<AnimationWithScenes> {
    try {
      this.logger.log(`Generating and saving animation for project: ${projectId}`);

      // Generate animation structure and HTML
      const animationSet = await this.bamlService.structureAnimations(topic);
      const htmlScenes = await this.bamlService.generateAnimationHTML(animationSet);

      // Map scene types from BAML to Prisma enums
      const mapSceneType = (
        type: string,
      ): 'INTRO' | 'EXPLANATION' | 'VISUALIZATION' | 'COMPARISON' | 'CTA' => {
        const typeUpper = type.toUpperCase();
        if (typeUpper === 'INTRO') return 'INTRO';
        if (typeUpper === 'EXPLANATION') return 'EXPLANATION';
        if (typeUpper === 'VISUALIZATION') return 'VISUALIZATION';
        if (typeUpper === 'COMPARISON') return 'COMPARISON';
        if (typeUpper === 'CTA') return 'CTA';
        return 'EXPLANATION';
      };

      // Map visual types from BAML to Prisma enums
      const mapVisualType = (
        type: string,
      ): 'TWO_COLUMN' | 'CENTERED' | 'FLOW_DIAGRAM' | 'SCATTER_PLOT' | 'GRID' | 'COMPARISON' | 'DASHBOARD' => {
        const typeUpper = type.toUpperCase().replace(/-/g, '_');
        if (typeUpper === 'TWO_COLUMN') return 'TWO_COLUMN';
        if (typeUpper === 'CENTERED') return 'CENTERED';
        if (typeUpper === 'FLOW_DIAGRAM') return 'FLOW_DIAGRAM';
        if (typeUpper === 'SCATTER_PLOT') return 'SCATTER_PLOT';
        if (typeUpper === 'GRID') return 'GRID';
        if (typeUpper === 'COMPARISON') return 'COMPARISON';
        if (typeUpper === 'DASHBOARD') return 'DASHBOARD';
        return 'CENTERED';
      };

      // Save to database with nested create
      const savedAnimation = await this.prisma.animation.create({
        data: {
          projectId,
          topic: animationSet.topic,
          totalScenes: animationSet.total_scenes,
          colorAccent: animationSet.color_accent,
          secondaryAccent: animationSet.secondary_accent || null,
          sourceScript: topic,
          status: 'COMPLETED',
          scenes: {
            create: animationSet.scenes.map((scene, index) => ({
              sceneNumber: scene.scene_number,
              sceneType: mapSceneType(scene.scene_type),
              mainText: scene.main_text,
              subText: scene.sub_text || null,
              visualType: mapVisualType(scene.visual_type),
              visualElements: JSON.stringify(scene.visual_elements || []),
              emoji: scene.emoji || null,
              label: scene.label || null,
              generationPrompt: `Scene ${scene.scene_number}: ${scene.main_text}`,
              generatedHtml: htmlScenes[index] || null,
            })),
          },
        },
        include: {
          scenes: {
            orderBy: { sceneNumber: 'asc' },
          },
        },
      });

      this.logger.log(
        `Successfully saved animation ${savedAnimation.id} with ${savedAnimation.scenes.length} scenes`,
      );

      return savedAnimation;
    } catch (error) {
      this.logger.error(
        `Failed to generate and save animation: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to generate animation. Please try again later.',
      );
    }
  }
}
