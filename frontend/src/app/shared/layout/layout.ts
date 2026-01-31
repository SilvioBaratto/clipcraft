import { Component, signal, computed, OnInit, OnDestroy, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar';
import { NewProjectModalComponent } from '../new-project-modal/new-project-modal';

@Component({
  selector: 'app-layout',
  imports: [CommonModule, RouterOutlet, SidebarComponent, NewProjectModalComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {
  // Application title
  title = 'ClipCraft';

  // Sidebar state management using Angular 19 signals
  isSidebarOpen = signal(false);
  isMobile = signal(false);
  currentPage = signal('Home');

  // Modal state
  isNewProjectModalOpen = signal(false);

  // Computed property for responsive sidebar behavior
  showSidebar = computed(() => !this.isMobile() || this.isSidebarOpen());

  // Resize observer for better mobile detection
  private resizeObserver?: ResizeObserver;

  ngOnInit() {
    this.checkScreenSize();
    this.initializeResizeObserver();
  }

  ngOnDestroy() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  toggleSidebar() {
    this.isSidebarOpen.update((value) => !value);
  }

  closeSidebar() {
    this.isSidebarOpen.set(false);
  }

  onItemSelected(itemName: string) {
    this.currentPage.set(itemName);
    if (this.isMobile()) {
      this.closeSidebar();
    }
  }

  openNewProjectModal() {
    this.isNewProjectModalOpen.set(true);
  }

  closeNewProjectModal() {
    this.isNewProjectModalOpen.set(false);
  }

  onProjectCreated(projectId: string) {
    console.log('Project created:', projectId);
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined') {
      const isMobileSize = window.innerWidth < 768;
      this.isMobile.set(isMobileSize);

      if (isMobileSize) {
        this.isSidebarOpen.set(false);
      }
    }
  }

  private initializeResizeObserver() {
    if (typeof window !== 'undefined' && 'ResizeObserver' in window) {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          const { width } = entry.contentRect;
          const isMobileSize = width < 768;
          this.isMobile.set(isMobileSize);

          if (isMobileSize && this.isSidebarOpen()) {
            this.isSidebarOpen.set(false);
          }
        }
      });

      this.resizeObserver.observe(document.body);
    } else {
      this.setupResizeListener();
    }
  }

  private setupResizeListener() {
    if (typeof window !== 'undefined') {
      const handleResize = () => this.checkScreenSize();
      window.addEventListener('resize', handleResize);
    }
  }
}
