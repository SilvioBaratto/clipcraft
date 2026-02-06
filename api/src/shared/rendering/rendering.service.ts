import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { chromium, Browser, BrowserContext } from 'playwright-core';
import * as sharp from 'sharp';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class RenderingService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RenderingService.name);
  private browser: Browser | null = null;
  private logoBuffer: Buffer | null = null;

  async onModuleInit() {
    try {
      const executablePath = process.env.CHROMIUM_EXECUTABLE_PATH || undefined;
      this.browser = await chromium.launch({
        headless: true,
        ...(executablePath ? { executablePath } : {}),
      });
      this.logger.log(
        `Playwright Chromium browser launched${executablePath ? ` (${executablePath})` : ''}`,
      );
    } catch (error) {
      this.logger.error(
        `Failed to launch Chromium: ${error.message}. Rendering will not be available.`,
      );
    }

    // Load profile logo once at startup
    const logoPath =
      process.env.PROFILE_LOGO_PATH ||
      path.resolve(__dirname, '..', '..', '..', 'profile.jpeg');
    try {
      if (fs.existsSync(logoPath)) {
        this.logoBuffer = fs.readFileSync(logoPath);
        this.logger.log(`Profile logo loaded from ${logoPath}`);
      } else {
        this.logger.warn(
          `Profile logo not found at ${logoPath}. Logo overlay will be skipped.`,
        );
      }
    } catch (error) {
      this.logger.warn(`Could not load profile logo: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.browser) {
      await this.browser.close();
      this.logger.log('Playwright Chromium browser closed');
    }
  }

  /**
   * Render HTML string to a PNG buffer using Playwright.
   * Optionally overlays a circular profile logo at bottom-left.
   */
  async renderHtmlToPng(
    html: string,
    width: number,
    height: number,
    skipLogo: boolean,
  ): Promise<Buffer> {
    if (!this.browser) {
      throw new Error('Chromium browser is not available');
    }

    let context: BrowserContext | null = null;
    try {
      context = await this.browser.newContext({
        viewport: { width, height },
      });
      const page = await context.newPage();

      await page.setContent(html, { waitUntil: 'networkidle' });
      // Extra wait for Google Fonts / web font rendering
      await page.waitForTimeout(2000);

      const pngBuffer = await page.screenshot({
        fullPage: false,
        type: 'png',
      });

      let result: Buffer = Buffer.from(pngBuffer);

      if (!skipLogo && this.logoBuffer) {
        result = await this.overlayCircularLogo(result, width, height);
      }

      return result;
    } finally {
      if (context) {
        await context.close();
      }
    }
  }

  /**
   * Composite a circular-masked profile logo at bottom-left of the PNG.
   * Matches render_to_png.py logic: 256px logo, 30px margin from bottom-left.
   */
  private async overlayCircularLogo(
    pngBuffer: Buffer,
    width: number,
    height: number,
  ): Promise<Buffer> {
    if (!this.logoBuffer) return pngBuffer;

    const logoSize = 256;
    const margin = 30;

    // Resize logo to logoSize x logoSize
    const resizedLogo = await sharp(this.logoBuffer)
      .resize(logoSize, logoSize, { fit: 'cover' })
      .toBuffer();

    // Create circular mask (white circle on black background)
    const circleMask = Buffer.from(
      `<svg width="${logoSize}" height="${logoSize}">
        <circle cx="${logoSize / 2}" cy="${logoSize / 2}" r="${logoSize / 2}" fill="white"/>
      </svg>`,
    );

    // Apply circular mask to logo
    const circularLogo = await sharp(resizedLogo)
      .composite([
        {
          input: circleMask,
          blend: 'dest-in',
        },
      ])
      .png()
      .toBuffer();

    // Position: bottom-left with margin
    const x = margin;
    const y = height - logoSize - margin;

    // Composite onto the base image
    return sharp(pngBuffer)
      .composite([
        {
          input: circularLogo,
          left: x,
          top: y,
        },
      ])
      .png()
      .toBuffer();
  }
}
