import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      name: 'ClipCraft API',
      version: '1.0.0',
      description:
        'AI-powered content generation API for TikTok scripts, carousels, and animations',
      docs: '/api/docs',
      endpoints: {
        health: '/api/v1/health',
        content: '/api/v1/content',
      },
    };
  }
}
