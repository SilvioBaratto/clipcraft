import { Component, signal, computed, input, output, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [CommonModule, RouterModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  // Inputs from parent
  isOpen = input<boolean>(false);
  isMobile = input<boolean>(false);

  // Outputs to parent
  closeSidebar = output<void>();
  itemSelected = output<string>();
  newProjectClick = output<void>();

  // Computed property for sidebar visibility
  showSidebar = computed(() => !this.isMobile() || this.isOpen());

  onHomeClick() {
    this.itemSelected.emit('Home');
    this.router.navigate(['/']);
    this.closeSidebar.emit();
  }

  onNewProjectClick() {
    this.newProjectClick.emit();
    if (this.isMobile()) {
      this.closeSidebar.emit();
    }
  }

  onCloseSidebar() {
    this.closeSidebar.emit();
  }

  onLogout() {
    this.authService.logout();
    this.router.navigate(['/login'], { replaceUrl: true });
    this.closeSidebar.emit();
  }
}
