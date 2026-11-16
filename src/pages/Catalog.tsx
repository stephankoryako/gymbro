import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Exercise, Muscle } from '../types';
import { ExerciseBrowser } from '../components/ExerciseBrowser';
import { BackLink, Sheet, useBack } from '../components/common';
import { CATEGORIES, EQUIPMENT, getExercise, imageUrl, LEVELS, MECHANIC, MUSCLES, videoUrl } from '../data/exercises';
import { getData, setData, useData } from '../store';
import { tg } from '../tg';
import { addExercises, startWorkout } from '../workout';
import { e1rm, fmtDate, fmtWeight, uid } from '../utils';

export function Catalog() {
  const nav = useNavigate();
  const [create, setCreate] = useState(false);
  return (
    <div className="page">
      <div className="page-title">
        <span>Каталог</span>
        <button className="btn secondary small" onClick={() => setCreate(true)}>
          + Своё
        </button>
      </div>
      <ExerciseBrowser onOpen={(e) => nav(`/exercise/${encodeURIComponent(e.id)}`)} />
      {create && <CustomExerciseForm onClose={() => setCreate(false)} />}
    </div>
  );
}

function AnimatedImages({ ex }: { ex: Exercise }) {
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(true);
  useEffect(() => {
    if (!playing || ex.img < 2) return;
    const id = setInterval(() => setFrame((f) => (f + 1) % ex.img), 1100);
    return () => clearInterval(id);
  }, [playing, ex.img]);
  const srcs = Array.from({ length: ex.img }, (_, i) => imageUrl(ex, i)).filter(Boolean) as string[];
  if (!srcs.length) return null;
  return (
    <div className="anim" onClick={() => setPlaying((p) => !p)}>
      {srcs.map((s, i) => (
        <img key={s} src={s} alt="" style={{ opacity: i === frame ? 1 : 0 }} />
      ))}
      {srcs.length > 1 && <span className="badge">{playing ? '❚❚ пауза' : '▶ анимация'}</span>}
    </div>
  );
}

