import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Structured carousel slide from API
export interface CarouselSlideResponse {
  id: string;
  slideNumber: number;
  slideType: string;
  mainText: string;
  highlightText?: string;
  subText?: string;
  generatedHtml?: string;
}

// Structured carousel from API
export interface CarouselResponse {
  id: string;
  topic: string;
  totalSlides: number;
  colorAccent: string;
  secondaryAccent?: string;
  platform?: string;
  canvas?: string;
  ratio?: string;
  status: string;
  slides: CarouselSlideResponse[];
  createdAt: string;
  updatedAt: string;
}

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

// Structured preview from API
export interface PreviewResponse {
  id: string;
  platform: string;
  width: number;
  height: number;
  colorAccent: string;
  secondaryAccent?: string;
  mainText: string;
  highlightText?: string;
  subText?: string;
  emoji?: string;
  label?: string;
  generatedHtml?: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectResponse {
  id: string;
  name: string;
  title: string;
  folderName: string;
  hook: string;
  thumbnail: string;
  hasAnimations: boolean;
  hasCarousel: boolean;
  hasPreview: boolean;
  sourceScript: string;
  carousels: CarouselResponse[];
  animations: AnimationResponse[];
  previews: PreviewResponse[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateProjectRequest {
  script: string;
  userId?: string;
}

export interface CarouselGenerationResponse {
  carousel: {
    topic: string;
    total_slides: number;
    slides: unknown[];
  };
  htmlSlides: string[];
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
  generateCarousel(topic: string): Observable<CarouselGenerationResponse> {
    return this.http.post<CarouselGenerationResponse>(`${this.baseUrl}/content/carousel/generate-with-html`, {
      topic,
      platform: 'Instagram',
      canvas: '1080x1350',
      ratio: '4:5',
    });
  }

  generateAnimations(topic: string): Observable<AnimationGenerationResponse> {
    return this.http.post<AnimationGenerationResponse>(`${this.baseUrl}/content/animation/generate-with-html`, {
      topic,
    });
  }

  generatePreviewInstagram(topic: string): Observable<CarouselGenerationResponse> {
    return this.http.post<CarouselGenerationResponse>(`${this.baseUrl}/content/carousel/generate-with-html`, {
      topic,
      platform: 'Instagram',
      canvas: '1080x1920',
      ratio: '9:16',
    });
  }

  generatePreviewTikTok(topic: string): Observable<CarouselGenerationResponse> {
    return this.http.post<CarouselGenerationResponse>(`${this.baseUrl}/content/carousel/generate-with-html`, {
      topic,
      platform: 'TikTok',
      canvas: '1080x1440',
      ratio: '3:4',
    });
  }

  // Update project status after generation
  updateProjectStatus(
    projectId: string,
    status: { hasAnimations?: boolean; hasCarousel?: boolean; hasPreview?: boolean }
  ): Observable<ProjectResponse> {
    return this.http.patch<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/status`, status);
  }

  // Generate all content for a project (carousel + animations)
  generateProjectContent(projectId: string): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/generate`, {});
  }

  // Step-by-step generation
  generateProjectCarousel(projectId: string): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/generate/carousel`, {});
  }

  generateProjectAnimations(projectId: string): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/generate/animations`, {});
  }

  generateProjectPreviews(projectId: string): Observable<ProjectResponse> {
    return this.http.post<ProjectResponse>(`${this.baseUrl}/projects/${projectId}/generate/previews`, {});
  }
}
