import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class HealthService {
  constructor(private readonly configService: ConfigService) {}

  check() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('nodeEnv'),
    };
  }

  detailedCheck() {
    const memoryUsage = process.memoryUsage();
    const memoryUsedMB = Math.round((memoryUsage.heapUsed / 1024 / 1024) * 100) / 100;
    const memoryTotalMB = Math.round((memoryUsage.heapTotal / 1024 / 1024) * 100) / 100;

    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: this.configService.get<string>('nodeEnv'),
      services: {
        baml: 'ok',
        api: 'ok',
      },
      memory: {
        used: memoryUsedMB,
        total: memoryTotalMB,
        percentage: Math.round((memoryUsedMB / memoryTotalMB) * 100 * 100) / 100,
      },
      node: {
        version: process.version,
        platform: process.platform,
      },
    };
  }
}