export function ExerciseDetail() {
  useBack();
  const nav = useNavigate();
  const { id = '' } = useParams();
  const exId = decodeURIComponent(id);
  useData((d) => d.customExercises);
  const workouts = useData((d) => d.workouts);
  const active = useData((d) => d.active);
  const [edit, setEdit] = useState(false);
  const ex = getExercise(exId);
  if (!ex) return <div className="page">Упражнение не найдено</div>;

  // личная статистика
  let best = 0;
  let maxW = 0;
  let lastTs = 0;
  let sessions = 0;
  for (const w of workouts) {
    const items = w.exercises.filter((e) => e.exId === ex.id);
    if (!items.length) continue;
    sessions++;
    if (!lastTs) lastTs = w.start;
    for (const e of items)
      for (const s of e.sets)
        if (s.done && !s.warmup) {
          best = Math.max(best, e1rm(s.w, s.r));
          maxW = Math.max(maxW, s.w);
        }
  }

  return (
    <div className="page">
      <BackLink />
      <h1 style={{ fontSize: 22, margin: '4px 0 2px' }}>{ex.name}</h1>
      {ex.lang === 'ru' && <div className="hint" style={{ marginBottom: 10 }}>{ex.en}</div>}
      <AnimatedImages ex={ex} />
      <div className="btn-row" style={{ margin: '10px 0' }}>
        <button className="btn secondary" onClick={() => tg.openLink(videoUrl(ex))}>
          ▶ Видеоурок
        </button>
        <button
          className="btn"
          onClick={() => {
            if (!active) startWorkout();
            addExercises(getData().active!.id, [ex.id]);
            tg.haptic('success');
            nav('/workout');
          }}
        >
          + В тренировку
        </button>
      </div>

      <div className="card">
        <div style={{ marginBottom: 6 }}>
          {ex.pm.map((m) => (
            <span key={m} className="tag accent">
              {MUSCLES[m]}
            </span>
          ))}
          {ex.sm.map((m) => (
            <span key={m} className="tag">
              {MUSCLES[m]}
            </span>
          ))}
        </div>
        <span className="tag">🏋️ {EQUIPMENT[ex.eq] ?? ex.eq}</span>
        <span className="tag">📶 {LEVELS[ex.lv]}</span>
        {ex.mech && <span className="tag">{MECHANIC[ex.mech]}</span>}
        <span className="tag">{CATEGORIES[ex.cat] ?? ex.cat}</span>
      </div>

      {sessions > 0 && (
        <>
          <h2>Мои результаты</h2>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-val">{fmtWeight(maxW)} кг</div>
              <div className="stat-label">макс. вес</div>
            </div>
            <div className="stat">
              <div className="stat-val">{fmtWeight(best)} кг</div>
              <div className="stat-label">расчётный 1ПМ</div>
            </div>
          </div>
          <Link className="btn secondary block" to={`/stats/exercise/${encodeURIComponent(ex.id)}`}>
            📈 График прогресса · {sessions} трен. · посл. {fmtDate(lastTs)}
          </Link>
        </>
      )}

      {ex.steps.length > 0 && (
        <>
          <h2>Техника выполнения</h2>
          <div className="card">
            {ex.lang === 'en' && <div className="hint" style={{ marginBottom: 8 }}>🇬🇧 Описание на английском</div>}
            <ol className="steps">
              {ex.steps.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ol>
            {ex.tip && (
              <div style={{ marginTop: 8, padding: 10, borderRadius: 10, background: 'var(--soft)' }}>💡 {ex.tip}</div>
            )}
          </div>
        </>
      )}

      {ex.custom && (
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn secondary" onClick={() => setEdit(true)}>
            ✏️ Изменить
          </button>
          <button
            className="btn danger"
            onClick={async () => {
              if (await tg.confirm('Удалить своё упражнение? История тренировок сохранится.')) {
                setData((d) => ({ customExercises: d.customExercises.filter((x) => x.id !== ex.id) }));
                nav(-1);
              }
            }}
          >
            Удалить
          </button>
        </div>
      )}
      {edit && <CustomExerciseForm initial={ex} onClose={() => setEdit(false)} />}
    </div>
  );
}

function CustomExerciseForm({ initial, onClose }: { initial?: Exercise; onClose: () => void }) {
  const [name, setName] = useState(initial?.name ?? '');
  const [pm, setPm] = useState<Muscle[]>(initial?.pm ?? []);
  const [eq, setEq] = useState(initial?.eq ?? 'barbell');
  const [steps, setSteps] = useState(initial?.steps.join('\n') ?? '');
  const save = () => {
    const ex: Exercise = {
      id: initial?.id ?? 'custom_' + uid(),
      name: name.trim(),
      en: name.trim(),
      pm,
      sm: [],
      eq,
      lv: 'beginner',
      cat: 'strength',
      mech: null,
      steps: steps.split('\n').map((s) => s.trim()).filter(Boolean),
      lang: 'ru',
      tip: null,
      img: 0,
      pop: 1,
      custom: true,
    };
    setData((d) => ({
      customExercises: initial ? d.customExercises.map((x) => (x.id === ex.id ? ex : x)) : [ex, ...d.customExercises],
    }));
    tg.haptic('success');
    onClose();
  };
  return (
    <Sheet
      title={initial ? 'Изменить упражнение' : 'Новое упражнение'}
      onClose={onClose}
      footer={
        <button className="btn block" disabled={!name.trim() || !pm.length} onClick={save}>
          Сохранить
        </button>
      }
    >
      <label className="field">
        <span>Название</span>
        <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Например: Тяга в хаммере" />
      </label>
      <div className="field">
        <span>Основные мышцы</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {(Object.keys(MUSCLES) as Muscle[]).map((m) => (
            <button
              key={m}
              className={`chip ${pm.includes(m) ? 'on' : ''}`}
              onClick={() => setPm((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))}
            >
              {MUSCLES[m]}
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <span>Оборудование</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {Object.entries(EQUIPMENT).map(([k, v]) => (
            <button key={k} className={`chip ${eq === k ? 'on' : ''}`} onClick={() => setEq(k)}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <label className="field">
        <span>Техника (каждый шаг с новой строки)</span>
        <textarea className="input" value={steps} onChange={(e) => setSteps(e.target.value)} />
      </label>
    </Sheet>
  );
}
