import type { Workout, WorkoutSet } from './types';

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

/** Расчётный 1ПМ по формуле Эпли */
export function e1rm(w: number, r: number): number {
  if (!w || !r) return 0;
  if (r === 1) return w;
  return w * (1 + r / 30);
}

export const workSets = (sets: WorkoutSet[]) => sets.filter((s) => s.done && !s.warmup);

export function workoutVolume(w: Workout): number {
  let v = 0;
  for (const e of w.exercises) for (const s of workSets(e.sets)) v += s.w * s.r;
  return v;
}

export function workoutSetCount(w: Workout): number {
  return w.exercises.reduce((a, e) => a + workSets(e.sets).length, 0);
}

export function fmtNum(n: number, digits = 0): string {
  return n.toLocaleString('ru-RU', { maximumFractionDigits: digits });
}

export function fmtWeight(n: number): string {
  return fmtNum(Math.round(n * 10) / 10, 1);
}

export function fmtTonnage(kg: number): string {
  return kg >= 10000 ? `${fmtNum(kg / 1000, 1)} т` : `${fmtNum(kg)} кг`;
}

export function fmtDuration(ms: number): string {
  const min = Math.round(ms / 60000);
  if (min < 60) return `${min} мин`;
  return `${Math.floor(min / 60)} ч ${min % 60} мин`;
}

export function fmtClock(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

export function fmtDate(ts: number, opts: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long' }): string {
  return new Date(ts).toLocaleDateString('ru-RU', opts);
}

export function fmtDateFull(ts: number): string {
  const d = new Date(ts);
  const today = new Date();
  const y = new Date();
  y.setDate(today.getDate() - 1);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  const time = d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });
  if (same(d, today)) return `Сегодня, ${time}`;
  if (same(d, y)) return `Вчера, ${time}`;
  return `${d.toLocaleDateString('ru-RU', { weekday: 'short', day: 'numeric', month: 'long' })}, ${time}`;
}

/** Начало недели (понедельник) */
export function weekStart(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d.getTime();
}

export function plural(n: number, forms: [string, string, string]): string {
  const a = Math.abs(n) % 100;
  const b = a % 10;
  if (a > 10 && a < 20) return forms[2];
  if (b > 1 && b < 5) return forms[1];
  if (b === 1) return forms[0];
  return forms[2];
}

export function parseRestInput(v: string): number {
  const n = parseInt(v, 10);
  return isNaN(n) ? 0 : n;
}

/** Нижняя граница целевых повторов из строки программы ("8-12" → 8) */
export function targetReps(reps: string): number {
  const m = reps.match(/\d+/);
  return m ? parseInt(m[0], 10) : 0;
}
