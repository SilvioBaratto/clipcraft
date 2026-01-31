import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { TikTokModule } from './tiktok/tiktok.module';
import { CarouselModule } from './carousel/carousel.module';
import { AnimationModule } from './animation/animation.module';
import { PreviewModule } from './preview/preview.module';

@Module({
  imports: [TikTokModule, CarouselModule, AnimationModule, PreviewModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [CarouselModule, AnimationModule, PreviewModule],
})
export class ContentModule {}
