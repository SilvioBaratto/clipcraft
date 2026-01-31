import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ContentService } from './content.service';

@ApiTags('content')
@Controller('content')
export class ContentController {
  constructor(private readonly contentService: ContentService) {}

  @Get()
  @ApiOperation({ summary: 'Get available content generation endpoints' })
  @ApiResponse({
    status: 200,
    description: 'List of available content generation endpoints',
  })
  getEndpoints() {
    return this.contentService.getAvailableEndpoints();
  }
}
