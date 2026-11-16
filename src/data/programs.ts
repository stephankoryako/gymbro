import type { Program, ProgramItem } from '../types';

const i = (exId: string, sets: number, reps: string, rest?: number): ProgramItem => ({ exId, sets, reps, rest });

export const BUILTIN_PROGRAMS: Program[] = [
  {
    id: 'fb-beginner',
    builtin: true,
    name: 'Full Body для новичков',
    goal: 'Общая сила и техника',
    level: 'beginner',
    perWeek: 3,
    desc: 'Две тренировки на всё тело (A и B), чередуются через день: Пн A, Ср B, Пт A, на следующей неделе наоборот. Базовые движения, умеренный объём — идеально для первых 2–4 месяцев.',
    days: [
      {
        name: 'День A',
        items: [
          i('Barbell_Squat', 3, '8-10', 120),
          i('Barbell_Bench_Press_-_Medium_Grip', 3, '8-10', 120),
          i('Bent_Over_Barbell_Row', 3, '8-10', 90),
          i('Dumbbell_Shoulder_Press', 2, '10-12', 90),
          i('Barbell_Curl', 2, '10-12', 60),
          i('Plank', 3, '30-60с', 45),
        ],
      },
      {
        name: 'День B',
        items: [
          i('Barbell_Deadlift', 3, '5-6', 150),
          i('Incline_Dumbbell_Press', 3, '8-12', 90),
          i('Wide-Grip_Lat_Pulldown', 3, '10-12', 90),
          i('Leg_Press', 3, '10-12', 90),
          i('Triceps_Pushdown', 2, '12-15', 60),
          i('Hanging_Leg_Raise', 3, '10-15', 60),
        ],
      },
    ],
  },
  {
    id: 'fb-3day',
    builtin: true,
    name: 'Full Body A/B/C',
    goal: 'Мышечная масса',
    level: 'intermediate',
    perWeek: 3,
    desc: 'Три разных тренировки на всё тело в неделю. Каждый день — свой акцент: присед, жим, тяга. Подходит тем, кто тренируется 3 раза в неделю и хочет прогресса в массе и силе.',
    days: [
      {
        name: 'A — акцент присед',
        items: [
          i('Barbell_Squat', 4, '6-8', 150),
          i('Dumbbell_Bench_Press', 3, '8-12', 90),
          i('Seated_Cable_Rows', 3, '10-12', 90),
          i('Romanian_Deadlift', 3, '8-10', 120),
          i('Side_Lateral_Raise', 3, '12-15', 60),
          i('Cable_Crunch', 3, '12-15', 60),
        ],
      },
      {
        name: 'B — акцент жим',
        items: [
          i('Barbell_Bench_Press_-_Medium_Grip', 4, '6-8', 150),
          i('Pullups', 3, '6-10', 120),
          i('Split_Squat_with_Dumbbells', 3, '10', 90),
          i('Standing_Military_Press', 3, '8-10', 120),
          i('Hammer_Curls', 3, '10-12', 60),
          i('Triceps_Pushdown_-_Rope_Attachment', 3, '12-15', 60),
        ],
      },
      {
        name: 'C — акцент тяга',
        items: [
          i('Barbell_Deadlift', 3, '5', 180),
          i('Incline_Dumbbell_Press', 3, '8-12', 90),
          i('Bent_Over_Barbell_Row', 3, '8-10', 90),
          i('Leg_Press', 3, '12-15', 90),
          i('Face_Pull', 3, '15', 60),
          i('Hanging_Leg_Raise', 3, '10-15', 60),
        ],
      },
    ],
  },
  {
    id: 'stronglifts-5x5',
    builtin: true,
    name: 'Сила 5×5',
    goal: 'Сила',
    level: 'beginner',
    perWeek: 3,
    desc: 'Классическая линейная программа на силу: 3 базовых упражнения за тренировку, 5 подходов по 5 повторений. Каждую успешную тренировку добавляйте 2,5 кг (в становой — 5 кг). Дни A и B чередуются.',
    days: [
      {
        name: 'День A',
        items: [
          i('Barbell_Squat', 5, '5', 180),
          i('Barbell_Bench_Press_-_Medium_Grip', 5, '5', 180),
          i('Bent_Over_Barbell_Row', 5, '5', 180),
        ],
      },
      {
        name: 'День B',
        items: [
          i('Barbell_Squat', 5, '5', 180),
          i('Standing_Military_Press', 5, '5', 180),
          i('Barbell_Deadlift', 1, '5', 180),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    builtin: true,
    name: 'Верх / Низ',
    goal: 'Масса и сила',
    level: 'intermediate',
    perWeek: 4,
    desc: 'Четыре тренировки в неделю: два дня на верх тела и два на низ. Один день каждой пары — силовой (меньше повторов), второй — объёмный. Пример расписания: Пн Верх 1, Вт Низ 1, Чт Верх 2, Пт Низ 2.',
    days: [
      {
        name: 'Верх 1 (сила)',
        items: [
          i('Barbell_Bench_Press_-_Medium_Grip', 4, '5-6', 180),
          i('Bent_Over_Barbell_Row', 4, '6-8', 120),
          i('Standing_Military_Press', 3, '6-8', 120),
          i('Weighted_Pull_Ups', 3, '6-8', 120),
          i('Barbell_Curl', 2, '8-10', 60),
          i('Close-Grip_Barbell_Bench_Press', 2, '8-10', 90),
        ],
      },
      {
        name: 'Низ 1 (сила)',
        items: [
          i('Barbell_Squat', 4, '5-6', 180),
          i('Romanian_Deadlift', 3, '6-8', 150),
          i('Leg_Press', 3, '8-10', 120),
          i('Lying_Leg_Curls', 3, '10-12', 60),
          i('Standing_Calf_Raises', 4, '10-12', 60),
        ],
      },
      {
        name: 'Верх 2 (объём)',
        items: [
          i('Incline_Dumbbell_Press', 4, '8-12', 90),
          i('Wide-Grip_Lat_Pulldown', 4, '10-12', 90),
          i('Seated_Cable_Rows', 3, '10-12', 90),
          i('Cable_Crossover', 3, '12-15', 60),
          i('Side_Lateral_Raise', 4, '12-15', 60),
          i('Incline_Dumbbell_Curl', 3, '10-12', 60),
          i('Cable_Rope_Overhead_Triceps_Extension', 3, '10-12', 60),
        ],
      },
      {
        name: 'Низ 2 (объём)',
        items: [
          i('Barbell_Deadlift', 3, '5', 180),
          i('Front_Barbell_Squat', 3, '8-10', 150),
          i('Barbell_Walking_Lunge', 3, '10-12', 90),
          i('Leg_Extensions', 3, '12-15', 60),
          i('Seated_Leg_Curl', 3, '12-15', 60),
          i('Seated_Calf_Raise', 4, '15', 60),
          i('Hanging_Leg_Raise', 3, '12-15', 60),
        ],
      },
    ],
  },
  {
    id: 'ppl',
    builtin: true,
    name: 'Push / Pull / Legs',
    goal: 'Мышечная масса',
    level: 'intermediate',
    perWeek: 6,
    desc: 'Жимы / Тяги / Ноги. Можно делать 3 раза в неделю (каждый день по разу) или 6 раз (цикл дважды). Хороший объём на каждую группу мышц.',
    days: [
      {
        name: 'Push — жимы',
        items: [
          i('Barbell_Bench_Press_-_Medium_Grip', 4, '6-8', 150),
          i('Standing_Military_Press', 3, '8-10', 120),
          i('Incline_Dumbbell_Press', 3, '8-12', 90),
          i('Side_Lateral_Raise', 4, '12-15', 60),
          i('Dips_-_Triceps_Version', 3, '8-12', 90),
          i('Triceps_Pushdown_-_Rope_Attachment', 3, '12-15', 60),
        ],
      },
      {
        name: 'Pull — тяги',
        items: [
          i('Barbell_Deadlift', 3, '5', 180),
          i('Pullups', 4, '6-10', 120),
          i('Bent_Over_Barbell_Row', 3, '8-10', 90),
          i('Face_Pull', 3, '15', 60),
          i('Barbell_Curl', 3, '8-10', 60),
          i('Hammer_Curls', 3, '10-12', 60),
        ],
      },
      {
        name: 'Legs — ноги',
        items: [
          i('Barbell_Squat', 4, '6-8', 180),
          i('Romanian_Deadlift', 3, '8-10', 120),
          i('Leg_Press', 3, '10-12', 90),
          i('Lying_Leg_Curls', 3, '10-12', 60),
          i('Leg_Extensions', 3, '12-15', 60),
          i('Standing_Calf_Raises', 4, '12-15', 60),
        ],
      },
    ],
  },
  {
    id: 'bro-split',
    builtin: true,
    name: 'Сплит 5 дней',
    goal: 'Мышечная масса',
    level: 'expert',
    perWeek: 5,
    desc: 'Классический бодибилдерский сплит: каждый день — одна большая группа мышц. Большой объём и максимальное восстановление между тренировками одной группы.',
    days: [
      {
        name: 'Грудь',
        items: [
          i('Barbell_Bench_Press_-_Medium_Grip', 4, '6-10', 150),
          i('Incline_Dumbbell_Press', 4, '8-12', 90),
          i('Dips_-_Chest_Version', 3, '8-12', 90),
          i('Incline_Dumbbell_Flyes', 3, '10-12', 60),
          i('Cable_Crossover', 3, '12-15', 60),
        ],
      },
      {
        name: 'Спина',
        items: [
          i('Barbell_Deadlift', 4, '5-6', 180),
          i('Pullups', 4, '6-10', 120),
          i('T-Bar_Row_with_Handle', 3, '8-10', 90),
          i('Wide-Grip_Lat_Pulldown', 3, '10-12', 90),
          i('One-Arm_Dumbbell_Row', 3, '10-12', 60),
          i('Barbell_Shrug', 3, '12-15', 60),
        ],
      },
      {
        name: 'Ноги',
        items: [
          i('Barbell_Squat', 4, '6-10', 180),
          i('Leg_Press', 4, '10-12', 120),
          i('Romanian_Deadlift', 3, '8-10', 120),
          i('Leg_Extensions', 3, '12-15', 60),
          i('Lying_Leg_Curls', 3, '10-12', 60),
          i('Standing_Calf_Raises', 5, '12-15', 60),
        ],
      },
      {
        name: 'Плечи',
        items: [
          i('Standing_Military_Press', 4, '6-10', 120),
          i('Arnold_Dumbbell_Press', 3, '8-12', 90),
          i('Side_Lateral_Raise', 4, '12-15', 60),
          i('Reverse_Flyes', 3, '12-15', 60),
          i('Upright_Barbell_Row', 3, '10-12', 60),
          i('Face_Pull', 3, '15', 60),
        ],
      },
      {
        name: 'Руки и пресс',
        items: [
          i('Barbell_Curl', 4, '8-10', 60),
          i('Close-Grip_Barbell_Bench_Press', 4, '8-10', 90),
          i('Incline_Dumbbell_Curl', 3, '10-12', 60),
          i('EZ-Bar_Skullcrusher', 3, '10-12', 60),
          i('Hammer_Curls', 3, '10-12', 60),
          i('Triceps_Pushdown_-_Rope_Attachment', 3, '12-15', 60),
          i('Cable_Crunch', 3, '15', 45),
          i('Hanging_Leg_Raise', 3, '12-15', 45),
        ],
      },
    ],
  },
  {
    id: 'home-dumbbells',
    builtin: true,
    name: 'Дома с гантелями',
    goal: 'Общая форма',
    level: 'beginner',
    perWeek: 3,
    desc: 'Тренировка на всё тело, для которой нужны только пара гантелей и скамья (или стул). Подходит для дома и поездок.',
    days: [
      {
        name: 'Full Body A',
        items: [
          i('Goblet_Squat', 4, '10-15', 90),
          i('Dumbbell_Bench_Press', 3, '10-12', 90),
          i('One-Arm_Dumbbell_Row', 3, '10-12', 60),
          i('Dumbbell_Shoulder_Press', 3, '10-12', 60),
          i('Hammer_Curls', 2, '12', 45),
          i('Plank', 3, '45с', 45),
        ],
      },
      {
        name: 'Full Body B',
        items: [
          i('Dumbbell_Lunges', 3, '10-12', 90),
          i('Stiff-Legged_Dumbbell_Deadlift', 3, '10-12', 90),
          i('Pushups', 3, 'макс', 60),
          i('Bent_Over_Two-Dumbbell_Row', 3, '10-12', 60),
          i('Side_Lateral_Raise', 3, '12-15', 45),
          i('Bench_Dips', 3, '10-15', 45),
          i('Russian_Twist', 3, '20', 45),
        ],
      },
    ],
  },
  {
    id: 'glutes-legs',
    builtin: true,
    name: 'Ноги и ягодицы',
    goal: 'Акцент на низ',
    level: 'intermediate',
    perWeek: 2,
    desc: 'Два дня с акцентом на ягодицы и ноги. Можно совмещать с 1–2 тренировками на верх тела.',
    days: [
      {
        name: 'Ягодицы',
        items: [
          i('Barbell_Hip_Thrust', 4, '8-12', 120),
          i('Romanian_Deadlift', 3, '8-10', 120),
          i('Split_Squat_with_Dumbbells', 3, '10-12', 90),
          i('One-Legged_Cable_Kickback', 3, '12-15', 45),
          i('Thigh_Abductor', 3, '15-20', 45),
        ],
      },
      {
        name: 'Квадрицепс',
        items: [
          i('Barbell_Squat', 4, '6-10', 150),
          i('Leg_Press', 3, '10-12', 120),
          i('Dumbbell_Step_Ups', 3, '10-12', 90),
          i('Leg_Extensions', 3, '12-15', 60),
          i('Lying_Leg_Curls', 3, '12-15', 60),
          i('Standing_Calf_Raises', 4, '12-15', 45),
        ],
      },
    ],
  },
];
