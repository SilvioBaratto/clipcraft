import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentService {
  getAvailableEndpoints() {
    return {
      message: 'ClipCraft Content Generation API',
      endpoints: {
        tiktok: {
          generate: 'POST /api/v1/content/tiktok/generate',
          description: 'Generate TikTok script from a topic',
        },
        carousel: {
          generate: 'POST /api/v1/content/carousel/generate',
          generateWithHTML: 'POST /api/v1/content/carousel/generate-with-html',
          description: 'Generate carousel content and optionally HTML',
        },
        animation: {
          generate: 'POST /api/v1/content/animation/generate',
          generateWithHTML: 'POST /api/v1/content/animation/generate-with-html',
          description: 'Generate animation set and optionally HTML',
        },
      },
    };
  }
}
