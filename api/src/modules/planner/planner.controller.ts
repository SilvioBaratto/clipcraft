import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PlannerService } from './planner.service';
import { CreateEntryDto, CreateTaskDto, UpdateEntryDto, UpdateTaskDto } from './dto/planner.dto';

@ApiTags('Planner')
@Controller('planner')
export class PlannerController {
  constructor(private readonly plannerService: PlannerService) {}

  @Get()
  @ApiOperation({ summary: 'Get the full content planner (calendar entries + tasks)' })
  getPlanner() {
    return this.plannerService.getPlanner();
  }

  // Calendar entries
  @Post('entries')
  @ApiOperation({ summary: 'Create or upsert a calendar entry by date' })
  createEntry(@Body() dto: CreateEntryDto) {
    return this.plannerService.createEntry(dto);
  }

  @Patch('entries/:id')
  @ApiOperation({ summary: 'Update a calendar entry (theme / published)' })
  updateEntry(@Param('id') id: string, @Body() dto: UpdateEntryDto) {
    return this.plannerService.updateEntry(id, dto);
  }

  @Delete('entries/:id')
  @ApiOperation({ summary: 'Delete a calendar entry' })
  deleteEntry(@Param('id') id: string) {
    return this.plannerService.deleteEntry(id);
  }

  // Checklist tasks (weekend prep, ideas)
  @Post('tasks')
  @ApiOperation({ summary: 'Create a checklist task' })
  createTask(@Body() dto: CreateTaskDto) {
    return this.plannerService.createTask(dto);
  }

  @Patch('tasks/:id')
  @ApiOperation({ summary: 'Update a checklist task (label / done / order)' })
  updateTask(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.plannerService.updateTask(id, dto);
  }

  @Delete('tasks/:id')
  @ApiOperation({ summary: 'Delete a checklist task' })
  deleteTask(@Param('id') id: string) {
    return this.plannerService.deleteTask(id);
  }
}
