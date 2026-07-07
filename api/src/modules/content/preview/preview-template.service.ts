import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';

export type Platform = 'instagram' | 'tiktok';

export interface TemplateField {
  key: 'title' | 'parte';
  type: 'text' | 'number';
  llm: boolean;
  label: string;
}

export interface TemplateManifest {
  id: string;
  name: string;
  description: string;
  fields: TemplateField[];
}

export interface PlatformDim {
  width: number;
  height: number;
}

export const PLATFORM_DIMS: Record<Platform, PlatformDim> = {
  instagram: { width: 1080, height: 1920 },
  tiktok: { width: 1080, height: 1440 },
};

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Loads the bundled cover-template library and injects the editable fields. */
@Injectable()
export class PreviewTemplateService implements OnModuleInit {
  private readonly logger = new Logger(PreviewTemplateService.name);
  private readonly dir = process.env.PREVIEW_TEMPLATES_DIR || path.join(process.cwd(), 'preview-templates');
  private manifest: TemplateManifest[] = [];

  async onModuleInit() {
    try {
      const raw = await fs.readFile(path.join(this.dir, 'templates.json'), 'utf8');
      this.manifest = JSON.parse(raw);
      this.logger.log(`Loaded ${this.manifest.length} preview templates from ${this.dir}`);
    } catch (e) {
      this.logger.error(`Failed to load preview templates: ${e.message}`);
      this.manifest = [];
    }
  }

  list(): TemplateManifest[] {
    return this.manifest;
  }

  get(id: string): TemplateManifest {
    const t = this.manifest.find((m) => m.id === id);
    if (!t) throw new NotFoundException(`Preview template "${id}" not found`);
    return t;
  }

  /** True when the template expects an LLM-written freeform headline. */
  needsTitle(id: string): boolean {
    return this.get(id).fields.some((f) => f.key === 'title' && f.llm);
  }

  /** Read the platform HTML and inject {{TITLE}} / {{PARTE}} placeholders. */
  async render(
    id: string,
    platform: Platform,
    values: { title?: string | null; parte?: number | null },
  ): Promise<string> {
    this.get(id); // validates existence
    const file = path.join(this.dir, id, `preview_${platform}.html`);
    let html = await fs.readFile(file, 'utf8');
    html = html.replace(/\{\{TITLE\}\}/g, values.title ? escapeHtml(values.title) : '');
    html = html.replace(/\{\{PARTE\}\}/g, String(values.parte ?? 1));
    return html;
  }
}
