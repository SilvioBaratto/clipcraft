export type PlannerSection = 'WEEKEND_PREP' | 'IDEAS';

export interface PlannerEntry {
  id: string;
  date: string; // ISO (UTC midnight)
  theme: string | null;
  prepared: boolean;
  published: boolean;
}

export interface PlannerTask {
  id: string;
  section: PlannerSection;
  label: string;
  done: boolean;
  order: number;
}

export interface PlannerData {
  entries: PlannerEntry[];
  tasks: PlannerTask[];
}
