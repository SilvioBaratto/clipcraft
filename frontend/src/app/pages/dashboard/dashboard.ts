import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { ProjectService } from '../../services/project.service';

interface Metric {
  label: string;
  value: string;
  hint: string;
}

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class DashboardComponent implements OnInit {
  private readonly projectService = inject(ProjectService);

  readonly isLoading = this.projectService.isLoading;

  readonly metrics = computed<Metric[]>(() => {
    const projects = this.projectService.projects();
    const withAnimations = projects.filter((p) => p.hasAnimations).length;
    const totalScenes = projects.reduce(
      (sum, p) => sum + p.animations.reduce((s, a) => s + a.totalScenes, 0),
      0,
    );
    return [
      { label: 'Projects', value: `${projects.length}`, hint: 'Total created' },
      { label: 'With animations', value: `${withAnimations}`, hint: 'Generated' },
      { label: 'Animation scenes', value: `${totalScenes}`, hint: 'Across all projects' },
      {
        label: 'Pending',
        value: `${projects.length - withAnimations}`,
        hint: 'Not yet generated',
      },
    ];
  });

  ngOnInit() {
    this.projectService.loadProjects();
  }
}
