#!/usr/bin/env node
/**
 * Seed the content planner (weekly publishing plan) with EXAMPLE data — 06/07 → 01/09 2026.
 * Idempotent: wipes planner tables then reinserts. Calendar covers every day
 * (empty days included so the table shows the full grid + weekday).
 *
 * The themes below are placeholders. Keep your real plan in a gitignored
 * `seed-planner.local.mjs` (same shape) so it never lands in the repo.
 *
 *   DATABASE_URL=postgresql://... node api/scripts/seed-planner.mjs
 */
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// date (MM-DD, year 2026) → theme (EXAMPLE). Days not listed are empty (no post).
// Pattern: a recurring series on Mondays, a comparison on Wednesdays, a feature
// on Fridays, a reaction on Sundays.
const THEMES = {
  '07-06': 'Weekly explainer',
  '07-08': 'Topic A vs Topic B',
  '07-10': 'Feature Friday',
  '07-12': 'Sunday reaction',
  '07-13': 'Weekly explainer',
  '07-15': 'Topic C vs Topic D',
  '07-17': 'Feature Friday',
  '07-19': 'Sunday reaction',
  '07-20': 'Weekly explainer',
  '07-22': 'Topic E vs Topic F',
  '07-24': 'Feature Friday',
  '07-26': 'Product update',
  '07-27': 'Weekly explainer',
  '07-29': 'Topic G vs Topic H',
  '07-31': 'Feature Friday',
  '08-02': 'TODO',
  '08-03': 'Weekly explainer',
  '08-05': 'Deep dive',
  '08-07': 'Feature Friday',
  '08-10': 'Weekly explainer',
  '08-12': 'Deep dive',
  '08-14': 'Feature Friday',
  '08-16': 'Side project',
  '08-17': 'Weekly explainer',
  '08-19': 'Deep dive',
  '08-21': 'Feature Friday',
  '08-23': 'TODO',
  '08-24': 'Weekly explainer',
  '08-26': 'Deep dive',
  '08-28': 'Side project',
  '08-30': 'TODO',
  '08-31': 'Weekly explainer',
};

// Dates already prepared (maps to entry.prepared).
const PREPARED = new Set(['07-06']);

// Generic prep notes NOT tied to a calendar date.
const WEEKEND_PREP = [{ label: 'Prepare assets', done: false }];

function* dateRange(start, end) {
  const d = new Date(start.getTime());
  while (d.getTime() <= end.getTime()) {
    yield new Date(d.getTime());
    d.setUTCDate(d.getUTCDate() + 1);
  }
}

async function main() {
  await prisma.plannerEntry.deleteMany();
  await prisma.plannerTask.deleteMany();

  const start = new Date(Date.UTC(2026, 6, 6)); // 06/07/2026
  const end = new Date(Date.UTC(2026, 8, 1)); // 01/09/2026

  const entries = [];
  for (const date of dateRange(start, end)) {
    const key = `${String(date.getUTCMonth() + 1).padStart(2, '0')}-${String(date.getUTCDate()).padStart(2, '0')}`;
    entries.push({ date, theme: THEMES[key] ?? null, prepared: PREPARED.has(key), published: false });
  }
  await prisma.plannerEntry.createMany({ data: entries });

  await prisma.plannerTask.createMany({
    data: WEEKEND_PREP.map((t, i) => ({ section: 'WEEKEND_PREP', label: t.label, done: t.done, order: i })),
  });

  const themed = entries.filter((e) => e.theme).length;
  console.log(`Seeded ${entries.length} calendar days (${themed} with a theme) + ${WEEKEND_PREP.length} weekend-prep tasks.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
