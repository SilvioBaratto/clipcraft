import { Module } from '@nestjs/common';
import { BamlModule } from '../../../shared/baml/baml.module';
import { PreviewController } from './preview.controller';
import { PreviewService } from './preview.service';
import { PreviewTemplateService } from './preview-template.service';

@Module({
  imports: [BamlModule],
  controllers: [PreviewController],
  providers: [PreviewService, PreviewTemplateService],
  exports: [PreviewService],
})
export class PreviewModule {}
