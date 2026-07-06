import { Component, inject, signal, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { ProjectService } from '../../services/project.service';
import { NewProjectModalComponent } from '../../shared/new-project-modal/new-project-modal';
import { ButtonComponent } from '../../shared/ui/button/button';
import { SpinnerComponent } from '../../shared/ui/spinner/spinner';

@Component({
  selector: 'app-home',
  imports: [LucideAngularModule, NewProjectModalComponent, ButtonComponent, SpinnerComponent],
  templateUrl: './home.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class HomeComponent implements OnInit {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  readonly projects = this.projectService.projects;
  readonly projectCount = this.projectService.projectCount;
  readonly isLoading = this.projectService.isLoading;
  readonly error = this.projectService.error;

  deletingId = signal<string | null>(null);

  // New Project modal state
  isNewProjectModalOpen = signal(false);

  ngOnInit() {
    this.projectService.loadProjects();
  }

  openNewProjectModal() {
    this.isNewProjectModalOpen.set(true);
  }

  closeNewProjectModal() {
    this.isNewProjectModalOpen.set(false);
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
