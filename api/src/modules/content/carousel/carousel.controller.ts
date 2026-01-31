import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CarouselService } from './carousel.service';
import { GenerateCarouselDto } from './dto/generate-carousel.dto';
import { ApiContentGenerationResponses } from '../../../common/decorators/api-response.decorator';

@ApiTags('carousel')
@Controller('content/carousel')
export class CarouselController {
  constructor(private readonly carouselService: CarouselService) {}

  @Post('generate')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate carousel content',
    description: 'Generate carousel slides with topic, main text, and visual elements',
  })
  @ApiContentGenerationResponses()
  async generate(@Body() dto: GenerateCarouselDto) {
    return this.carouselService.generateCarousel(dto.topic, dto.platform, dto.canvas, dto.ratio);
  }

  @Post('generate-with-html')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Generate carousel with HTML',
    description: 'Generate carousel content and corresponding HTML representation',
  })
  @ApiContentGenerationResponses()
  async generateWithHTML(@Body() dto: GenerateCarouselDto) {
    return this.carouselService.generateCarouselWithHTML(
      dto.topic,
      dto.platform,
      dto.canvas,
      dto.ratio,
    );
  }
}
