import { Module } from '@nestjs/common';
import { ContentController } from './content.controller';
import { ContentService } from './content.service';
import { AnimationModule } from './animation/animation.module';

@Module({
  imports: [AnimationModule],
  controllers: [ContentController],
  providers: [ContentService],
  exports: [AnimationModule],
})
export class ContentModule {}
