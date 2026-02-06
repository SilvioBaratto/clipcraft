import { Module, Global } from '@nestjs/common';
import { RenderingService } from './rendering.service';

@Global()
@Module({
  providers: [RenderingService],
  exports: [RenderingService],
})
export class RenderingModule {}
