import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { ProjectService } from '../../services/project.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrl: './home.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  readonly projects = this.projectService.projects;
  readonly projectCount = this.projectService.projectCount;
  readonly isLoading = this.projectService.isLoading;
  readonly error = this.projectService.error;

  deletingId = signal<string | null>(null);

  ngOnInit() {
    this.projectService.loadProjects();
  }

  onProjectClick(projectId: string) {
    this.router.navigate(['/project', projectId]);
  }

  async onDeleteProject(event: MouseEvent, projectId: string) {
    event.stopPropagation();
    if (this.deletingId()) return;

    this.deletingId.set(projectId);
    try {
      await this.projectService.deleteProject(projectId);
    } finally {
      this.deletingId.set(null);
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date));
  }
}
