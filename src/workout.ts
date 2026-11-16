import type { Program, Workout, WorkoutExercise, WorkoutSet } from './types';
import { getData, setData } from './store';
import { uid, targetReps } from './utils';
import { startRest } from './timer';
import { exName } from './data/exercises';
import { BUILTIN_PROGRAMS } from './data/programs';

export function allPrograms(): Program[] {
  return [...getData().programs, ...BUILTIN_PROGRAMS];
}

export function findProgram(id: string | undefined): Program | undefined {
  return id ? allPrograms().find((p) => p.id === id) : undefined;
}

/** Подходы упражнения из последней завершённой тренировки */
export function lastSets(exId: string, excludeId?: string): WorkoutSet[] | null {
  const ws = getData().workouts;
  for (const w of ws) {
    if (w.id === excludeId) continue;
    const e = w.exercises.find((x) => x.exId === exId);
    if (e) {
      const done = e.sets.filter((s) => s.done);
      if (done.length) return done;
    }
  }
  return null;
}

function newExercise(exId: string, nSets = 3, target?: string, rest?: number): WorkoutExercise {
  const prev = lastSets(exId);
  const t = target ? targetReps(target) : 0;
  const sets: WorkoutSet[] = Array.from({ length: nSets }, (_, i) => {
    const p = prev?.filter((s) => !s.warmup)[i] ?? prev?.[prev.length - 1];
    return { w: p?.w ?? 0, r: t || p?.r || 10, done: false };
  });
  return { uid: uid(), exId, sets, target, rest };
}

export function startWorkout(opts: { programId?: string; dayIdx?: number } = {}) {
  const prog = findProgram(opts.programId);
  const day = prog && opts.dayIdx != null ? prog.days[opts.dayIdx] : undefined;
  const w: Workout = {
    id: uid(),
    name: day ? `${prog!.name}: ${day.name}` : 'Тренировка',
    start: Date.now(),
    programId: prog?.id,
    dayIdx: opts.dayIdx,
    exercises: day ? day.items.map((it) => newExercise(it.exId, it.sets, it.reps, it.rest)) : [],
  };
  setData({ active: w });
}

/** Следующий день программы по истории */
export function nextDayIdx(p: Program): number {
  const last = getData().workouts.find((w) => w.programId === p.id);
  if (!last || last.dayIdx == null) return 0;
  return (last.dayIdx + 1) % p.days.length;
}

function updateActive(fn: (w: Workout) => Workout) {
  const a = getData().active;
  if (a) setData({ active: fn(a) });
}

export function updateWorkout(id: string, fn: (w: Workout) => Workout) {
  const d = getData();
  if (d.active?.id === id) return updateActive(fn);
  setData({ workouts: d.workouts.map((w) => (w.id === id ? fn(w) : w)).sort((a, b) => b.start - a.start) });
}

export function addExercises(workoutId: string, exIds: string[]) {
  updateWorkout(workoutId, (w) => ({ ...w, exercises: [...w.exercises, ...exIds.map((id) => newExercise(id))] }));
}

export function updateExercise(workoutId: string, exUid: string, fn: (e: WorkoutExercise) => WorkoutExercise) {
  updateWorkout(workoutId, (w) => ({ ...w, exercises: w.exercises.map((e) => (e.uid === exUid ? fn(e) : e)) }));
}

export function removeExercise(workoutId: string, exUid: string) {
  updateWorkout(workoutId, (w) => ({ ...w, exercises: w.exercises.filter((e) => e.uid !== exUid) }));
}

export function moveExercise(workoutId: string, exUid: string, dir: -1 | 1) {
  updateWorkout(workoutId, (w) => {
    const arr = [...w.exercises];
    const i = arr.findIndex((e) => e.uid === exUid);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= arr.length) return w;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...w, exercises: arr };
  });
}

export function updateSet(workoutId: string, exUid: string, idx: number, patch: Partial<WorkoutSet>) {
  updateExercise(workoutId, exUid, (e) => ({ ...e, sets: e.sets.map((s, i) => (i === idx ? { ...s, ...patch } : s)) }));
}

export function addSet(workoutId: string, exUid: string) {
  updateExercise(workoutId, exUid, (e) => {
    const last = e.sets[e.sets.length - 1];
    return { ...e, sets: [...e.sets, { w: last?.w ?? 0, r: last?.r ?? 10, done: false }] };
  });
}

export function removeSet(workoutId: string, exUid: string, idx: number) {
  updateExercise(workoutId, exUid, (e) => ({ ...e, sets: e.sets.filter((_, i) => i !== idx) }));
}

export function restFor(e: WorkoutExercise): number {
  const d = getData();
  return e.rest ?? d.restOverrides[e.exId] ?? d.settings.defaultRest;
}

/** Отметить подход выполненным; в активной тренировке запускает таймер отдыха */
export function toggleSetDone(workoutId: string, e: WorkoutExercise, idx: number) {
  const done = !e.sets[idx].done;
  updateSet(workoutId, e.uid, idx, { done });
  const d = getData();
  if (done && d.active?.id === workoutId && d.settings.autoRest) {
    startRest(restFor(e), exName(e.exId));
  }
}

export function finishWorkout() {
  const a = getData().active;
  if (!a) return null;
  // убираем невыполненные подходы и пустые упражнения
  const exercises = a.exercises
    .map((e) => ({ ...e, sets: e.sets.filter((s) => s.done) }))
    .filter((e) => e.sets.length > 0);
  const w: Workout = { ...a, exercises, end: Date.now() };
  setData((d) => ({ active: null, workouts: exercises.length ? [w, ...d.workouts] : d.workouts }));
  return exercises.length ? w : null;
}

export function discardWorkout() {
  setData({ active: null });
}

export function deleteWorkout(id: string) {
  setData((d) => ({ workouts: d.workouts.filter((w) => w.id !== id) }));
}

export function saveProgram(p: Program) {
  setData((d) => {
    const exists = d.programs.some((x) => x.id === p.id);
    return { programs: exists ? d.programs.map((x) => (x.id === p.id ? p : x)) : [p, ...d.programs] };
  });
}

export function deleteProgram(id: string) {
  setData((d) => ({ programs: d.programs.filter((p) => p.id !== id) }));
}
