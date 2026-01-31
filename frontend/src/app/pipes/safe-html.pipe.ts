import { Pipe, PipeTransform, inject } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml',
})
export class SafeHtmlPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string): SafeHtml {
    const cleanedHtml = this.stripMarkdownCodeBlocks(value);
    return this.sanitizer.bypassSecurityTrustHtml(cleanedHtml);
  }

  private stripMarkdownCodeBlocks(html: string): string {
    if (!html) return '';
    // Remove markdown code fence wrappers (```html ... ``` or ``` ... ```)
    return html.replace(/^```(?:html)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  }
}
