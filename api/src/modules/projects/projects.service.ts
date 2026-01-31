import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Project, Carousel, CarouselSlide, Animation, AnimationScene, Preview } from '@prisma/client';
import { BamlService } from '../../shared/baml/baml.service';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CarouselService } from '../content/carousel/carousel.service';
import { AnimationService } from '../content/animation/animation.service';
import { PreviewService } from '../content/preview/preview.service';
import {
  CreateProjectDto,
  ProjectResponseDto,
  CarouselResponseDto,
  CarouselSlideResponseDto,
  AnimationResponseDto,
  AnimationSceneResponseDto,
  PreviewResponseDto,
} from './dto/extract-metadata.dto';

// Types for Prisma includes
type CarouselWithSlides = Carousel & { slides: CarouselSlide[] };
type AnimationWithScenes = Animation & { scenes: AnimationScene[] };
type ProjectWithRelations = Project & {
  carousels: CarouselWithSlides[];
  animations: AnimationWithScenes[];
  previews: Preview[];
};

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(
    private readonly bamlService: BamlService,
    private readonly prisma: PrismaService,
    private readonly carouselService: CarouselService,
    private readonly animationService: AnimationService,
    private readonly previewService: PreviewService,
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
      include: {
        carousels: {
          include: { slides: { orderBy: { slideNumber: 'asc' } } },
        },
        animations: {
          include: { scenes: { orderBy: { sceneNumber: 'asc' } } },
        },
        previews: true,
      },
    });

    this.logger.log(`Project created with ID: ${project.id}`);

    return this.toResponseDto(project as ProjectWithRelations);
  }

  async findAll(): Promise<ProjectResponseDto[]> {
    const projects = await this.prisma.project.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        carousels: {
          include: { slides: { orderBy: { slideNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        animations: {
          include: { scenes: { orderBy: { sceneNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        previews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return projects.map((p) => this.toResponseDto(p as ProjectWithRelations));
  }

  async findById(id: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: {
        carousels: {
          include: { slides: { orderBy: { slideNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        animations: {
          include: { scenes: { orderBy: { sceneNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        previews: {
          orderBy: { createdAt: 'desc' },
        },
      },
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

  async updateStatus(
    id: string,
    status: { hasAnimations?: boolean; hasCarousel?: boolean; hasPreview?: boolean },
  ): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.update({
      where: { id },
      data: status,
      include: {
        carousels: {
          include: { slides: { orderBy: { slideNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        animations: {
          include: { scenes: { orderBy: { sceneNumber: 'asc' } } },
          orderBy: { createdAt: 'desc' },
        },
        previews: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return this.toResponseDto(project as ProjectWithRelations);
  }

  /**
   * Generate all content (carousel, animations, and previews) for a project
   */
  async generateAllContent(id: string): Promise<ProjectResponseDto> {
    await this.generateCarouselContent(id);
    await this.generateAnimationContent(id);
    await this.generatePreviewContent(id);
    return this.findById(id);
  }

  /**
   * Generate carousel content for a project (step 1/3)
   */
  async generateCarouselContent(id: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    this.logger.log(`Generating carousel for project ${id}`);
    await this.prisma.carousel.deleteMany({ where: { projectId: id } });

    await this.carouselService.generateAndSaveCarousel(
      id,
      project.sourceScript,
      'Instagram',
      '1080x1350',
      '4:5',
      1080,
      1350,
    );

    await this.prisma.project.update({ where: { id }, data: { hasCarousel: true } });
    return this.findById(id);
  }

  /**
   * Generate animation content for a project (step 2/3)
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

  /**
   * Generate preview content for a project (step 3/3)
   */
  async generatePreviewContent(id: string): Promise<ProjectResponseDto> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { carousels: true },
    });
    if (!project) throw new NotFoundException(`Project with ID ${id} not found`);

    this.logger.log(`Generating previews for project ${id}`);
    await this.prisma.preview.deleteMany({ where: { projectId: id } });

    const carousel = project.carousels[0];
    await this.previewService.generateAllPreviewsForProject(
      id,
      project.hook,
      carousel?.colorAccent || '#FF5733',
      carousel?.secondaryAccent || undefined,
    );

    await this.prisma.project.update({ where: { id }, data: { hasPreview: true } });
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
      hasCarousel: project.hasCarousel,
      hasPreview: project.hasPreview,
      sourceScript: project.sourceScript,
      carousels: project.carousels.map((c) => this.toCarouselDto(c)),
      animations: project.animations.map((a) => this.toAnimationDto(a)),
      previews: project.previews.map((p) => this.toPreviewDto(p)),
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    };
  }

  private toCarouselDto(carousel: CarouselWithSlides): CarouselResponseDto {
    return {
      id: carousel.id,
      topic: carousel.topic,
      totalSlides: carousel.totalSlides,
      colorAccent: carousel.colorAccent,
      secondaryAccent: carousel.secondaryAccent || undefined,
      platform: carousel.platform || undefined,
      canvas: carousel.canvas || undefined,
      ratio: carousel.ratio || undefined,
      status: carousel.status,
      slides: carousel.slides.map((s) => this.toSlideDto(s)),
      createdAt: carousel.createdAt,
      updatedAt: carousel.updatedAt,
    };
  }

  private toPreviewDto(preview: Preview): PreviewResponseDto {
    return {
      id: preview.id,
      platform: preview.platform,
      width: preview.width,
      height: preview.height,
      colorAccent: preview.colorAccent,
      secondaryAccent: preview.secondaryAccent || undefined,
      mainText: preview.mainText,
      highlightText: preview.highlightText || undefined,
      subText: preview.subText || undefined,
      emoji: preview.emoji || undefined,
      label: preview.label || undefined,
      generatedHtml: preview.generatedHtml || undefined,
      status: preview.status,
      createdAt: preview.createdAt,
      updatedAt: preview.updatedAt,
    };
  }

  private toSlideDto(slide: CarouselSlide): CarouselSlideResponseDto {
    return {
      id: slide.id,
      slideNumber: slide.slideNumber,
      slideType: slide.slideType,
      mainText: slide.mainText,
      highlightText: slide.highlightText || undefined,
      subText: slide.subText || undefined,
      generatedHtml: slide.generatedHtml || undefined,
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
