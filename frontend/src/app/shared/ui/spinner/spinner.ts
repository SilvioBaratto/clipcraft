import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-spinner',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  template: `
    <span role="status">
      <lucide-icon name="loader-2" class="motion-safe:animate-spin" aria-hidden="true" />
      <span class="sr-only">{{ label() }}</span>
    </span>
  `,
})
export class SpinnerComponent {
  readonly label = input('Loading…');
}
