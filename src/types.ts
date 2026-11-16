export type Muscle =
  | 'abdominals' | 'abductors' | 'adductors' | 'biceps' | 'calves' | 'chest' | 'forearms'
  | 'glutes' | 'hamstrings' | 'lats' | 'lower back' | 'middle back' | 'neck' | 'quadriceps'
  | 'shoulders' | 'traps' | 'triceps';

export interface Exercise {
  id: string;
  name: string;
  en: string;
  pm: Muscle[];
  sm: Muscle[];
  eq: string;
  lv: 'beginner' | 'intermediate' | 'expert';
  cat: string;
  mech: string | null;
  steps: string[];
  lang: 'ru' | 'en';
  tip: string | null;
  img: number;
  pop: number;
  custom?: boolean;
}

export interface WorkoutSet {
  w: number; // вес, кг
  r: number; // повторения
  done: boolean;
  warmup?: boolean;
  rpe?: number;
}

export interface WorkoutExercise {
  uid: string;
  exId: string;
  sets: WorkoutSet[];
  rest?: number; // сек, переопределение таймера
  note?: string;
  target?: string; // целевые повторы из программы, напр. "8-12"
}

export interface Workout {
  id: string;
  name: string;
  start: number;
  end?: number;
  programId?: string;
  dayIdx?: number;
  exercises: WorkoutExercise[];
  note?: string;
}

export interface ProgramItem {
  exId: string;
  sets: number;
  reps: string; // "8-12", "5", "30с"
  rest?: number;
}

export interface ProgramDay {
  name: string;
  items: ProgramItem[];
}

export interface Program {
  id: string;
  name: string;
  desc: string;
  level: 'beginner' | 'intermediate' | 'expert';
  perWeek: number;
  goal: string;
  days: ProgramDay[];
  builtin?: boolean;
}

export interface Settings {
  defaultRest: number;
  autoRest: boolean;
  sound: boolean;
  vibrate: boolean;
  weightStep: number;
}

export interface AppData {
  v: 1;
  ts: number; // время последнего изменения
  workouts: Workout[];
  programs: Program[]; // пользовательские
  customExercises: Exercise[];
  settings: Settings;
  active: Workout | null;
  restOverrides: Record<string, number>; // exId -> сек
}
