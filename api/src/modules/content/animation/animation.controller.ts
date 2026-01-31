import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AnimationService } from './animation.service';
import { GenerateAnimationDto } from './dto/generate-animation.dto';
import { ApiContentGenerationResponses } from '../../../common/decorators/api-response.decorator';

@ApiTags('animation')
@Controller('content/animation')
export class AnimationController {
  constructor(private readonly animationService: AnimationService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate animation set',
    description: 'Generate animation scenes with visual elements and transitions',
  })
  @ApiContentGenerationResponses()
  async generate(@Body() dto: GenerateAnimationDto) {
    return this.animationService.generateAnimationSet(dto.topic);
  }

  @Post('generate-with-html')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate animation with HTML',
    description: 'Generate animation set and corresponding HTML representation',
  })
  @ApiContentGenerationResponses()
  async generateWithHTML(@Body() dto: GenerateAnimationDto) {
    return this.animationService.generateAnimationSetWithHTML(dto.topic);
  }
}
