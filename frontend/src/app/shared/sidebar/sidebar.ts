import { Component, computed, input, output, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { NavItem, NAV_ITEMS } from '../nav-item';
import { DrawerComponent } from '../ui/drawer/drawer';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule, DrawerComponent],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SidebarComponent {
  isOpen = input<boolean>(false);
  isMobile = input<boolean>(false);

  closeSidebar = output<void>();

  navItems: NavItem[] = NAV_ITEMS;

  /** Desktop always shows; mobile shows only when open. */
  readonly showSidebar = computed(() => !this.isMobile() || this.isOpen());

  onNavClick() {
    this.closeSidebar.emit();
  }
}
