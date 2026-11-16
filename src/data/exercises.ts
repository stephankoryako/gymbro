import type { Exercise, Muscle } from '../types';
import { getData } from '../store';

let builtin: Exercise[] = [];
let byId = new Map<string, Exercise>();

export async function loadExercises() {
  const res = await fetch('./data/exercises.json');
  builtin = await res.json();
  byId = new Map(builtin.map((e) => [e.id, e]));
}

export function allExercises(): Exercise[] {
  const custom = getData().customExercises;
  return custom.length ? [...custom, ...builtin] : builtin;
}

export function getExercise(id: string): Exercise | undefined {
  return byId.get(id) ?? getData().customExercises.find((e) => e.id === id);
}

export function exName(id: string): string {
  return getExercise(id)?.name ?? 'Удалённое упражнение';
}

export function imageUrl(ex: Exercise, i = 0): string | null {
  if (ex.custom || ex.img <= i) return null;
  return `./img/${encodeURIComponent(ex.id)}/${i}.jpg`;
}

export function videoUrl(ex: Exercise): string {
  const q = ex.lang === 'ru' || ex.custom ? `${ex.name} техника выполнения` : `${ex.en} exercise technique`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}

// ── Справочники ──
export const MUSCLES: Record<Muscle, string> = {
  chest: 'Грудь',
  lats: 'Широчайшие',
  'middle back': 'Середина спины',
  'lower back': 'Поясница',
  traps: 'Трапеции',
  shoulders: 'Плечи',
  biceps: 'Бицепс',
  triceps: 'Трицепс',
  forearms: 'Предплечья',
  abdominals: 'Пресс',
  quadriceps: 'Квадрицепс',
  hamstrings: 'Бицепс бедра',
  glutes: 'Ягодицы',
  calves: 'Икры',
  adductors: 'Приводящие',
  abductors: 'Отводящие',
  neck: 'Шея',
};

/** Укрупнённые группы для фильтров и статистики */
export const GROUPS: { key: string; label: string; icon: string; muscles: Muscle[] }[] = [
  { key: 'chest', label: 'Грудь', icon: '🫁', muscles: ['chest'] },
  { key: 'back', label: 'Спина', icon: '🔙', muscles: ['lats', 'middle back', 'lower back', 'traps'] },
  { key: 'shoulders', label: 'Плечи', icon: '🏔', muscles: ['shoulders'] },
  { key: 'arms', label: 'Руки', icon: '💪', muscles: ['biceps', 'triceps', 'forearms'] },
  { key: 'legs', label: 'Ноги', icon: '🦵', muscles: ['quadriceps', 'hamstrings', 'glutes', 'calves', 'adductors', 'abductors'] },
  { key: 'core', label: 'Пресс', icon: '🎯', muscles: ['abdominals'] },
  { key: 'neck', label: 'Шея', icon: '🦒', muscles: ['neck'] },
];

export function groupOf(m: Muscle): string {
  return GROUPS.find((g) => g.muscles.includes(m))?.key ?? 'other';
}

export const EQUIPMENT: Record<string, string> = {
  barbell: 'Штанга',
  dumbbell: 'Гантели',
  'body only': 'Свой вес',
  cable: 'Блок / кроссовер',
  machine: 'Тренажёр',
  kettlebells: 'Гири',
  bands: 'Резинки',
  'e-z curl bar': 'EZ-гриф',
  'medicine ball': 'Медбол',
  'exercise ball': 'Фитбол',
  'foam roll': 'Ролл',
  other: 'Другое',
};

export const LEVELS: Record<string, string> = {
  beginner: 'Новичок',
  intermediate: 'Средний',
  expert: 'Продвинутый',
};

export const CATEGORIES: Record<string, string> = {
  strength: 'Силовые',
  stretching: 'Растяжка',
  plyometrics: 'Плиометрика',
  powerlifting: 'Пауэрлифтинг',
  'olympic weightlifting': 'Тяжёлая атлетика',
  strongman: 'Стронгмен',
  cardio: 'Кардио',
};

export const MECHANIC: Record<string, string> = {
  compound: 'Базовое',
  isolation: 'Изолирующее',
};
