import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Structured animation scene from API
export interface AnimationSceneResponse {
  id: string;
  sceneNumber: number;
  sceneType: string;
  mainText: string;
  subText?: string;
  visualType: string;
  generatedHtml?: string;
}

// Structured animation from API
export interface AnimationResponse {
  id: string;
  topic: string;
  totalScenes: number;
  colorAccent: string;
  secondaryAccent?: string;
  status: string;
  scenes: AnimationSceneResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface PreviewResponse {
  templateId: string;
  title?: string | null;
  parte?: number | null;
  hasInstagram: boolean;
  hasTiktok: boolean;
}

export interface PreviewTemplate {
  id: string;
  name: string;
  description: string;
  fields: { key: 'title' | 'parte'; type: 'text' | 'number'; llm: boolean; label: string }[];
}

export type PreviewPlatform = 'instagram' | 'tiktok';

export interface ProjectResponse {
  id: string;
  name: string;
  title: string;
  folderName: string;
  hook: string;
  thumbnail: string;
  hasAnimations: boolean;
  sourceScript: string;
  animations: AnimationResponse[];
  preview?: PreviewResponse | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  script: string;
  userId?: string;
}

export interface AnimationGenerationResponse {
  animationSet: {
    topic: string;
    total_scenes: number;
    scenes: unknown[];
  };
  htmlScenes: string[];
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1';

  // Projects
  createProject(script: string): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects`, { script });
  }

  getProjects(): Observable<ProjectResponse[]> {
    return this.http.get<ProjectResponse[]>(`${this.baseUrl}/projects`);
  }

  getProject(id: string): Observable<ProjectResponse> {
    return this.http.get<ProjectResponse>(`${this.baseUrl}/projects/${id}`);
  }

  deleteProject(id: string): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/projects/${id}`);
  }

  // Content Generation
  generateAnimations(topic: string): Observable<AnimationGenerationResponse> {
    return this.http.post<AnimationGenerationResponse>(`${this.baseUrl}/content/animation/generate-with-html`, {
      topic,
    });
  }

  updateProjectScript(id: string, sourceScript: string): Observable<ProjectResponse> {
    return this.http.patch<ProjectResponse>(`${this.baseUrl}/projects/${id}/script`, { sourceScript });
  }

  // Update project status after generation
  updateProjectStatus(
    projectId: string,
    status: { hasAnimations?: boolean }
  ): Observable<ProjectResponse> {
    return this.http.patch<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/status`, status);
  }

  // Generate all content for a project (animations)
  generateProjectContent(projectId: string): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/generate`, {});
  }

  // Step-by-step generation
  generateProjectAnimations(projectId: string): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/generate/animations`, {});
  }

  downloadProjectZip(projectId: string): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/projects/${projectId}/download`, {
      responseType: 'blob',
    });
  }

  // Scene repair (vision + Opus) — returns fixed HTML without saving
  repairScene(
    sceneId: string,
  ): Observable<{ id: string; changed: boolean; summary: string; repairedHtml: string }> {
    return this.http.post<{ id: string; changed: boolean; summary: string; repairedHtml: string }>(
      `${this.baseUrl}/content/animation/scenes/${sceneId}/repair`,
      {},
    );
  }

  saveSceneHtml(sceneId: string, generatedHtml: string): Observable<{ id: string; generatedHtml: string }> {
    return this.http.patch<{ id: string; generatedHtml: string }>(
      `${this.baseUrl}/content/animation/scenes/${sceneId}/html`,
      { generatedHtml },
    );
  }

  // Preview covers
  generateProjectPreviews(projectId: string): Observable<PreviewResponse> {
    return this.http.post<PreviewResponse>(`${this.baseUrl}/projects/${projectId}/generate/previews`, {});
  }

  updateProjectPreview(
    projectId: string,
    body: { templateId?: string; title?: string | null; parte?: number | null },
  ): Observable<PreviewResponse> {
    return this.http.patch<PreviewResponse>(`${this.baseUrl}/projects/${projectId}/preview`, body);
  }

  getPreviewTemplates(): Observable<PreviewTemplate[]> {
    return this.http.get<PreviewTemplate[]>(`${this.baseUrl}/content/preview/templates`);
  }

  /** Public URL of a rendered cover (append a cache-bust after re-render). */
  previewImageUrl(projectId: string, platform: PreviewPlatform): string {
    return `${this.baseUrl}/projects/${projectId}/preview/${platform}`;
  }

  downloadPreview(projectId: string, platform: PreviewPlatform): Observable<Blob> {
    return this.http.get(this.previewImageUrl(projectId, platform), { responseType: 'blob' });
  }
}
