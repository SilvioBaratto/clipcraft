import { Injectable } from '@nestjs/common';

@Injectable()
export class ContentService {
  getAvailableEndpoints() {
    return {
      message: 'ClipCraft Content Generation API',
      endpoints: {
        animation: {
          generate: 'POST /api/v1/content/animation/generate',
          generateWithHTML: 'POST /api/v1/content/animation/generate-with-html',
          description: 'Generate animation set and optionally HTML',
        },
      },
    };
  }
}
