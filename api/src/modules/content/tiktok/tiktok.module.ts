import { Module } from '@nestjs/common';
import { TikTokController } from './tiktok.controller';
import { TikTokService } from './tiktok.service';

@Module({
  controllers: [TikTokController],
  providers: [TikTokService],
})
export class TikTokModule {}
