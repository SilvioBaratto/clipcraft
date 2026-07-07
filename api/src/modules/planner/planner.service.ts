import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { CreateEntryDto, CreateTaskDto, UpdateEntryDto, UpdateTaskDto } from './dto/planner.dto';

/** Parse an ISO date (yyyy-mm-dd) to a UTC-midnight Date for a @db.Date column. */
function toDate(iso: string): Date {
  return new Date(`${iso.slice(0, 10)}T00:00:00.000Z`);
}

@Injectable()
export class PlannerService {
  constructor(private readonly prisma: PrismaService) {}

  /** Full planner payload for the page: calendar entries + checklist tasks. */
  async getPlanner() {
    const [entries, tasks] = await Promise.all([
      this.prisma.plannerEntry.findMany({ orderBy: { date: 'asc' } }),
      this.prisma.plannerTask.findMany({
        orderBy: [{ section: 'asc' }, { order: 'asc' }, { createdAt: 'asc' }],
      }),
    ]);
    return { entries, tasks };
  }

  // ---- Entries -------------------------------------------------------------

  createEntry(dto: CreateEntryDto) {
    return this.prisma.plannerEntry.upsert({
      where: { date: toDate(dto.date) },
      update: {
        theme: dto.theme ?? null,
        ...(dto.published !== undefined && { published: dto.published }),
      },
      create: {
        date: toDate(dto.date),
        theme: dto.theme ?? null,
        published: dto.published ?? false,
      },
    });
  }

  async updateEntry(id: string, dto: UpdateEntryDto) {
    await this.assertEntry(id);
    return this.prisma.plannerEntry.update({
      where: { id },
      data: {
        ...(dto.theme !== undefined && { theme: dto.theme }),
        ...(dto.prepared !== undefined && { prepared: dto.prepared }),
        ...(dto.published !== undefined && { published: dto.published }),
      },
    });
  }

  async deleteEntry(id: string) {
    await this.assertEntry(id);
    await this.prisma.plannerEntry.delete({ where: { id } });
    return { message: 'Entry deleted' };
  }

  // ---- Tasks ---------------------------------------------------------------

  async createTask(dto: CreateTaskDto) {
    const count = await this.prisma.plannerTask.count({ where: { section: dto.section } });
    return this.prisma.plannerTask.create({
      data: { section: dto.section, label: dto.label, order: count },
    });
  }

  async updateTask(id: string, dto: UpdateTaskDto) {
    await this.assertTask(id);
    return this.prisma.plannerTask.update({
      where: { id },
      data: {
        ...(dto.label !== undefined && { label: dto.label }),
        ...(dto.done !== undefined && { done: dto.done }),
        ...(dto.order !== undefined && { order: dto.order }),
      },
    });
  }

  async deleteTask(id: string) {
    await this.assertTask(id);
    await this.prisma.plannerTask.delete({ where: { id } });
    return { message: 'Task deleted' };
  }

  private async assertEntry(id: string) {
    const found = await this.prisma.plannerEntry.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`Planner entry ${id} not found`);
  }

  private async assertTask(id: string) {
    const found = await this.prisma.plannerTask.findUnique({ where: { id } });
    if (!found) throw new NotFoundException(`Planner task ${id} not found`);
  }
}
