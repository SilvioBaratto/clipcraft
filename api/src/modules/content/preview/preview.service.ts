import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { promises as fs } from 'fs';
import * as path from 'path';
import type { Preview, Project } from '@prisma/client';
import { PrismaService } from '../../../shared/prisma/prisma.service';
import { BamlService } from '../../../shared/baml/baml.service';
import { RenderingService } from '../../../shared/rendering/rendering.service';
import { PLATFORM_DIMS, Platform, PreviewTemplateService } from './preview-template.service';

export interface OverridePreviewDto {
  templateId?: string;
  title?: string | null;
  parte?: number | null;
}

const PLATFORMS: Platform[] = ['instagram', 'tiktok'];

@Injectable()
export class PreviewService {
  private readonly logger = new Logger(PreviewService.name);
  private readonly outputDir = process.env.PREVIEW_OUTPUT_DIR || path.join(process.cwd(), 'output');

  constructor(
    private readonly prisma: PrismaService,
    private readonly baml: BamlService,
    private readonly rendering: RenderingService,
    private readonly templates: PreviewTemplateService,
  ) {}

  // Deterministic hook → template rules, checked BEFORE the LLM. Some series
  // always open the hook with a fixed phrase, so they can be pinned exactly.
  private readonly hookRules: { pattern: RegExp; templateId: string }[] = [
    { pattern: /^[\s"'“”]*se lo capisce (mia|la) nonna/i, templateId: 'se_lo_capisce_la_nonna' },
  ];

  private matchByHook(hook: string): string | null {
    const h = hook ?? '';
    for (const rule of this.hookRules) {
      if (rule.pattern.test(h)) return rule.templateId;
    }
    return null;
  }

  /** Pick the best template (rule → LLM fallback) + title, then render both covers. */
  async generateForProject(projectId: string): Promise<Preview> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);

    let templateId: string;
    let selectionTitle: string | null = null;

    const forced = this.matchByHook(project.hook);
    if (forced) {
      templateId = forced;
      this.logger.log(`Preview template pinned by hook rule: ${templateId}`);
    } else {
      const options = this.templates.list().map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        needs_title: t.fields.some((f) => f.key === 'title' && f.llm),
      }));
      const selection = await this.baml.pickPreviewTemplate(project.hook, options);
      templateId = this.templates.list().some((t) => t.id === selection.template_id)
        ? selection.template_id
        : this.templates.list()[0].id;
      selectionTitle = selection.title || null;
    }

    const needsTitle = this.templates.needsTitle(templateId);
    const title = needsTitle ? selectionTitle : null;
    const existing = await this.prisma.preview.findUnique({ where: { projectId } });

    const preview = await this.prisma.preview.upsert({
      where: { projectId },
      update: { templateId, title, parte: existing?.parte ?? this.defaultParte(templateId) },
      create: { projectId, templateId, title, parte: this.defaultParte(templateId) },
    });

    return this.renderAndSave(project, preview);
  }

  /** Manual override from the UI: switch template / edit title / set Parte. */
  async override(projectId: string, dto: OverridePreviewDto): Promise<Preview> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    const current = await this.prisma.preview.findUnique({ where: { projectId } });
    if (!current) throw new NotFoundException(`Preview for project ${projectId} not found`);

    const templateId = dto.templateId ?? current.templateId;
    this.templates.get(templateId); // validate

    const preview = await this.prisma.preview.update({
      where: { projectId },
      data: {
        templateId,
        title: dto.title !== undefined ? dto.title : current.title,
        parte: dto.parte !== undefined ? dto.parte : current.parte,
      },
    });

    return this.renderAndSave(project, preview);
  }

  /** Absolute path to a rendered cover, rendering on demand if missing. */
  async getImageFile(projectId: string, platform: Platform): Promise<string> {
    const preview = await this.prisma.preview.findUnique({ where: { projectId } });
    if (!preview) throw new NotFoundException(`Preview for project ${projectId} not found`);
    const rel = platform === 'instagram' ? preview.instagramPath : preview.tiktokPath;
    const abs = rel ? path.join(this.outputDir, rel) : null;
    if (abs && (await this.exists(abs))) return abs;

    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    if (!project) throw new NotFoundException(`Project ${projectId} not found`);
    await this.renderAndSave(project, preview);
    return path.join(this.outputDir, this.relPath(project, platform));
  }

  private async renderAndSave(project: Project, preview: Preview): Promise<Preview> {
    const paths: Partial<Record<Platform, string>> = {};
    for (const platform of PLATFORMS) {
      const dim = PLATFORM_DIMS[platform];
      const html = await this.templates.render(preview.templateId, platform, {
        title: preview.title,
        parte: preview.parte,
      });
      const buffer = await this.rendering.renderHtmlToPng(html, dim.width, dim.height, true);
      const rel = this.relPath(project, platform);
      const abs = path.join(this.outputDir, rel);
      await fs.mkdir(path.dirname(abs), { recursive: true });
      await fs.writeFile(abs, buffer);
      paths[platform] = rel;
      this.logger.log(`Rendered preview ${rel} (${dim.width}x${dim.height})`);
    }

    return this.prisma.preview.update({
      where: { id: preview.id },
      data: { instagramPath: paths.instagram, tiktokPath: paths.tiktok },
    });
  }

  private relPath(project: Project, platform: Platform): string {
    const folder = (project.folderName || project.id).replace(/[^a-zA-Z0-9_-]/g, '_');
    return path.join(folder, `${platform}.png`);
  }

  private defaultParte(templateId: string): number | null {
    return this.templates.get(templateId).fields.some((f) => f.key === 'parte') ? 1 : null;
  }

  private async exists(p: string): Promise<boolean> {
    try {
      await fs.access(p);
      return true;
    } catch {
      return false;
    }
  }
}
