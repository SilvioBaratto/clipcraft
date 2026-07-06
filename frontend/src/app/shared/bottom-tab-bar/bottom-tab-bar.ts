import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';

import { NavItem, NAV_ITEMS } from '../nav-item';

@Component({
  selector: 'app-bottom-tab-bar',
  imports: [RouterLink, RouterLinkActive, LucideAngularModule],
  templateUrl: './bottom-tab-bar.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block md:hidden sticky bottom-0 z-30' },
})
export class BottomTabBarComponent {
  tabs: NavItem[] = NAV_ITEMS;
}
