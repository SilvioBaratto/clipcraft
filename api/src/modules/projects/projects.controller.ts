import { Body, Controller, Delete, Get, Param, Patch, Post, Res } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, ProjectResponseDto } from './dto/extract-metadata.dto';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a new project',
    description: 'Extracts metadata from a script using AI and creates a new project',
  })
  @ApiResponse({
    status: 201,
    description: 'Project created successfully',
    type: ProjectResponseDto,
  })
  async createProject(@Body() dto: CreateProjectDto): Promise<ProjectResponseDto> {
    return this.projectsService.createProject(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all projects',
    description: 'Returns all projects ordered by creation date (newest first)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all projects',
    type: [ProjectResponseDto],
  })
  async findAll(): Promise<ProjectResponseDto[]> {
    return this.projectsService.findAll();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get project by ID',
    description: 'Returns a single project by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project found',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async findById(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.findById(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update project status',
    description: 'Updates the generation status flags for a project',
  })
  @ApiResponse({
    status: 200,
    description: 'Project status updated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() status: { hasAnimations?: boolean; hasCarousel?: boolean; hasPreview?: boolean },
  ): Promise<ProjectResponseDto> {
    return this.projectsService.updateStatus(id, status);
  }

  @Post(':id/generate')
  @ApiOperation({
    summary: 'Generate all content for a project',
    description: 'Generates carousel slides and animation scenes for a project and saves them to the database',
  })
  @ApiResponse({
    status: 201,
    description: 'Content generated successfully',
    type: ProjectResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async generateContent(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.generateAllContent(id);
  }

  @Post(':id/generate/carousel')
  @ApiOperation({ summary: 'Generate carousel for a project (step 1/3)' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  async generateCarousel(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.generateCarouselContent(id);
  }

  @Post(':id/generate/animations')
  @ApiOperation({ summary: 'Generate animations for a project (step 2/3)' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  async generateAnimations(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.generateAnimationContent(id);
  }

  @Post(':id/generate/previews')
  @ApiOperation({ summary: 'Generate previews for a project (step 3/3)' })
  @ApiResponse({ status: 201, type: ProjectResponseDto })
  async generatePreviews(@Param('id') id: string): Promise<ProjectResponseDto> {
    return this.projectsService.generatePreviewContent(id);
  }

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download project as PNG ZIP',
    description:
      'Renders all project content to PNG using Playwright and streams a ZIP archive',
  })
  @ApiResponse({
    status: 200,
    description: 'ZIP archive streamed successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async downloadProject(
    @Param('id') id: string,
    @Res() res: Response,
  ): Promise<void> {
    await this.projectsService.streamProjectZip(id, res);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a project',
    description: 'Deletes a project by its ID',
  })
  @ApiResponse({
    status: 200,
    description: 'Project deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Project not found',
  })
  async delete(@Param('id') id: string): Promise<{ message: string }> {
    await this.projectsService.delete(id);
    return { message: 'Project deleted successfully' };
  }
}
