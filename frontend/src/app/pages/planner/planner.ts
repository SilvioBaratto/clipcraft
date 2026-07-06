import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { PlannerService } from '../../services/planner.service';
import { PlannerEntry, PlannerTask } from '../../models/planner.model';

const IT_WEEKDAYS = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
const DAY_MS = 86_400_000;

interface WeekView {
  startMs: number;
  endMs: number;
  entries: PlannerEntry[];
}

@Component({
  selector: 'app-planner',
  imports: [FormsModule, LucideAngularModule],
  templateUrl: './planner.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block' },
})
export class PlannerComponent implements OnInit {
  private readonly planner = inject(PlannerService);

  readonly entries = this.planner.entries;
  readonly tasks = this.planner.tasks;
  readonly isLoading = this.planner.isLoading;
  readonly error = this.planner.error;

  // new-row form state
  readonly newDate = signal('');
  readonly newTheme = signal('');
  readonly newIdea = signal('');
  readonly newPrep = signal('');

  private readonly todayMs = this.startOfTodayUtc();

  /** Themed entries = the "Videos" list + publish sources. */
  readonly videos = computed(() =>
    this.entries().filter((e) => e.theme && e.theme.trim() !== ''),
  );

  readonly weekendTasks = computed(() =>
    this.tasks().filter((t) => t.section === 'WEEKEND_PREP'),
  );
  readonly ideaTasks = computed(() => this.tasks().filter((t) => t.section === 'IDEAS'));

  /** Weekend prep = live view of the upcoming themed calendar rows (next ~9 days).
   *  Their checkbox is the entry's `prepared` flag — shared with the table. */
  readonly prepEntries = computed(() => {
    const windowEnd = this.todayMs + 9 * DAY_MS;
    return this.videos().filter((e) => {
      const ms = Date.parse(e.date);
      return ms >= this.todayMs && ms <= windowEnd;
    });
  });

  /** Current-week tracker: Mon–Sun window; if today's week has no publishes,
   *  roll forward to the next week that does. */
  readonly currentWeek = computed<WeekView>(() => {
    const themed = this.videos();
    const weekHas = (anchorMs: number) => {
      const start = this.mondayOf(anchorMs);
      return themed.some((e) => {
        const ms = Date.parse(e.date);
        return ms >= start && ms <= start + 6 * DAY_MS;
      });
    };

    let anchorMs = this.todayMs;
    if (!weekHas(anchorMs)) {
      const upcoming = themed.find((e) => Date.parse(e.date) >= this.todayMs);
      const fallback = themed.length ? Date.parse(themed[themed.length - 1].date) : this.todayMs;
      anchorMs = upcoming ? Date.parse(upcoming.date) : fallback;
    }

    const startMs = this.mondayOf(anchorMs);
    const endMs = startMs + 6 * DAY_MS;
    const entries = themed.filter((e) => {
      const ms = Date.parse(e.date);
      return ms >= startMs && ms <= endMs;
    });
    return { startMs, endMs, entries };
  });

  ngOnInit() {
    this.planner.load();
  }

  // ---- display helpers -----------------------------------------------------

  weekday(iso: string): string {
    return IT_WEEKDAYS[new Date(iso).getUTCDay()];
  }

  ddmm(iso: string): string {
    const d = new Date(iso);
    return `${String(d.getUTCDate()).padStart(2, '0')}/${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
  }

  ddmmFromMs(ms: number): string {
    return this.ddmm(new Date(ms).toISOString());
  }

  isToday(iso: string): boolean {
    return Date.parse(iso) === this.todayMs;
  }

  isWeekend(iso: string): boolean {
    const d = new Date(iso).getUTCDay();
    return d === 0 || d === 6;
  }

  // ---- handlers ------------------------------------------------------------

  onThemeChange(entry: PlannerEntry, value: string) {
    if ((entry.theme ?? '') === value) return;
    this.planner.setEntryTheme(entry.id, value);
  }

  togglePublished(entry: PlannerEntry) {
    this.planner.toggleEntryPublished(entry.id);
  }

  togglePrepared(entry: PlannerEntry) {
    this.planner.toggleEntryPrepared(entry.id);
  }

  async addRow() {
    const date = this.newDate();
    if (!date) return;
    await this.planner.addEntry(date, this.newTheme().trim());
    this.newDate.set('');
    this.newTheme.set('');
  }

  deleteEntry(entry: PlannerEntry) {
    this.planner.deleteEntry(entry.id);
  }

  toggleTask(task: PlannerTask) {
    this.planner.toggleTask(task.id);
  }

  onTaskLabelChange(task: PlannerTask, value: string) {
    if (task.label === value || value.trim() === '') return;
    this.planner.setTaskLabel(task.id, value.trim());
  }

  deleteTask(task: PlannerTask) {
    this.planner.deleteTask(task.id);
  }

  async addPrep() {
    const label = this.newPrep().trim();
    if (!label) return;
    await this.planner.addTask('WEEKEND_PREP', label);
    this.newPrep.set('');
  }

  async addIdea() {
    const label = this.newIdea().trim();
    if (!label) return;
    await this.planner.addTask('IDEAS', label);
    this.newIdea.set('');
  }

  // ---- date math -----------------------------------------------------------

  private startOfTodayUtc(): number {
    const now = new Date();
    return Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  }

  private mondayOf(ms: number): number {
    const day = new Date(ms).getUTCDay(); // 0 Sun … 6 Sat
    const offset = (day + 6) % 7; // days since Monday
    return ms - offset * DAY_MS;
  }
}
