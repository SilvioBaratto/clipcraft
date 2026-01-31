import { Module } from '@nestjs/common';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';
import { BamlModule } from '../../shared/baml/baml.module';
import { ContentModule } from '../content/content.module';

@Module({
  imports: [BamlModule, ContentModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
