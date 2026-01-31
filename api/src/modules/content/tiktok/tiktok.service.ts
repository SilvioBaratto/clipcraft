import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { BamlService } from '../../../shared/baml/baml.service';
import type { TikTokScript } from '../../../../baml_client/types';

@Injectable()
export class TikTokService {
  private readonly logger = new Logger(TikTokService.name);

  constructor(private readonly bamlService: BamlService) {}

  async generateScript(topic: string): Promise<TikTokScript> {
    try {
      this.logger.log(`Generating TikTok script for topic: ${topic}`);

      // The BAML function expects a raw script, so we'll use the topic as the raw script input
      // The LLM will structure it into the TikTokScript format with hook, sections, and CTA
      const script = await this.bamlService.generateCompleteTikTokScript(topic);

      this.logger.log(`Successfully generated script: ${script.folder_name}`);
      return script;
    } catch (error) {
      this.logger.error(`Failed to generate TikTok script: ${error.message}`, error.stack);
      throw new InternalServerErrorException(
        'Failed to generate TikTok script. Please try again later.',
      );
    }
  }
}
