import { inject, Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

/**
 * Renders a markdown string to sanitized HTML via `marked`.
 * Ported from the ITAL-IA implementation: parse with marked, then wrap every
 * <table> in a horizontal-scroll container so wide tables never break the
 * column layout. Style the output with the global `.prose-md` class.
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  private readonly sanitizer = inject(DomSanitizer);

  transform(value: string | null | undefined): SafeHtml {
    if (!value) return '';
    const html = marked.parse(value, { async: false, gfm: true, breaks: false }) as string;
    const withTables = html
      .replace(/<table>/g, '<div class="table-scroll"><table>')
      .replace(/<\/table>/g, '</table></div>');
    return this.sanitizer.bypassSecurityTrustHtml(withTables);
  }
}
