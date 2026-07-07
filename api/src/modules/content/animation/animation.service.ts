import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { BamlService } from '../../../shared/baml/baml.service';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { RenderingService } from '../../../shared/rendering/rendering.service';
import type { AnimationSet } from '../../../../baml_client/types';
import type { Animation as PrismaAnimation, AnimationScene } from '@prisma/client';

export interface AnimationWithScenes extends PrismaAnimation {
  scenes: AnimationScene[];
}

/**
 * Extract the HTML document from a model response: drop ``` fences and any
 * prose the model added before <!DOCTYPE>/<html> or after </html>.
 */
function extractHtmlDocument(s: string): string {
  let t = s
    .replace(/^\s*```(?:html)?\s*\n?/i, '')
    .replace(/\n?```\s*$/i, '')
    .trim();

  const startDoctype = t.search(/<!doctype html/i);
  const start = startDoctype >= 0 ? startDoctype : t.search(/<html[\s>]/i);
  if (start > 0) t = t.slice(start);

  const end = t.toLowerCase().lastIndexOf('</html>');
  if (end >= 0) t = t.slice(0, end + '</html>'.length);

  return t.trim();
}

/** Parse the CHANGED/SUMMARY/---HTML--- envelope from the repair model. */
function parseRepairOutput(raw: string): { changed: boolean; summary: string; html: string } {
  const changedMatch = raw.match(/CHANGED:\s*(yes|no)/i);
  const summaryMatch = raw.match(/SUMMARY:\s*(.+)/i);
  const markerIdx = raw.indexOf('---HTML---');
  const html = markerIdx >= 0 ? raw.slice(markerIdx + '---HTML---'.length) : raw;
  return {
    changed: changedMatch ? /yes/i.test(changedMatch[1]) : true,
    summary: summaryMatch ? summaryMatch[1].trim() : '',
    html,
  };
}

@Injectable()
export class AnimationService {
  private readonly logger = new Logger(AnimationService.name);

  constructor(
    private readonly bamlService: BamlService,
    private readonly prisma: PrismaService,
    private readonly renderingService: RenderingService,
  ) {}

  /**
   * Vision-repair a scene: render its current HTML, let Opus see the screenshot
   * + HTML and return fixed HTML. Does NOT save — caller previews then confirms.
   */
  async repairScene(
    sceneId: string,
  ): Promise<{ id: string; changed: boolean; summary: string; repairedHtml: string }> {
    const scene = await this.prisma.animationScene.findUnique({
      where: { id: sceneId },
      include: { animation: true },
    });
    if (!scene) throw new NotFoundException(`Scene ${sceneId} not found`);
    if (!scene.generatedHtml) {
      throw new BadRequestException(`Scene ${sceneId} has no generated HTML to repair`);
    }

    const png = await this.renderingService.renderHtmlToPng(scene.generatedHtml, 1920, 1080, true);
    const raw = await this.bamlService.repairSceneHTML({
      html: scene.generatedHtml,
      screenshotBase64: png.toString('base64'),
      mainText: scene.mainText,
      subText: scene.subText,
      sceneNumber: scene.sceneNumber,
      totalScenes: scene.animation.totalScenes,
    });

    const parsed = parseRepairOutput(raw);
    return {
      id: sceneId,
      changed: parsed.changed,
      summary: parsed.summary,
      repairedHtml: extractHtmlDocument(parsed.html),
    };
  }

  /** Persist confirmed HTML for a scene (the "Keep" action). */
  async updateSceneHtml(sceneId: string, generatedHtml: string): Promise<{ id: string; generatedHtml: string }> {
    const existing = await this.prisma.animationScene.findUnique({ where: { id: sceneId } });
    if (!existing) throw new NotFoundException(`Scene ${sceneId} not found`);
    const scene = await this.prisma.animationScene.update({
      where: { id: sceneId },
      data: { generatedHtml: extractHtmlDocument(generatedHtml) },
    });
    return { id: scene.id, generatedHtml: scene.generatedHtml ?? '' };
  }

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
  async generateAndSaveAnimation(projectId: string, topic: string): Promise<AnimationWithScenes> {
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
      ):
        | 'TWO_COLUMN'
        | 'CENTERED'
        | 'FLOW_DIAGRAM'
        | 'SCATTER_PLOT'
        | 'GRID'
        | 'COMPARISON'
        | 'DASHBOARD' => {
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
      this.logger.error(`Failed to generate and save animation: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to generate animation. Please try again later.',
      );
    }
  }
}
