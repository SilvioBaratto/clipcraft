import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, OnInit, OnDestroy, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { ScaledIframeDirective } from '../../directives/scaled-iframe.directive';
import { ProjectService } from '../../services/project.service';
import { ApiService } from '../../services/api.service';
import { Project, Carousel, Animation, Preview } from '../../models/project.model';
import { firstValueFrom } from 'rxjs';

type ContentType = 'animations' | 'carousel' | 'preview';
type GenerationStep = 'idle' | 'carousel' | 'animations' | 'previews' | 'complete';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, FormsModule, SafeHtmlPipe, ScaledIframeDirective],
  templateUrl: './project-detail.html',
  styleUrl: './project-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly apiService = inject(ApiService);

  // Project state
  project = signal<Project | null>(null);
  isEditingScript = signal(false);
  editedScript = signal('');

  // Active content tab
  activeTab = signal<ContentType | null>(null);

  // Generation pipeline state
  isGenerating = signal(false);
  currentStep = signal<GenerationStep>('idle');
  generationError = signal<string | null>(null);

  // Structured content storage
  carousels = signal<Carousel[]>([]);
  animations = signal<Animation[]>([]);
  previews = signal<Preview[]>([]);

  // Ordered steps for the selected types
  private activeSteps = computed<GenerationStep[]>(() => {
    const selected = this.selectedTypes();
    const steps: GenerationStep[] = [];
    if (selected.has('carousel')) steps.push('carousel');
    if (selected.has('animations')) steps.push('animations');
    if (selected.has('preview')) steps.push('previews');
    return steps;
  });

  // Computed progress percentage
  progress = computed(() => {
    const step = this.currentStep();
    if (step === 'idle') return 0;
    if (step === 'complete') return 100;
    const steps = this.activeSteps();
    const idx = steps.indexOf(step);
    if (idx === -1) return 0;
    return Math.round(((idx + 0.5) / steps.length) * 100);
  });

  // Label for current generation step
  stepLabel = computed(() => {
    switch (this.currentStep()) {
      case 'carousel': return 'Generating carousel...';
      case 'animations': return 'Generating animations...';
      case 'previews': return 'Generating previews...';
      case 'complete': return 'All content generated!';
      default: return '';
    }
  });

  // Content cards configuration
  readonly contentCards: { type: ContentType; title: string; iconPath: string; color: string; description: string }[] = [
    {
      type: 'animations',
      title: 'Animations',
      iconPath: 'assets/icons/animation.svg',
      color: 'emerald',
      description: 'Video animation scenes (1920x1080px)',
    },
    {
      type: 'carousel',
      title: 'Instagram Carousel',
      iconPath: 'assets/icons/carousel.svg',
      color: 'blue',
      description: 'Instagram carousel slides (1080x1350px)',
    },
    {
      type: 'preview',
      title: 'Preview',
      iconPath: 'assets/icons/thumbnail.svg',
      color: 'violet',
      description: 'Instagram & TikTok thumbnails',
    },
  ];

  // Generation selection
  selectedTypes = signal<Set<ContentType>>(new Set(['animations', 'carousel', 'preview']));

  isTypeSelected(type: ContentType): boolean {
    return this.selectedTypes().has(type);
  }

  toggleType(type: ContentType) {
    this.selectedTypes.update((set) => {
      const next = new Set(set);
      if (next.has(type)) {
        next.delete(type);
      } else {
        next.add(type);
      }
      return next;
    });
  }

  selectAllTypes() {
    this.selectedTypes.set(new Set(['animations', 'carousel', 'preview']));
  }

  clearSelection() {
    this.selectedTypes.set(new Set());
  }

  hasAnySelected = computed(() => this.selectedTypes().size > 0);
  hasAllSelected = computed(() => this.selectedTypes().size === 3);

  // Download state
  isDownloading = signal(false);

  // Fullscreen state
  expandedScene = signal<string | null>(null);
  expandedSceneData = computed(() => {
    const sceneId = this.expandedScene();
    if (!sceneId) return null;
    const anims = this.animations();
    if (anims.length === 0) return null;
    return anims[0].scenes.find((s) => s.id === sceneId) ?? null;
  });
  private fullscreenOverlay = viewChild<ElementRef>('fullscreenOverlay');
  private onFullscreenChange = () => {
    if (!document.fullscreenElement && this.expandedScene()) {
      this.expandedScene.set(null);
    }
  };

  constructor() {
    // Listen for native fullscreen exit (e.g. user presses Escape)
    if (typeof document !== 'undefined') {
      document.addEventListener('fullscreenchange', this.onFullscreenChange);
    }

    // Request/exit browser fullscreen when overlay state changes
    effect(() => {
      const overlay = this.fullscreenOverlay();
      if (overlay) {
        overlay.nativeElement.requestFullscreen?.();
        overlay.nativeElement.focus();
      }
    });
  }

  // Computed script content for display
  scriptContent = computed(() => {
    const p = this.project();
    if (!p) return '';

    const sections = p.script.sections.map((s) => s.testo).join('\n\n');
    return `## Hook\n${p.script.hook}\n\n## Script\n${sections}\n\n## CTA\n${p.script.cta}`;
  });

  async ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (projectId) {
      try {
        // Fetch fresh data from API
        const response = await firstValueFrom(this.apiService.getProject(projectId));
        const project = this.mapResponseToProject(response);
        this.project.set(project);
        this.editedScript.set(this.scriptContent());
        // Load structured content
        this.carousels.set(project.carousels || []);
        this.animations.set(project.animations || []);
        this.previews.set(project.previews || []);
      } catch {
        // If API fails, try local cache
        const found = this.projectService.getProjectById(projectId);
        if (found) {
          this.project.set(found);
          this.editedScript.set(this.scriptContent());
          this.carousels.set(found.carousels || []);
          this.animations.set(found.animations || []);
          this.previews.set(found.previews || []);
        } else {
          this.router.navigate(['/']);
        }
      }
    }
  }

  private mapResponseToProject(response: import('../../services/api.service').ProjectResponse): Project {
    return {
      id: response.id,
      name: response.name,
      folderName: response.folderName,
      script: {
        id: response.id,
        title: response.title,
        hook: response.hook,
        sections: this.parseScriptSections(response.sourceScript),
        cta: this.parseScriptCta(response.sourceScript),
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt),
      },
      hasAnimations: response.hasAnimations,
      hasCarousel: response.hasCarousel,
      hasPreview: response.hasPreview,
      carousels: (response.carousels || []).map((c) => ({
        id: c.id,
        topic: c.topic,
        totalSlides: c.totalSlides,
        colorAccent: c.colorAccent,
        secondaryAccent: c.secondaryAccent,
        platform: c.platform,
        canvas: c.canvas,
        ratio: c.ratio,
        status: c.status as Carousel['status'],
        slides: c.slides.map((s) => ({
          id: s.id,
          slideNumber: s.slideNumber,
          slideType: s.slideType as 'HOOK' | 'CONTENT' | 'CTA',
          mainText: s.mainText,
          highlightText: s.highlightText,
          subText: s.subText,
          generatedHtml: s.generatedHtml,
        })),
        createdAt: new Date(c.createdAt),
        updatedAt: new Date(c.updatedAt),
      })),
      animations: (response.animations || []).map((a) => ({
        id: a.id,
        topic: a.topic,
        totalScenes: a.totalScenes,
        colorAccent: a.colorAccent,
        secondaryAccent: a.secondaryAccent,
        status: a.status as Animation['status'],
        scenes: a.scenes.map((s) => ({
          id: s.id,
          sceneNumber: s.sceneNumber,
          sceneType: s.sceneType as 'INTRO' | 'EXPLANATION' | 'VISUALIZATION' | 'COMPARISON' | 'CTA',
          mainText: s.mainText,
          subText: s.subText,
          visualType: s.visualType as 'TWO_COLUMN' | 'CENTERED' | 'FLOW_DIAGRAM' | 'SCATTER_PLOT' | 'GRID' | 'COMPARISON' | 'DASHBOARD',
          generatedHtml: s.generatedHtml,
        })),
        createdAt: new Date(a.createdAt),
        updatedAt: new Date(a.updatedAt),
      })),
      previews: (response.previews || []).map((p) => ({
        id: p.id,
        platform: p.platform as 'instagram' | 'tiktok',
        width: p.width,
        height: p.height,
        colorAccent: p.colorAccent,
        secondaryAccent: p.secondaryAccent,
        mainText: p.mainText,
        highlightText: p.highlightText,
        subText: p.subText,
        emoji: p.emoji,
        label: p.label,
        generatedHtml: p.generatedHtml,
        status: p.status as Preview['status'],
        createdAt: new Date(p.createdAt),
        updatedAt: new Date(p.updatedAt),
      })),
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
      thumbnail: response.thumbnail,
    };
  }

  private parseScriptSections(sourceScript: string): { testo: string }[] {
    const scriptMatch = sourceScript.match(/##\s*🎬\s*Script\s*\n([\s\S]*?)(?=##|$)/i);
    if (!scriptMatch) return [];

    const scriptContent = scriptMatch[1].trim();
    const paragraphs = scriptContent
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    // Remove CTA if it looks like one
    const lastParagraph = paragraphs[paragraphs.length - 1];
    if (lastParagraph && /seguimi|follow|iscriviti|subscribe/i.test(lastParagraph)) {
      paragraphs.pop();
    }

    return paragraphs.map((text) => ({ testo: text }));
  }

  private parseScriptCta(sourceScript: string): string {
    const ctaMatch = sourceScript.match(/##\s*(?:📢|🎯)?\s*(?:CTA|Call to Action)\s*\n([\s\S]*?)(?=##|$)/i);
    if (ctaMatch) return ctaMatch[1].trim();

    const scriptMatch = sourceScript.match(/##\s*🎬\s*Script\s*\n([\s\S]*?)(?=##|$)/i);
    if (scriptMatch) {
      const paragraphs = scriptMatch[1].trim().split(/\n\n+/).map((p) => p.trim()).filter((p) => p.length > 0);
      const lastParagraph = paragraphs[paragraphs.length - 1];
      if (lastParagraph && /seguimi|follow|iscriviti|subscribe/i.test(lastParagraph)) {
        return lastParagraph;
      }
    }
    return '';
  }

  ngOnDestroy() {
    if (typeof document !== 'undefined') {
      document.removeEventListener('fullscreenchange', this.onFullscreenChange);
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
    }
  }

  toggleFullscreen(sceneId: string) {
    this.expandedScene.set(this.expandedScene() === sceneId ? null : sceneId);
  }

  closeFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
    }
    this.expandedScene.set(null);
  }

  async downloadAllAsPng() {
    const p = this.project();
    if (!p || this.isDownloading()) return;

    this.isDownloading.set(true);

    try {
      const blob = await firstValueFrom(this.apiService.downloadProjectZip(p.id));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.folderName || p.name}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download failed:', error);
    } finally {
      this.isDownloading.set(false);
    }
  }

  goBack() {
    this.router.navigate(['/']);
  }

  onCardClick(type: ContentType) {
    this.activeTab.set(this.activeTab() === type ? null : type);
  }

  isCardAvailable(type: ContentType): boolean {
    const p = this.project();
    if (!p) return false;

    switch (type) {
      case 'animations':
        return p.hasAnimations;
      case 'carousel':
        return p.hasCarousel;
      case 'preview':
        return p.hasPreview;
      default:
        return false;
    }
  }

  startEditing() {
    this.editedScript.set(this.scriptContent());
    this.isEditingScript.set(true);
  }

  cancelEditing() {
    this.isEditingScript.set(false);
    this.editedScript.set(this.scriptContent());
  }

  saveScript() {
    // In real implementation, parse and update the script
    this.isEditingScript.set(false);
    // For mock, just close the editor
  }

  getCardColorClasses(color: string, isAvailable: boolean): Record<string, boolean> {
    if (!isAvailable) {
      return {
        'bg-slate-50 border-slate-200 text-slate-400': true,
        'cursor-not-allowed': true,
      };
    }

    return {
      'bg-emerald-50 border-emerald-200 hover:border-emerald-400 hover:shadow-lg hover:shadow-emerald-500/10':
        color === 'emerald',
      'bg-blue-50 border-blue-200 hover:border-blue-400 hover:shadow-lg hover:shadow-blue-500/10': color === 'blue',
      'bg-violet-50 border-violet-200 hover:border-violet-400 hover:shadow-lg hover:shadow-violet-500/10':
        color === 'violet',
      'cursor-pointer': true,
    };
  }

  // Check if all content is already generated
  isAllGenerated(): boolean {
    const p = this.project();
    return p ? p.hasCarousel && p.hasAnimations && p.hasPreview : false;
  }

  // Start the generation pipeline (only selected types)
  async startGeneration() {
    const p = this.project();
    if (!p || this.isGenerating() || !this.hasAnySelected()) return;

    this.isGenerating.set(true);
    this.generationError.set(null);
    const selected = this.selectedTypes();

    try {
      if (selected.has('carousel')) {
        this.currentStep.set('carousel');
        await firstValueFrom(this.apiService.generateProjectCarousel(p.id));
      }

      if (selected.has('animations')) {
        this.currentStep.set('animations');
        await firstValueFrom(this.apiService.generateProjectAnimations(p.id));
      }

      if (selected.has('preview')) {
        this.currentStep.set('previews');
        await firstValueFrom(this.apiService.generateProjectPreviews(p.id));
      }

      // Done — fetch final project state
      this.currentStep.set('complete');
      const projectResponse = await firstValueFrom(this.apiService.getProject(p.id));
      const updated = this.mapResponseToProject(projectResponse);
      this.project.set(updated);
      this.carousels.set(updated.carousels || []);
      this.animations.set(updated.animations || []);
      this.previews.set(updated.previews || []);

      // Reset to idle and open the first generated tab
      this.currentStep.set('idle');
      if (selected.has('animations')) this.activeTab.set('animations');
      else if (selected.has('carousel')) this.activeTab.set('carousel');
      else if (selected.has('preview')) this.activeTab.set('preview');
    } catch (error) {
      console.error('Generation failed:', error);
      this.generationError.set(error instanceof Error ? error.message : 'Generation failed');
      this.currentStep.set('idle');
    } finally {
      this.isGenerating.set(false);
    }
  }
}
