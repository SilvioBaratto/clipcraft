import { Component, signal, input, output, inject, ChangeDetectionStrategy, effect } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ProjectService } from '../../services/project.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-new-project-modal',
  imports: [FormsModule],
  templateUrl: './new-project-modal.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewProjectModalComponent {
  private readonly projectService = inject(ProjectService);
  private readonly router = inject(Router);

  // Input to control visibility
  isOpen = input<boolean>(false);

  // Output events
  closeModal = output<void>();
  projectCreated = output<string>();

  // Form state
  scriptContent = signal('');
  isCreating = signal(false);

  constructor() {
    // Lock/unlock body scroll when modal opens/closes
    effect(() => {
      if (typeof document !== 'undefined') {
        if (this.isOpen()) {
          document.body.style.overflow = 'hidden';
        } else {
          document.body.style.overflow = '';
        }
      }
    });
  }

  onClose() {
    if (this.isCreating()) return;
    this.scriptContent.set('');
    this.closeModal.emit();
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.onClose();
    }
  }

  async onCreate() {
    const script = this.scriptContent().trim();
    if (!script || this.isCreating()) return;

    this.isCreating.set(true);

    try {
      // Create project - name is extracted from script content via AI
      const project = await this.projectService.createProjectFromScript(script);

      this.scriptContent.set('');
      this.projectCreated.emit(project.id);
      this.closeModal.emit();
      this.router.navigate(['/project', project.id]);
    } catch (error) {
      console.error('Failed to create project:', error);
    } finally {
      this.isCreating.set(false);
    }
  }
}
