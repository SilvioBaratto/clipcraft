import {
  Component,
  signal,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { filter, map } from 'rxjs/operators';

import { SidebarComponent } from '../sidebar/sidebar';
import { BottomTabBarComponent } from '../bottom-tab-bar/bottom-tab-bar';
import { ToastComponent } from '../ui/toast/toast';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, SidebarComponent, BottomTabBarComponent, ToastComponent],
  templateUrl: './layout.html',
  styleUrl: './layout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly title = inject(Title);
  private readonly destroyRef = inject(DestroyRef);

  // Kept only so the desktop sidebar's `showSidebar` (= !isMobile) resolves.
  // No mobile drawer toggle exists — mobile navigates via the bottom tab bar.
  isSidebarOpen = signal(false);
  isMobile = signal(false);

  readonly announced = toSignal(
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      map(() => this.title.getTitle()),
    ),
    { initialValue: '' },
  );

  private resizeObserver?: ResizeObserver;

  ngOnInit() {
    this.checkScreenSize();
    this.initializeResizeObserver();
    this.initializeFocusManagement();
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private initializeFocusManagement() {
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      document.getElementById('main-content')?.focus({ preventScroll: true });
    });
  }

  private checkScreenSize() {
    if (typeof window !== 'undefined') {
      this.isMobile.set(window.innerWidth < 768);
    }
  }

  private initializeResizeObserver() {
    if (typeof window === 'undefined' || !('ResizeObserver' in window)) return;

    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        this.isMobile.set(entry.contentRect.width < 768);
      }
    });
    this.resizeObserver.observe(document.body);
  }
}
