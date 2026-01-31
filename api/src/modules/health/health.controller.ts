import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Health check endpoint' })
  @ApiResponse({
    status: 200,
    description: 'Service is healthy',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-24T12:00:00.000Z',
        uptime: 123.456,
        environment: 'development',
      },
    },
  })
  check() {
    return this.healthService.check();
  }

  @Get('detailed')
  @ApiOperation({ summary: 'Detailed health check with service dependencies' })
  @ApiResponse({
    status: 200,
    description: 'Detailed health information',
    schema: {
      example: {
        status: 'ok',
        timestamp: '2024-01-24T12:00:00.000Z',
        uptime: 123.456,
        environment: 'development',
        services: {
          baml: 'ok',
          api: 'ok',
        },
        memory: {
          used: 50.5,
          total: 100,
          percentage: 50.5,
        },
      },
    },
  })
  detailed() {
    return this.healthService.detailedCheck();
  }
}
