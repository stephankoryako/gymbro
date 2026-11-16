// Собирает public/data/exercises.json из free-exercise-db + русские переводы.
// Использование: node scripts/build-exercises.mjs <путь к клону free-exercise-db>
import fs from 'node:fs';
import path from 'node:path';
import { RU } from './ru-exercises.mjs';

const src = process.argv[2];
if (!src) {
  console.error('Укажите путь к free-exercise-db');
  process.exit(1);
}
const raw = JSON.parse(fs.readFileSync(path.join(src, 'dist/exercises.json'), 'utf8'));
const ids = new Set(raw.map((x) => x.id));
const missing = Object.keys(RU).filter((id) => !ids.has(id));
if (missing.length) {
  console.error('Нет таких ID в базе:', missing);
  process.exit(1);
}

const out = raw.map((x) => {
  const ru = RU[x.id];
  const steps = ru?.[1] ? ru[1].split('|') : null;
  return {
    id: x.id,
    name: ru ? ru[0] : x.name,
    en: x.name,
    pm: x.primaryMuscles,
    sm: x.secondaryMuscles,
    eq: x.equipment ?? 'other',
    lv: x.level,
    cat: x.category,
    mech: x.mechanic ?? null,
    steps: steps ?? x.instructions,
    lang: steps ? 'ru' : 'en',
    tip: ru?.[2] ?? null,
    img: x.images.length,
    pop: ru ? 1 : 0,
  };
});
out.sort((a, b) => b.pop - a.pop || a.name.localeCompare(b.name, 'ru'));

fs.mkdirSync('public/data', { recursive: true });
fs.writeFileSync('public/data/exercises.json', JSON.stringify(out));
console.log(`OK: ${out.length} упражнений, переведено ${Object.keys(RU).length}`);
