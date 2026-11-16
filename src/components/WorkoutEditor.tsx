import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Workout, WorkoutExercise } from '../types';
import { getExercise, MUSCLES } from '../data/exercises';
import { ExThumb, Sheet, Stepper } from './common';
import { ExercisePicker } from './ExerciseBrowser';
import {
  addExercises,
  addSet,
  lastSets,
  moveExercise,
  removeExercise,
  removeSet,
  restFor,
  toggleSetDone,
  updateExercise,
  updateSet,
} from '../workout';
import { getData, setData, useData } from '../store';
import { e1rm, fmtClock, fmtWeight } from '../utils';
import { tg } from '../tg';

export function WorkoutEditor({ workout }: { workout: Workout }) {
  const [picker, setPicker] = useState(false);
  return (
    <div>
      {workout.exercises.map((e, i) => (
        <ExerciseCard key={e.uid} w={workout} e={e} first={i === 0} last={i === workout.exercises.length - 1} />
      ))}
      <button className="btn secondary block" onClick={() => setPicker(true)}>
        + Добавить упражнение
      </button>
      {picker && (
        <ExercisePicker
          onClose={() => setPicker(false)}
          onDone={(ids) => {
            addExercises(workout.id, ids);
            setPicker(false);
            tg.haptic('success');
          }}
        />
      )}
    </div>
  );
}

function bestE1rm(exId: string, excludeId: string): number {
  let best = 0;
  for (const w of getData().workouts) {
    if (w.id === excludeId) continue;
    for (const e of w.exercises) {
      if (e.exId !== exId) continue;
      for (const s of e.sets) if (s.done && !s.warmup) best = Math.max(best, e1rm(s.w, s.r));
    }
  }
  return best;
}

