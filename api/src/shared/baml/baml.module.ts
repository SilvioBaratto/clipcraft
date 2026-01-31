import { Module, Global } from '@nestjs/common';
import { BamlService } from './baml.service';

@Global()
@Module({
  providers: [BamlService],
  exports: [BamlService],
})
export class BamlModule {}
