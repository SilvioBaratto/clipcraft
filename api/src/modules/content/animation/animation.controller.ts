import { Controller, Post, Patch, Param, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { AnimationService } from './animation.service';
import { GenerateAnimationDto } from './dto/generate-animation.dto';
import { ApiContentGenerationResponses } from '../../../common/decorators/api-response.decorator';

class UpdateSceneHtmlDto {
  @IsString()
  generatedHtml: string;
}

@ApiTags('animation')
@Controller('content/animation')
export class AnimationController {
  constructor(private readonly animationService: AnimationService) {}

  @Post('scenes/:id/repair')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Vision-repair a scene',
    description: 'Render the scene, let Opus see it + the HTML, return fixed HTML (not saved)',
  })
  async repairScene(@Param('id') id: string) {
    return this.animationService.repairScene(id);
  }

  @Patch('scenes/:id/html')
  @ApiOperation({ summary: 'Save confirmed scene HTML (the "Keep" action)' })
  async saveSceneHtml(@Param('id') id: string, @Body() dto: UpdateSceneHtmlDto) {
    return this.animationService.updateSceneHtml(id, dto.generatedHtml);
  }

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
