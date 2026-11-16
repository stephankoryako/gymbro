import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import type { Program, ProgramDay } from '../types';
import { useData } from '../store';
import { allPrograms, deleteProgram, findProgram, nextDayIdx, saveProgram, startWorkout } from '../workout';
import { exName, getExercise, LEVELS } from '../data/exercises';
import { BackLink, ExThumb, Sheet, Stepper, useBack } from '../components/common';
import { ExercisePicker } from '../components/ExerciseBrowser';
import { fmtClock, uid } from '../utils';
import { tg } from '../tg';

export function Programs() {
  useData((d) => d.programs);
  const nav = useNavigate();
  const programs = allPrograms();
  const mine = programs.filter((p) => !p.builtin);
  const builtin = programs.filter((p) => p.builtin);

  const card = (p: Program) => (
    <Link key={p.id} to={`/program/${p.id}`} className="card" style={{ display: 'block', color: 'inherit' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        <h3>{p.name}</h3>
        <span className="chev">›</span>
      </div>
      <div style={{ margin: '6px 0' }}>
        <span className="tag accent">{p.perWeek}×/нед</span>
        <span className="tag">{LEVELS[p.level]}</span>
        <span className="tag">🎯 {p.goal}</span>
      </div>
      <div className="hint" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        {p.desc || p.days.map((d) => d.name).join(' · ')}
      </div>
    </Link>
  );

  return (
    <div className="page">
      <div className="page-title">
        <span>Программы</span>
        <button className="btn secondary small" onClick={() => nav('/program-edit/new')}>
          + Создать
        </button>
      </div>
      {mine.length > 0 && (
        <>
          <h2>Мои программы</h2>
          {mine.map(card)}
        </>
      )}
      <h2>Готовые программы</h2>
      {builtin.map(card)}
    </div>
  );
}

export function ProgramDetail() {
  useBack();
  const nav = useNavigate();
  const { id } = useParams();
  useData((d) => d.programs);
  const hasActive = useData((d) => !!d.active);
  const p = findProgram(id);
  if (!p) return <div className="page">Программа не найдена</div>;
  const next = nextDayIdx(p);

  const start = async (i: number) => {
    if (hasActive && !(await tg.confirm('Уже идёт тренировка. Заменить её новой? Текущая будет удалена.'))) return;
    startWorkout({ programId: p.id, dayIdx: i });
    tg.haptic('success');
    nav('/workout');
  };

  return (
    <div className="page">
      <BackLink />
      <h1 style={{ fontSize: 24, margin: '4px 0 6px' }}>{p.name}</h1>
      <div style={{ marginBottom: 8 }}>
        <span className="tag accent">{p.perWeek}×/нед</span>
        <span className="tag">{LEVELS[p.level]}</span>
        <span className="tag">🎯 {p.goal}</span>
      </div>
      {p.desc && <p style={{ marginTop: 0 }}>{p.desc}</p>}
      <div className="btn-row" style={{ marginBottom: 6 }}>
        <button
          className="btn secondary"
          onClick={() => {
            const copy: Program = { ...structuredClone(p), id: uid(), builtin: false, name: p.builtin ? `${p.name} (моя)` : `${p.name} (копия)` };
            saveProgram(copy);
            nav(`/program-edit/${copy.id}`);
          }}
        >
          📄 Копировать
        </button>
        {!p.builtin && (
          <button className="btn secondary" onClick={() => nav(`/program-edit/${p.id}`)}>
            ✏️ Изменить
          </button>
        )}
      </div>
      {p.days.map((d, i) => (
        <div key={i}>
          <h2 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>
              {d.name}
              {i === next && ' · следующая'}
            </span>
          </h2>
          <div className="list">
            {d.items.map((it, j) => (
              <Link key={j} to={`/exercise/${encodeURIComponent(it.exId)}`} className="row" style={{ color: 'inherit' }}>
                <ExThumb ex={getExercise(it.exId)} size={44} />
                <div className="row-main">
                  <div className="row-title">{exName(it.exId)}</div>
                  <div className="row-sub">
                    {it.sets} × {it.reps}
                    {it.rest ? ` · отдых ${fmtClock(it.rest)}` : ''}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <button className={`btn block ${i === next ? '' : 'secondary'}`} style={{ marginBottom: 6 }} onClick={() => start(i)}>
            ▶ Начать «{d.name}»
          </button>
        </div>
      ))}
      {!p.builtin && (
        <button
          className="btn danger block"
          style={{ marginTop: 16 }}
          onClick={async () => {
            if (await tg.confirm('Удалить программу?')) {
              deleteProgram(p.id);
              nav('/programs', { replace: true });
            }
          }}
        >
          Удалить программу
        </button>
      )}
    </div>
  );
}

export function ProgramEditor() {
  useBack();
  const nav = useNavigate();
  const { id } = useParams();
  const existing = id !== 'new' ? findProgram(id) : undefined;
  const [p, setP] = useState<Program>(
    () =>
      (existing && structuredClone(existing)) ?? {
        id: uid(),
        name: '',
        desc: '',
        goal: 'Мышечная масса',
        level: 'intermediate',
        perWeek: 3,
        days: [{ name: 'День 1', items: [] }],
      },
  );
  const [pickFor, setPickFor] = useState<number | null>(null);
  const [editItem, setEditItem] = useState<{ d: number; i: number } | null>(null);

  const setDay = (di: number, fn: (d: ProgramDay) => ProgramDay) => setP((x) => ({ ...x, days: x.days.map((d, i) => (i === di ? fn(d) : d)) }));
  const item = editItem ? p.days[editItem.d]?.items[editItem.i] : null;

  return (
    <div className="page">
      <BackLink />
      <div className="page-title">{existing ? 'Редактор программы' : 'Новая программа'}</div>
      <label className="field">
        <span>Название</span>
        <input className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} placeholder="Моя программа" />
      </label>
      <label className="field">
        <span>Описание</span>
        <textarea className="input" value={p.desc} onChange={(e) => setP({ ...p, desc: e.target.value })} />
      </label>
      <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Тренировок в неделю</span>
        <Stepper value={p.perWeek} min={1} onChange={(v) => setP({ ...p, perWeek: Math.min(7, v) })} />
      </div>

      {p.days.map((d, di) => (
        <div key={di} className="card">
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input className="input" value={d.name} onChange={(e) => setDay(di, (x) => ({ ...x, name: e.target.value }))} />
            {p.days.length > 1 && (
              <button className="icon-btn" onClick={() => setP({ ...p, days: p.days.filter((_, i) => i !== di) })} aria-label="Удалить день">
                🗑
              </button>
            )}
          </div>
          {d.items.map((it, ii) => (
            <div key={ii} className="row" style={{ padding: '6px 0' }}>
              <ExThumb ex={getExercise(it.exId)} size={40} />
              <button className="row-main" style={{ textAlign: 'left' }} onClick={() => setEditItem({ d: di, i: ii })}>
                <div className="row-title">{exName(it.exId)}</div>
                <div className="row-sub">
                  {it.sets} × {it.reps}
                  {it.rest ? ` · ${fmtClock(it.rest)}` : ''} · изменить
                </div>
              </button>
              <button
                className="icon-btn"
                disabled={ii === 0}
                onClick={() =>
                  setDay(di, (x) => {
                    const items = [...x.items];
                    [items[ii - 1], items[ii]] = [items[ii], items[ii - 1]];
                    return { ...x, items };
                  })
                }
              >
                ↑
              </button>
              <button className="icon-btn" onClick={() => setDay(di, (x) => ({ ...x, items: x.items.filter((_, k) => k !== ii) }))}>
                ✕
              </button>
            </div>
          ))}
          <button className="btn secondary small block" style={{ marginTop: 6 }} onClick={() => setPickFor(di)}>
            + Упражнения
          </button>
        </div>
      ))}
      <button
        className="btn ghost block"
        onClick={() => setP({ ...p, days: [...p.days, { name: `День ${p.days.length + 1}`, items: [] }] })}
      >
        + Добавить день
      </button>
      <button
        className="btn block"
        style={{ marginTop: 12 }}
        disabled={!p.name.trim() || p.days.every((d) => !d.items.length)}
        onClick={() => {
          saveProgram({ ...p, builtin: false, name: p.name.trim() });
          tg.haptic('success');
          nav(`/program/${p.id}`, { replace: true });
        }}
      >
        Сохранить программу
      </button>

      {pickFor != null && (
        <ExercisePicker
          onClose={() => setPickFor(null)}
          onDone={(ids) => {
            setDay(pickFor, (x) => ({ ...x, items: [...x.items, ...ids.map((exId) => ({ exId, sets: 3, reps: '8-12', rest: 90 }))] }));
            setPickFor(null);
          }}
        />
      )}
      {editItem && item && (
        <Sheet title={exName(item.exId)} onClose={() => setEditItem(null)}>
          <div className="list">
            <div className="row">
              <span className="row-main">Подходы</span>
              <Stepper
                value={item.sets}
                min={1}
                onChange={(v) => setDay(editItem.d, (x) => ({ ...x, items: x.items.map((it, k) => (k === editItem.i ? { ...it, sets: v } : it)) }))}
              />
            </div>
            <div className="row">
              <span className="row-main">Повторения</span>
              <input
                className="input"
                style={{ width: 110, textAlign: 'center' }}
                value={item.reps}
                onChange={(e) => setDay(editItem.d, (x) => ({ ...x, items: x.items.map((it, k) => (k === editItem.i ? { ...it, reps: e.target.value } : it)) }))}
              />
            </div>
            <div className="row">
              <span className="row-main">Отдых</span>
              <Stepper
                value={item.rest ?? 90}
                step={15}
                min={15}
                fmt={fmtClock}
                onChange={(v) => setDay(editItem.d, (x) => ({ ...x, items: x.items.map((it, k) => (k === editItem.i ? { ...it, rest: v } : it)) }))}
              />
            </div>
          </div>
          <div className="hint">Повторения можно указать диапазоном (8-12), числом (5) или временем (30с).</div>
        </Sheet>
      )}
    </div>
  );
}
