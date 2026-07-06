import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { PlannerData, PlannerEntry, PlannerSection, PlannerTask } from '../models/planner.model';

@Injectable({ providedIn: 'root' })
export class PlannerService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/planner';

  readonly entries = signal<PlannerEntry[]>([]);
  readonly tasks = signal<PlannerTask[]>([]);
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);

  async load(): Promise<void> {
    this.isLoading.set(true);
    this.error.set(null);
    try {
      const data = await firstValueFrom(this.http.get<PlannerData>(this.baseUrl));
      this.entries.set(data.entries);
      this.tasks.set(data.tasks);
    } catch (e) {
      this.error.set(e instanceof Error ? e.message : 'Failed to load planner');
    } finally {
      this.isLoading.set(false);
    }
  }

  // ---- Entries -------------------------------------------------------------

  async setEntryTheme(id: string, theme: string): Promise<void> {
    const value = theme.trim() === '' ? null : theme;
    this.patchEntryLocal(id, { theme: value });
    await this.patchEntry(id, { theme: value });
  }

  async toggleEntryPublished(id: string): Promise<void> {
    const current = this.entries().find((e) => e.id === id);
    if (!current) return;
    const next = !current.published;
    this.patchEntryLocal(id, { published: next });
    await this.patchEntry(id, { published: next });
  }

  async toggleEntryPrepared(id: string): Promise<void> {
    const current = this.entries().find((e) => e.id === id);
    if (!current) return;
    const next = !current.prepared;
    this.patchEntryLocal(id, { prepared: next });
    await this.patchEntry(id, { prepared: next });
  }

  async addEntry(date: string, theme: string): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<PlannerEntry>(`${this.baseUrl}/entries`, { date, theme: theme || undefined }),
    );
    this.entries.update((list) => {
      const rest = list.filter((e) => e.id !== created.id && e.date.slice(0, 10) !== created.date.slice(0, 10));
      return [...rest, created].sort((a, b) => a.date.localeCompare(b.date));
    });
  }

  async deleteEntry(id: string): Promise<void> {
    this.entries.update((list) => list.filter((e) => e.id !== id));
    await firstValueFrom(this.http.delete(`${this.baseUrl}/entries/${id}`));
  }

  // ---- Tasks ---------------------------------------------------------------

  async toggleTask(id: string): Promise<void> {
    const current = this.tasks().find((t) => t.id === id);
    if (!current) return;
    const next = !current.done;
    this.patchTaskLocal(id, { done: next });
    await firstValueFrom(this.http.patch(`${this.baseUrl}/tasks/${id}`, { done: next }));
  }

  async setTaskLabel(id: string, label: string): Promise<void> {
    this.patchTaskLocal(id, { label });
    await firstValueFrom(this.http.patch(`${this.baseUrl}/tasks/${id}`, { label }));
  }

  async addTask(section: PlannerSection, label: string): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<PlannerTask>(`${this.baseUrl}/tasks`, { section, label }),
    );
    this.tasks.update((list) => [...list, created]);
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.update((list) => list.filter((t) => t.id !== id));
    await firstValueFrom(this.http.delete(`${this.baseUrl}/tasks/${id}`));
  }

  // ---- helpers -------------------------------------------------------------

  private async patchEntry(id: string, body: Partial<PlannerEntry>): Promise<void> {
    try {
      await firstValueFrom(this.http.patch(`${this.baseUrl}/entries/${id}`, body));
    } catch {
      await this.load();
    }
  }

  private patchEntryLocal(id: string, patch: Partial<PlannerEntry>): void {
    this.entries.update((list) => list.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }

  private patchTaskLocal(id: string, patch: Partial<PlannerTask>): void {
    this.tasks.update((list) => list.map((t) => (t.id === id ? { ...t, ...patch } : t)));
  }
}