function ExerciseCard({ w, e, first, last }: { w: Workout; e: WorkoutExercise; first: boolean; last: boolean }) {
  const nav = useNavigate();
  const ex = getExercise(e.exId);
  const [menu, setMenu] = useState(false);
  const [setMenuIdx, setSetMenuIdx] = useState<number | null>(null);
  const step = useData((d) => d.settings.weightStep);
  const prev = useMemo(() => lastSets(e.exId, w.id), [e.exId, w.id]);
  const best = useMemo(() => bestE1rm(e.exId, w.id), [e.exId, w.id]);
  const isActive = useData((d) => d.active?.id === w.id);
  const doneCount = e.sets.filter((s) => s.done).length;
  let workIdx = 0;

  return (
    <div className="ex-card">
      <div className="ex-head">
        <button onClick={() => ex && nav(`/exercise/${encodeURIComponent(ex.id)}`)}>
          <ExThumb ex={ex} />
        </button>
        <div className="row-main" onClick={() => ex && nav(`/exercise/${encodeURIComponent(ex.id)}`)}>
          <div className="ex-name">{ex?.name ?? 'Удалённое упражнение'}</div>
          <div className="hint">
            {e.target && isActive ? `Цель: ${e.sets.length}×${e.target} · ` : ''}
            {ex?.pm.map((m) => MUSCLES[m]).join(', ')}
            {isActive && ` · отдых ${fmtClock(restFor(e))}`}
          </div>
        </div>
        <span className="hint">
          {doneCount}/{e.sets.length}
        </span>
        <button className="icon-btn" onClick={() => setMenu(true)} aria-label="Меню упражнения">
          ⋯
        </button>
      </div>
      {e.note && <div className="hint" style={{ margin: '-4px 0 6px' }}>📝 {e.note}</div>}
      <table className="sets">
        <thead>
          <tr>
            <th>#</th>
            <th>Прошлый</th>
            <th>кг</th>
            <th>Повт.</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {e.sets.map((s, i) => {
            const label = s.warmup ? 'Р' : String(++workIdx);
            const p = prev?.[i];
            const isPr = s.done && !s.warmup && best > 0 && e1rm(s.w, s.r) > best;
            return (
              <tr key={i} className={s.done ? 'done' : ''}>
                <td>
                  <button className={`set-num ${s.warmup ? 'warm' : ''}`} onClick={() => setSetMenuIdx(i)}>
                    {label}
                  </button>
                </td>
                <td className="prev">
                  {isPr ? <span className="pr">🏆 PR</span> : p ? `${fmtWeight(p.w)}×${p.r}` : '—'}
                </td>
                <td>
                  <NumInput value={s.w} onChange={(v) => updateSet(w.id, e.uid, i, { w: v })} decimal />
                </td>
                <td>
                  <NumInput value={s.r} onChange={(v) => updateSet(w.id, e.uid, i, { r: v })} />
                </td>
                <td>
                  <button
                    className={`check ${s.done ? 'on' : ''}`}
                    onClick={() => {
                      tg.haptic(s.done ? 'light' : 'medium');
                      toggleSetDone(w.id, e, i);
                    }}
                    aria-label="Подход выполнен"
                  >
                    ✓
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="btn-row" style={{ marginTop: 8 }}>
        <button className="btn ghost small" onClick={() => addSet(w.id, e.uid)}>
          + Подход
        </button>
        {e.sets.length > 0 && (
          <button
            className="btn ghost small"
            onClick={() => {
              const l = e.sets[e.sets.length - 1];
              updateSet(w.id, e.uid, e.sets.length - 1, { w: Math.round((l.w + step) * 100) / 100 });
            }}
          >
            +{fmtWeight(step)} кг к посл.
          </button>
        )}
      </div>

      {setMenuIdx != null && (
        <Sheet title={`Подход ${setMenuIdx + 1}`} onClose={() => setSetMenuIdx(null)}>
          <div className="list">
            <button
              className="row"
              onClick={() => {
                updateSet(w.id, e.uid, setMenuIdx, { warmup: !e.sets[setMenuIdx]?.warmup });
                setSetMenuIdx(null);
              }}
            >
              🔥 {e.sets[setMenuIdx]?.warmup ? 'Сделать рабочим' : 'Отметить как разминочный'}
            </button>
            <div className="row">
              <span className="row-main">RPE (тяжесть 1–10)</span>
              <Stepper
                value={e.sets[setMenuIdx]?.rpe ?? 0}
                min={0}
                step={0.5}
                fmt={(v) => (v ? String(v) : '—')}
                onChange={(v) => updateSet(w.id, e.uid, setMenuIdx, { rpe: Math.min(10, v) || undefined })}
              />
            </div>
            <button
              className="row"
              style={{ color: 'var(--danger)' }}
              onClick={() => {
                removeSet(w.id, e.uid, setMenuIdx);
                setSetMenuIdx(null);
              }}
            >
              🗑 Удалить подход
            </button>
          </div>
        </Sheet>
      )}

      {menu && (
        <ExerciseMenu
          w={w}
          e={e}
          first={first}
          last={last}
          onClose={() => setMenu(false)}
        />
      )}
    </div>
  );
}

function ExerciseMenu({ w, e, first, last, onClose }: { w: Workout; e: WorkoutExercise; first: boolean; last: boolean; onClose: () => void }) {
  const [note, setNote] = useState(e.note ?? '');
  const rest = restFor(e);
  return (
    <Sheet title={getExercise(e.exId)?.name ?? 'Упражнение'} onClose={() => {
      if (note !== (e.note ?? '')) updateExercise(w.id, e.uid, (x) => ({ ...x, note: note || undefined }));
      onClose();
    }}>
      <div className="list">
        <div className="row">
          <span className="row-main">
            ⏱ Отдых между подходами
            <div className="row-sub">Запоминается для этого упражнения</div>
          </span>
          <Stepper
            value={rest}
            step={15}
            min={15}
            fmt={fmtClock}
            onChange={(v) => {
              updateExercise(w.id, e.uid, (x) => ({ ...x, rest: v }));
              setData((d) => ({ restOverrides: { ...d.restOverrides, [e.exId]: v } }));
            }}
          />
        </div>
      </div>
      <label className="field">
        <span>Заметка</span>
        <textarea className="input" value={note} onChange={(ev) => setNote(ev.target.value)} placeholder="Например: хват уже, сиденье на 4" />
      </label>
      <div className="list">
        {!first && (
          <button className="row" onClick={() => moveExercise(w.id, e.uid, -1)}>
            ⬆️ Переместить выше
          </button>
        )}
        {!last && (
          <button className="row" onClick={() => moveExercise(w.id, e.uid, 1)}>
            ⬇️ Переместить ниже
          </button>
        )}
        <button
          className="row"
          style={{ color: 'var(--danger)' }}
          onClick={async () => {
            if (await tg.confirm('Удалить упражнение из тренировки?')) {
              removeExercise(w.id, e.uid);
              onClose();
            }
          }}
        >
          🗑 Удалить из тренировки
        </button>
      </div>
    </Sheet>
  );
}

function NumInput({ value, onChange, decimal }: { value: number; onChange: (v: number) => void; decimal?: boolean }) {
  const [s, setS] = useState(value ? String(value) : '');
  useEffect(() => {
    const parsed = parseFloat(s.replace(',', '.')) || 0;
    if (parsed !== value) setS(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <input
      className="num-input"
      inputMode={decimal ? 'decimal' : 'numeric'}
      value={s}
      placeholder="0"
      onFocus={(ev) => ev.target.select()}
      onChange={(ev) => {
        const v = ev.target.value.replace(/[^\d.,]/g, '');
        setS(v);
        const n = parseFloat(v.replace(',', '.'));
        onChange(isNaN(n) ? 0 : decimal ? n : Math.round(n));
      }}
    />
  );
}
