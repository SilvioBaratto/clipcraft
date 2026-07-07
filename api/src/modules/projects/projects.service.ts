import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Project, Animation, AnimationScene, Preview } from '@prisma/client';
import archiver = require('archiver');
import type { Response } from 'express';
import { BamlService } from '../../shared/baml/baml.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { RenderingService } from '../../shared/rendering/rendering.service';
import { AnimationService } from '../content/animation/animation.service';
import {
  CreateProjectDto,
  ProjectResponseDto,
  AnimationResponseDto,
  AnimationSceneResponseDto,
  PreviewResponseDto,
} from './dto/extract-metadata.dto';

// Types for Prisma includes
type AnimationWithScenes = Animation & { scenes: AnimationScene[] };
type ProjectWithRelations = Project & {
  animations: AnimationWithScenes[];
  preview: Preview | null;
};

const PROJECT_INCLUDE = {
  animations: {
    include: { scenes: { orderBy: { sceneNumber: 'asc' as const } } },
    orderBy: { createdAt: 'desc' as const },
  },
  preview: true,
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly bamlService: BamlService,
    private readonly prisma: PrismaService,
    private readonly renderingService: RenderingService,
    private readonly animationService: AnimationService,
  ) {}

  async createProject(dto: CreateProjectDto): Promise<ProjectResponseDto> {
    this.logger.log('Creating new project from script');

    // Extract metadata using AI
    const bamlClient = this.bamlService.getClient();
    const metadata = await bamlClient.ExtractProjectMetadata(dto.script);

    this.logger.log(`Extracted metadata: ${metadata.name}`);

    // Generate thumbnail URL
    const thumbnail = `https://picsum.photos/seed/${metadata.thumbnailSeed}/400/300`;

    // Save to database
    const project = await this.prisma.project.create({
      data: {
        name: metadata.name,
        title: metadata.title,
        folderName: metadata.folderName,
        hook: metadata.hook,
        thumbnail,
        sourceScript: dto.script,
        userId: dto.userId || null,
      },
      include: PROJECT_INCLUDE,
    });

    this.logger.log(`Project created with ID: ${project.id}`);

    return this.toResponseDto(project as ProjectWithRelations);
  }

  async findAll(): Promise<ProjectResponseDto[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: PROJECT_INCLUDE,
    });

    return projects.map((p) => this.toResponseDto(p as ProjectWithRelations));
  }

  async findById(id: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return this.toResponseDto(project as ProjectWithRelations);
  }

  async delete(id: string): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    await this.prisma.project.delete({
      where: { id },
    });

    this.logger.log(`Project ${id} deleted`);
  }

  /**
   * Stream a ZIP archive of all project content rendered as PNGs
   */
  async streamProjectZip(id: string, res: Response): Promise<void> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: PROJECT_INCLUDE,
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    // Collect render jobs
    interface RenderJob {
      folder: string;
      filename: string;
      html: string;
      width: number;
      height: number;
      skipLogo: boolean;
    }

    const jobs: RenderJob[] = [];

    // Animations: 1920x1080, no logo
    for (const animation of project.animations) {
      for (const scene of animation.scenes) {
        if (scene.generatedHtml) {
          jobs.push({
            folder: 'animations',
            filename: `scene-${scene.sceneNumber}.png`,
            html: scene.generatedHtml,
            width: 1920,
            height: 1080,
            skipLogo: true,
          });
        }
      }
    }

    const zipName = `${project.folderName || project.name}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 5 } });
    archive.pipe(res);

    this.logger.log(`Starting ZIP render for project ${id}: ${jobs.length} jobs`);

    for (const job of jobs) {
      try {
        const pngBuffer = await this.renderingService.renderHtmlToPng(
          job.html,
          job.width,
          job.height,
          job.skipLogo,
        );
        archive.append(pngBuffer, { name: `${job.folder}/${job.filename}` });
        this.logger.log(`Rendered ${job.folder}/${job.filename}`);
      } catch (error) {
        this.logger.error(`Failed to render ${job.folder}/${job.filename}: ${error.message}`);
      }
    }

    await archive.finalize();
    this.logger.log(`ZIP archive finalized for project ${id}`);
  }

  async updateStatus(id: string, status: { hasAnimations?: boolean }): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.update({
      where: { id },
      data: status,
      include: PROJECT_INCLUDE,
    });

    return this.toResponseDto(project as ProjectWithRelations);
  }

  async updateScript(id: string, sourceScript: string): Promise<ProjectResponseDto> {
    const hookMatch = sourceScript.match(/^##\s*Hook\s*\n([\s\S]*?)(?=\n##|$)/im);
    const hook = hookMatch ? hookMatch[1].trim() : undefined;

    const project = await this.prisma.project.update({
      where: { id },
      data: { sourceScript, ...(hook !== undefined && { hook }) },
      include: PROJECT_INCLUDE,
    });

    return this.toResponseDto(project as ProjectWithRelations);
  }

  /**
   * Generate all content (animations) for a project
   */
  async generateAllContent(id: string): Promise<ProjectResponseDto> {
    await this.generateAnimationContent(id);
    return this.findById(id);
  }

  /**
   * Generate animation content for a project
   */
  async generateAnimationContent(id: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    this.logger.log(`Generating animations for project ${id}`);
    await this.prisma.animation.deleteMany({ where: { projectId: id } });

    await this.animationService.generateAndSaveAnimation(id, project.sourceScript);

    await this.prisma.project.update({ where: { id }, data: { hasAnimations: true } });
    return this.findById(id);
  }

  private toResponseDto(project: ProjectWithRelations): ProjectResponseDto {
    return {
      id: project.id,
      name: project.name,
      title: project.title,
      folderName: project.folderName,
      hook: project.hook,
      thumbnail: project.thumbnail || '',
      hasAnimations: project.hasAnimations,
      sourceScript: project.sourceScript,
      animations: project.animations.map((a) => this.toAnimationDto(a)),
      preview: project.preview ? this.toPreviewDto(project.preview) : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toPreviewDto(preview: Preview): PreviewResponseDto {
    return {
      templateId: preview.templateId,
      title: preview.title,
      parte: preview.parte,
      hasInstagram: !!preview.instagramPath,
      hasTiktok: !!preview.tiktokPath,
    };
  }

  private toAnimationDto(animation: AnimationWithScenes): AnimationResponseDto {
    return {
      id: animation.id,
      topic: animation.topic,
      totalScenes: animation.totalScenes,
      colorAccent: animation.colorAccent,
      secondaryAccent: animation.secondaryAccent || undefined,
      status: animation.status,
      scenes: animation.scenes.map((s) => this.toSceneDto(s)),
      createdAt: animation.createdAt,
      updatedAt: animation.updatedAt,
    };
  }

  private toSceneDto(scene: AnimationScene): AnimationSceneResponseDto {
    return {
      id: scene.id,
      sceneNumber: scene.sceneNumber,
      sceneType: scene.sceneType,
      mainText: scene.mainText,
      subText: scene.subText || undefined,
      visualType: scene.visualType,
      generatedHtml: scene.generatedHtml || undefined,
    };
  }
}
