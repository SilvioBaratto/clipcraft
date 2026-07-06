import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { FocusTrapDirective } from '../focus-trap/focus-trap.directive';

export type DrawerSide = 'left' | 'right';

const BASE =
  'fixed top-0 z-50 h-screen w-64 flex flex-col ' +
  'bg-surface-raised border-border shadow-xl transition-transform duration-200';

const SIDE_CLASSES: Record<DrawerSide, { base: string; open: string; closed: string }> = {
  left:  { base: 'left-0 border-r',  open: 'translate-x-0',    closed: '-translate-x-full' },
  right: { base: 'right-0 border-l', open: 'translate-x-0',    closed: 'translate-x-full'  },
};

@Component({
  selector: 'app-drawer',
  templateUrl: './drawer.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FocusTrapDirective],
  host: { '(document:keydown)': 'onDocumentKeydown($event)' },
})
export class DrawerComponent {
  readonly side      = input<DrawerSide>('left');
  readonly open      = input(false);
  readonly drawerId  = input('');
  /** When false, the focus trap is suppressed even though the panel is visible (e.g. desktop sidebar). */
  readonly trapFocus = input(true);
  readonly close     = output<void>();

  readonly isTrapActive = computed(() => this.open() && this.trapFocus());

  readonly panelClasses = computed(() => {
    const cfg = SIDE_CLASSES[this.side()];
    const slide = this.open() ? cfg.open : cfg.closed;
    return `${BASE} ${cfg.base} ${slide}`;
  });

  handleClose(): void {
    this.close.emit();
  }

  onDocumentKeydown(event: KeyboardEvent): void {
    if (this.open() && event.key === 'Escape' && !event.defaultPrevented) {
      this.handleClose();
    }
  }
}
