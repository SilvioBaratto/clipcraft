import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { LucideAngularModule } from 'lucide-angular';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-white hover:bg-primary-hover active:bg-primary-hover',
  secondary:
    'bg-surface-raised text-text border border-border hover:bg-surface-inset active:bg-surface-inset',
  ghost:
    'bg-transparent text-text hover:bg-surface-inset active:bg-surface-inset',
  danger:
    'bg-danger text-white hover:opacity-90 active:opacity-80',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'min-h-11 px-3 py-1.5 text-sm gap-1.5',
  md: 'min-h-11 px-4 py-2 text-sm gap-2',
  lg: 'min-h-11 px-6 py-2.5 text-base gap-2',
};

@Component({
  selector: 'app-button',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [LucideAngularModule],
  host: {
    // `block` makes the host a flex box so a passed `w-full` / `sm:w-auto` on the
    // host resolves correctly and the inner button stretches to fill it.
    '[class.flex]': 'block()',
    '[attr.aria-busy]': 'loading() || null',
    '[attr.aria-disabled]': 'disabled() || null',
    '[attr.disabled]': 'disabled() || null',
  },
  template: `
    <button
      [class]="classes()"
      [disabled]="disabled() || loading()"
      [attr.aria-busy]="loading() || null"
      [attr.aria-disabled]="disabled() || null"
      (click)="handleClick()"
    >
      @if (loading()) {
        <lucide-icon name="loader-2" class="animate-spin" aria-hidden="true" />
      }
      <ng-content />
    </button>
  `,
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly loading = input(false);
  readonly disabled = input(false);
  /** Stretch the button to the full width of its host (pair with `class="w-full sm:w-auto"`). */
  readonly block = input(false);

  readonly clicked = output<void>();

  readonly classes = computed(() => {
    const base =
      'inline-flex items-center justify-center rounded-md font-medium transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed';
    const width = this.block() ? 'w-full' : '';
    return `${base} ${width} ${VARIANT_CLASSES[this.variant()]} ${SIZE_CLASSES[this.size()]}`;
  });

  handleClick(): void {
    if (this.disabled() || this.loading()) return;
    this.clicked.emit();
  }
}
