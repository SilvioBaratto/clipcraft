import {
  Directive,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  output,
} from '@angular/core';

const FOCUSABLE = 'a[href],button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),[tabindex]:not([tabindex="-1"])';

@Directive({
  selector: '[appFocusTrap]',
  host: {
    '(keydown)': 'onKeydown($event)',
  },
})
export class FocusTrapDirective implements OnDestroy {
  readonly active = input(false);
  readonly close = output<void>();

  private readonly el = inject(ElementRef<HTMLElement>);
  private previousElement: Element | null = null;

  constructor() {
    effect(() => {
      if (this.active()) {
        this.activate();
      } else {
        this.deactivate();
      }
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (!this.active()) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close.emit();
      return;
    }
    if (event.key === 'Tab') {
      this.trapTab(event);
    }
  }

  ngOnDestroy(): void {
    this.deactivate();
  }

  private activate(): void {
    this.previousElement = document.activeElement;
    this.setSiblingInert(true);
    const first = this.focusableChildren()[0] as HTMLElement | undefined;
    first?.focus();
  }

  private deactivate(): void {
    this.setSiblingInert(false);
    (this.previousElement as HTMLElement | null)?.focus();
    this.previousElement = null;
  }

  private trapTab(event: KeyboardEvent): void {
    const children = this.focusableChildren();
    if (!children.length) { event.preventDefault(); return; }
    const first = children[0] as HTMLElement;
    const last = children[children.length - 1] as HTMLElement;
    if (event.shiftKey) {
      if (document.activeElement === first) { event.preventDefault(); last.focus(); }
    } else {
      if (document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  }

  private focusableChildren(): Element[] {
    return Array.from(this.el.nativeElement.querySelectorAll(FOCUSABLE) as NodeListOf<HTMLElement>);
  }

  private setSiblingInert(inert: boolean): void {
    const host = this.el.nativeElement as HTMLElement;
    const parent = host.parentElement;
    if (!parent) return;
    Array.from(parent.children).forEach((sibling) => {
      if (sibling === host) return;
      if (inert) {
        sibling.setAttribute('inert', '');
        sibling.setAttribute('aria-hidden', 'true');
      } else {
        sibling.removeAttribute('inert');
        sibling.removeAttribute('aria-hidden');
      }
    });
  }
}
