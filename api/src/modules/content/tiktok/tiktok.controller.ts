import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TikTokService } from './tiktok.service';
import { GenerateTikTokScriptDto } from './dto/generate-tiktok-script.dto';
import { ApiContentGenerationResponses } from '../../../common/decorators/api-response.decorator';

@ApiTags('tiktok')
@Controller('content/tiktok')
export class TikTokController {
  constructor(private readonly tiktokService: TikTokService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate TikTok script',
    description:
      'Generate a TikTok script with hook, sections, and CTA based on the provided topic',
  })
  @ApiContentGenerationResponses()
  async generate(@Body() dto: GenerateTikTokScriptDto) {
    return this.tiktokService.generateScript(dto.topic);
  }
}
