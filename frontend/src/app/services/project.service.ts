import { Injectable, signal, computed, inject } from '@angular/core';
import { Project, Carousel, CarouselSlide, Animation, AnimationScene, Preview } from '../models/project.model';
import {
  ApiService,
  ProjectResponse,
  CarouselResponse,
  CarouselSlideResponse,
  AnimationResponse,
  AnimationSceneResponse,
  PreviewResponse,
} from './api.service';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private readonly apiService = inject(ApiService);

  // Projects state
  private readonly _projects = signal<Project[]>([]);
  private readonly _isLoading = signal(false);
  private readonly _error = signal<string | null>(null);

  // Public readonly signals
  readonly projects = this._projects.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly error = this._error.asReadonly();

  // Computed for project count
  readonly projectCount = computed(() => this._projects().length);

  // Load all projects from API
  async loadProjects(): Promise<void> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      const response = await firstValueFrom(this.apiService.getProjects());
      const projects = response.map((p) => this.toProject(p));
      this._projects.set(projects);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load projects';
      this._error.set(message);
    } finally {
      this._isLoading.set(false);
    }
  }

  // Get project by ID (from local cache)
  getProjectById(id: string): Project | undefined {
    return this._projects().find((p) => p.id === id);
  }

  // Create project from script using AI
  async createProjectFromScript(scriptContent: string): Promise<Project> {
    this._isLoading.set(true);
    this._error.set(null);

    try {
      // Call API to create project (includes AI metadata extraction)
      const response = await firstValueFrom(this.apiService.createProject(scriptContent));
      const project = this.toProject(response);

      // Add to local state
      this._projects.update((projects) => [project, ...projects]);

      return project;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create project';
      this._error.set(message);
      throw err;
    } finally {
      this._isLoading.set(false);
    }
  }

  // Delete project
  async deleteProject(projectId: string): Promise<void> {
    try {
      await firstValueFrom(this.apiService.deleteProject(projectId));
      this._projects.update((projects) => projects.filter((p) => p.id !== projectId));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete project';
      this._error.set(message);
      throw err;
    }
  }

  // Convert API response to frontend Project model
  private toProject(response: ProjectResponse): Project {
    const { sections, cta } = this.parseScriptContent(response.sourceScript);

    return {
      id: response.id,
      name: response.name,
      folderName: response.folderName,
      script: {
        id: response.id,
        title: response.title,
        hook: response.hook,
        sections,
        cta,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      },
      hasAnimations: response.hasAnimations,
      hasCarousel: response.hasCarousel,
      hasPreview: response.hasPreview,
      carousels: (response.carousels || []).map((c) => this.toCarousel(c)),
      animations: (response.animations || []).map((a) => this.toAnimation(a)),
      previews: (response.previews || []).map((p) => this.toPreview(p)),
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
      thumbnail: response.thumbnail,
    };
  }

  private toCarousel(response: CarouselResponse): Carousel {
    return {
      id: response.id,
      topic: response.topic,
      totalSlides: response.totalSlides,
      colorAccent: response.colorAccent,
      secondaryAccent: response.secondaryAccent,
      platform: response.platform,
      canvas: response.canvas,
      ratio: response.ratio,
      status: response.status as Carousel['status'],
      slides: response.slides.map((s) => this.toCarouselSlide(s)),
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  }

  private toCarouselSlide(response: CarouselSlideResponse): CarouselSlide {
    return {
      id: response.id,
      slideNumber: response.slideNumber,
      slideType: response.slideType as CarouselSlide['slideType'],
      mainText: response.mainText,
      highlightText: response.highlightText,
      subText: response.subText,
      generatedHtml: response.generatedHtml,
    };
  }

  private toAnimation(response: AnimationResponse): Animation {
    return {
      id: response.id,
      topic: response.topic,
      totalScenes: response.totalScenes,
      colorAccent: response.colorAccent,
      secondaryAccent: response.secondaryAccent,
      status: response.status as Animation['status'],
      scenes: response.scenes.map((s) => this.toAnimationScene(s)),
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  }

  private toAnimationScene(response: AnimationSceneResponse): AnimationScene {
    return {
      id: response.id,
      sceneNumber: response.sceneNumber,
      sceneType: response.sceneType as AnimationScene['sceneType'],
      mainText: response.mainText,
      subText: response.subText,
      visualType: response.visualType as AnimationScene['visualType'],
      generatedHtml: response.generatedHtml,
    };
  }

  private toPreview(response: PreviewResponse): Preview {
    return {
      id: response.id,
      platform: response.platform as Preview['platform'],
      width: response.width,
      height: response.height,
      colorAccent: response.colorAccent,
      secondaryAccent: response.secondaryAccent,
      mainText: response.mainText,
      highlightText: response.highlightText,
      subText: response.subText,
      emoji: response.emoji,
      label: response.label,
      generatedHtml: response.generatedHtml,
      status: response.status as Preview['status'],
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
    };
  }

  // Parse the raw script content to extract sections and CTA
  private parseScriptContent(sourceScript: string): {
    sections: { testo: string }[];
    cta: string;
  } {
    const sections: { testo: string }[] = [];
    let cta = '';

    // Split by common section headers
    const scriptMatch = sourceScript.match(/##\s*🎬\s*Script\s*\n([\s\S]*?)(?=##|$)/i);
    const ctaMatch = sourceScript.match(/##\s*(?:📢|🎯)?\s*(?:CTA|Call to Action)\s*\n([\s\S]*?)(?=##|$)/i);

    if (scriptMatch) {
      // Split script content into paragraphs
      const scriptContent = scriptMatch[1].trim();
      const paragraphs = scriptContent
        .split(/\n\n+/)
        .map((p) => p.trim())
        .filter((p) => p.length > 0);

      // Check if the last paragraph looks like a CTA
      const lastParagraph = paragraphs[paragraphs.length - 1];
      if (lastParagraph && /seguimi|follow|iscriviti|subscribe/i.test(lastParagraph)) {
        cta = lastParagraph;
        paragraphs.pop();
      }

      paragraphs.forEach((text) => {
        sections.push({ testo: text });
      });
    }

    // Override CTA if explicitly defined
    if (ctaMatch) {
      cta = ctaMatch[1].trim();
    }

    return { sections, cta };
  }
}
