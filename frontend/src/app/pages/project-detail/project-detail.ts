import { Component, inject, signal, computed, effect, ChangeDetectionStrategy, OnInit, OnDestroy, viewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SafeHtmlPipe } from '../../pipes/safe-html.pipe';
import { MarkdownPipe } from '../../shared/pipes/markdown.pipe';
import { ScaledIframeDirective } from '../../directives/scaled-iframe.directive';
import { ProjectService } from '../../services/project.service';
import { ApiService, PreviewTemplate, PreviewPlatform } from '../../services/api.service';
import { Project, Animation, Preview } from '../../models/project.model';
import { IconName } from '../../icons';
import { firstValueFrom } from 'rxjs';

type ContentType = 'animations' | 'preview';
type GenerationStep = 'idle' | 'animations' | 'previews' | 'complete';

@Component({
  selector: 'app-project-detail',
  imports: [CommonModule, FormsModule, LucideAngularModule, SafeHtmlPipe, MarkdownPipe, ScaledIframeDirective],
  templateUrl: './project-detail.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class ProjectDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly projectService = inject(ProjectService);
  private readonly apiService = inject(ApiService);

  // Project state
  project = signal<Project | null>(null);
  isLoadingProject = signal(true);
  isEditingScript = signal(false);
  editedScript = signal('');
  rawSourceScript = signal('');

  // Active content tab
  activeTab = signal<ContentType | null>(null);

  // Generation pipeline state
  isGenerating = signal(false);
  currentStep = signal<GenerationStep>('idle');
  generationError = signal<string | null>(null);

  // Structured content storage
  animations = signal<Animation[]>([]);

  // Scene repair (vision + Opus) state
  repairingSceneId = signal<string | null>(null);
  isSavingRepair = signal(false);
  repairModal = signal<{
    sceneId: string;
    sceneNumber: number;
    originalHtml: string;
    status: 'loading' | 'done' | 'error';
    changed: boolean;
    summary: string;
    repairedHtml: string;
  } | null>(null);

  // Preview cover state
  preview = signal<Preview | null>(null);
  previewTemplates = signal<PreviewTemplate[]>([]);
  previewVersion = signal(0); // cache-bust the <img> after a re-render
  savingPlatform = signal<PreviewPlatform | null>(null);
  isApplyingOverride = signal(false);

  // Override form
  overrideTemplateId = signal('');
  overrideTitle = signal('');
  overrideParte = signal<number | null>(null);

  selectedTemplate = computed(
    () => this.previewTemplates().find((t) => t.id === this.overrideTemplateId()) ?? null,
  );
  overrideNeedsTitle = computed(() => !!this.selectedTemplate()?.fields.some((f) => f.key === 'title'));
  overrideNeedsParte = computed(() => !!this.selectedTemplate()?.fields.some((f) => f.key === 'parte'));

  // Ordered steps for the selected types
  private activeSteps = computed<GenerationStep[]>(() => {
    const selected = this.selectedTypes();
    const steps: GenerationStep[] = [];
    if (selected.has('animations')) {
      steps.push('animations');
      steps.push('previews');
    }
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
      case 'animations': return 'Generating animations...';
      case 'previews': return 'Selecting & rendering covers...';
      case 'complete': return 'All content generated!';
      default: return '';
    }
  });

  // Content cards configuration
  readonly contentCards: { type: ContentType; title: string; icon: IconName; description: string }[] = [
    {
      type: 'animations',
      title: 'Animations',
      icon: 'Film',
      description: 'Video animation scenes (1920x1080px)',
    },
    {
      type: 'preview',
      title: 'Cover Preview',
      icon: 'Image',
      description: 'Instagram + TikTok cover thumbnails',
    },
  ];

  // Generation selection
  selectedTypes = signal<Set<ContentType>>(new Set(['animations']));

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

  hasAnySelected = computed(() => this.selectedTypes().size > 0);

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

  // Computed script content for display (just raw source)
  scriptContent = computed(() => {
    return this.rawSourceScript();
  });

  async ngOnInit() {
    const projectId = this.route.snapshot.paramMap.get('id');
    if (!projectId) {
      this.isLoadingProject.set(false);
      return;
    }
    try {
      // Fetch fresh data from API
      const response = await firstValueFrom(this.apiService.getProject(projectId));
      const project = this.mapResponseToProject(response);
      this.project.set(project);
      this.rawSourceScript.set(response.sourceScript ?? '');
      this.editedScript.set(response.sourceScript ?? '');
      // Load structured content
      this.animations.set(project.animations || []);
      this.setPreview(project.preview ?? null);
      void this.loadPreviewTemplates();
    } catch {
      // If API fails, try local cache
      const found = this.projectService.getProjectById(projectId);
      if (found) {
        this.project.set(found);
        this.editedScript.set(this.scriptContent());
        this.animations.set(found.animations || []);
      }
      // else: leave project() null → template shows the "not found" state
    } finally {
      this.isLoadingProject.set(false);
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
      preview: response.preview ?? null,
      createdAt: new Date(response.createdAt),
      updatedAt: new Date(response.updatedAt),
      thumbnail: response.thumbnail,
    };
  }

  private parseScriptSections(sourceScript: string): { testo: string }[] {
    const scriptMatch = sourceScript.match(/##\s*(?:🎬\s*)?Script\s*\n([\s\S]*?)(?=##|$)/i);
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

    const scriptMatch = sourceScript.match(/##\s*(?:🎬\s*)?Script\s*\n([\s\S]*?)(?=##|$)/i);
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
      case 'preview':
        return !!p.preview && (p.preview.hasInstagram || p.preview.hasTiktok);
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

  async saveScript() {
    const p = this.project();
    if (!p) return;
    try {
      const updated = await firstValueFrom(this.apiService.updateProjectScript(p.id, this.editedScript()));
      this.project.set(this.mapResponseToProject(updated));
      // Refresh the raw source the read-only markdown view renders, so the saved
      // text is reflected immediately (not only after a reload).
      this.rawSourceScript.set(updated.sourceScript ?? '');
      this.editedScript.set(updated.sourceScript ?? '');
    } catch (error) {
      console.error('Failed to save script:', error);
    }
    this.isEditingScript.set(false);
  }

  // Check if all content is already generated
  isAllGenerated(): boolean {
    const p = this.project();
    return p ? p.hasAnimations : false;
  }

  // Check if any content has been generated
  hasAnyGenerated(): boolean {
    const p = this.project();
    return p ? p.hasAnimations : false;
  }

  // Start the generation pipeline (only selected types)
  async startGeneration() {
    const p = this.project();
    if (!p || this.isGenerating() || !this.hasAnySelected()) return;

    this.isGenerating.set(true);
    this.generationError.set(null);
    const selected = this.selectedTypes();

    try {
      if (selected.has('animations')) {
        this.currentStep.set('animations');
        await firstValueFrom(this.apiService.generateProjectAnimations(p.id));

        // Auto-pick the best cover template + render Instagram/TikTok PNGs
        this.currentStep.set('previews');
        await firstValueFrom(this.apiService.generateProjectPreviews(p.id));
      }

      // Done — fetch final project state
      this.currentStep.set('complete');
      const projectResponse = await firstValueFrom(this.apiService.getProject(p.id));
      const updated = this.mapResponseToProject(projectResponse);
      this.project.set(updated);
      this.animations.set(updated.animations || []);
      this.setPreview(updated.preview ?? null);
      this.previewVersion.update((v) => v + 1);

      // Reset to idle and open the first generated tab
      this.currentStep.set('idle');
      if (selected.has('animations')) this.activeTab.set('animations');
    } catch (error) {
      console.error('Generation failed:', error);
      this.generationError.set(error instanceof Error ? error.message : 'Generation failed');
      this.currentStep.set('idle');
    } finally {
      this.isGenerating.set(false);
    }
  }

  private setPreview(preview: Preview | null) {
    this.preview.set(preview);
    if (preview) {
      this.overrideTemplateId.set(preview.templateId);
      this.overrideTitle.set(preview.title ?? '');
      this.overrideParte.set(preview.parte ?? null);
    }
  }

  private async loadPreviewTemplates() {
    if (this.previewTemplates().length > 0) return;
    try {
      const templates = await firstValueFrom(this.apiService.getPreviewTemplates());
      this.previewTemplates.set(templates);
    } catch (error) {
      console.error('Failed to load preview templates:', error);
    }
  }

  /** Cover image URL with a cache-bust so re-renders show immediately. */
  previewImageUrl(platform: PreviewPlatform): string {
    const p = this.project();
    if (!p) return '';
    return `${this.apiService.previewImageUrl(p.id, platform)}?v=${this.previewVersion()}`;
  }

  async savePreviewToPhotos(platform: PreviewPlatform) {
    const p = this.project();
    if (!p || this.savingPlatform()) return;
    this.savingPlatform.set(platform);
    try {
      const blob = await firstValueFrom(this.apiService.downloadPreview(p.id, platform));
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${p.folderName || p.name}-${platform}.png`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      this.savingPlatform.set(null);
    }
  }

  async applyPreviewOverride() {
    const p = this.project();
    if (!p || this.isApplyingOverride()) return;
    this.isApplyingOverride.set(true);
    try {
      const title = this.overrideNeedsTitle() ? this.overrideTitle().trim() || null : null;
      const parte = this.overrideNeedsParte() ? this.overrideParte() : null;
      await firstValueFrom(
        this.apiService.updateProjectPreview(p.id, {
          templateId: this.overrideTemplateId(),
          title,
          parte,
        }),
      );
      // Refresh the project so preview flags + fields reflect the re-render
      const refreshed = this.mapResponseToProject(
        await firstValueFrom(this.apiService.getProject(p.id)),
      );
      this.project.set(refreshed);
      this.setPreview(refreshed.preview ?? null);
      this.previewVersion.update((v) => v + 1);
    } catch (error) {
      console.error('Preview override failed:', error);
    } finally {
      this.isApplyingOverride.set(false);
    }
  }

  // ---- Scene repair (vision + Opus) ----

  async repairScene(scene: { id: string; sceneNumber: number; generatedHtml?: string }) {
    if (!scene.generatedHtml || this.repairingSceneId()) return;
    this.repairingSceneId.set(scene.id);
    this.repairModal.set({
      sceneId: scene.id,
      sceneNumber: scene.sceneNumber,
      originalHtml: scene.generatedHtml,
      status: 'loading',
      changed: false,
      summary: '',
      repairedHtml: '',
    });
    try {
      const res = await firstValueFrom(this.apiService.repairScene(scene.id));
      this.repairModal.update((m) =>
        m && m.sceneId === scene.id
          ? { ...m, status: 'done', changed: res.changed, summary: res.summary, repairedHtml: res.repairedHtml }
          : m,
      );
    } catch (error) {
      console.error('Scene repair failed:', error);
      this.repairModal.update((m) => (m && m.sceneId === scene.id ? { ...m, status: 'error' } : m));
    } finally {
      this.repairingSceneId.set(null);
    }
  }

  async keepRepair() {
    const m = this.repairModal();
    if (!m || m.status !== 'done' || !m.repairedHtml || this.isSavingRepair()) return;
    this.isSavingRepair.set(true);
    try {
      await firstValueFrom(this.apiService.saveSceneHtml(m.sceneId, m.repairedHtml));
      this.animations.update((anims) =>
        anims.map((a) => ({
          ...a,
          scenes: a.scenes.map((s) =>
            s.id === m.sceneId ? { ...s, generatedHtml: m.repairedHtml } : s,
          ),
        })),
      );
      this.repairModal.set(null);
    } catch (error) {
      console.error('Failed to save repaired scene:', error);
    } finally {
      this.isSavingRepair.set(false);
    }
  }

  closeRepair() {
    this.repairModal.set(null);
  }
}
