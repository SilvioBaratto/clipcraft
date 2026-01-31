import {
  Directive,
  ElementRef,
  Input,
  AfterViewInit,
  OnDestroy,
  inject,
  effect,
  signal,
} from '@angular/core';

/**
 * Directive to scale iframe content to fit its container.
 * Based on CSS Transform Origin and Scale technique.
 * @see https://mudosdigital.com/css-transform-origin-and-scale-with-responsive-preview-containers/
 */
@Directive({
  selector: '[appScaledIframe]',
})
export class ScaledIframeDirective implements AfterViewInit, OnDestroy {
  private readonly el = inject(ElementRef<HTMLElement>);
  private resizeObserver: ResizeObserver | null = null;

  /** Original content width in pixels */
  @Input({ required: true }) contentWidth = 1080;

  /** Original content height in pixels */
  @Input({ required: true }) contentHeight = 1920;

  private containerWidth = signal(0);

  constructor() {
    // React to container width changes
    effect(() => {
      const width = this.containerWidth();
      if (width > 0) {
        this.applyScale(width);
      }
    });
  }

  ngAfterViewInit() {
    const container = this.el.nativeElement;
    const iframe = container.querySelector('iframe');

    if (!iframe) return;

    // Set up iframe base styles
    iframe.style.position = 'absolute';
    iframe.style.top = '0';
    iframe.style.left = '0';
    iframe.style.width = `${this.contentWidth}px`;
    iframe.style.height = `${this.contentHeight}px`;
    iframe.style.transformOrigin = '0 0';
    iframe.style.border = '0';

    // Set up container styles
    container.style.position = 'relative';
    container.style.overflow = 'hidden';

    // Observe container size changes
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const width = entry.contentRect.width;
        this.containerWidth.set(width);
      }
    });

    this.resizeObserver.observe(container);

    // Initial scale
    const initialWidth = container.getBoundingClientRect().width;
    if (initialWidth > 0) {
      this.containerWidth.set(initialWidth);
    }
  }

  ngOnDestroy() {
    this.resizeObserver?.disconnect();
  }

  private applyScale(containerWidth: number) {
    const container = this.el.nativeElement;
    const iframe = container.querySelector('iframe') as HTMLIFrameElement;

    if (!iframe) return;

    // Calculate scale factor based on container width
    const scale = containerWidth / this.contentWidth;

    // Apply transform
    iframe.style.transform = `scale(${scale})`;

    // Adjust container height to match scaled content
    const scaledHeight = this.contentHeight * scale;
    container.style.height = `${scaledHeight}px`;
  }
}
