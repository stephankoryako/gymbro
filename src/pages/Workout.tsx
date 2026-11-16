import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../store';
import { tg } from '../tg';
import { allPrograms, discardWorkout, finishWorkout, nextDayIdx, startWorkout, updateWorkout } from '../workout';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { fmtClock, fmtTonnage, workoutVolume } from '../utils';
import { stopRest } from '../timer';

function Elapsed({ start }: { start: number }) {
  const [, f] = useState(0);
  useEffect(() => {
    const id = setInterval(() => f((x) => x + 1), 1000);
    return () => clearInterval(id);
  }, []);
  const s = Math.floor((Date.now() - start) / 1000);
  const h = Math.floor(s / 3600);
  return <span className="timer-big">{h ? `${h}:${fmtClock(s % 3600).padStart(5, '0')}` : fmtClock(s)}</span>;
}

export function WorkoutPage() {
  const nav = useNavigate();
  const active = useData((d) => d.active);
  useData((d) => d.programs);

  if (!active) {
    const programs = allPrograms();
    return (
      <div className="page">
        <div className="page-title">Тренировка</div>
        <button
          className="btn block"
          style={{ padding: 16, marginBottom: 6 }}
          onClick={() => {
            startWorkout();
            tg.haptic('success');
          }}
        >
          ▶ Начать пустую тренировку
        </button>
        <div className="hint" style={{ textAlign: 'center' }}>
          Добавляйте упражнения по ходу
        </div>
        <h2>Или по программе</h2>
        {programs.map((p) => {
          const next = nextDayIdx(p);
          return (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <Link to={`/program/${p.id}`} style={{ color: 'inherit' }}>
                  <h3>{p.name}</h3>
                  <span className="hint">
                    {p.perWeek}×/нед · {p.goal}
                  </span>
                </Link>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {p.days.map((d, i) => (
                  <button
                    key={i}
                    className={`chip ${i === next ? 'on' : ''}`}
                    style={i !== next ? { background: 'var(--bg2)' } : undefined}
                    onClick={() => {
                      startWorkout({ programId: p.id, dayIdx: i });
                      tg.haptic('success');
                    }}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  const finish = async () => {
    const done = active.exercises.reduce((a, e) => a + e.sets.filter((s) => s.done).length, 0);
    if (!done) {
      if (await tg.confirm('Нет выполненных подходов. Отменить тренировку?')) {
        discardWorkout();
        stopRest();
      }
      return;
    }
    if (!(await tg.confirm(`Завершить тренировку? Выполнено подходов: ${done}. Невыполненные подходы не сохранятся.`))) return;
    const w = finishWorkout();
    stopRest();
    tg.haptic('success');
    if (w) nav(`/history/${w.id}?done=1`, { replace: true });
  };

  return (
    <div>
      <div className="workout-top">
        <div className="grow">
          <input
            className="input"
            style={{ border: 0, background: 'transparent', padding: 0, fontWeight: 600, fontSize: 16 }}
            value={active.name}
            onChange={(e) => updateWorkout(active.id, (w) => ({ ...w, name: e.target.value }))}
          />
          <div className="hint">
            <Elapsed start={active.start} /> · {fmtTonnage(workoutVolume(active))}
          </div>
        </div>
        <button className="btn small" style={{ background: 'var(--ok)' }} onClick={finish}>
          Завершить
        </button>
      </div>
      <div className="page" style={{ paddingBottom: 90 }}>
        {active.exercises.length === 0 && (
          <div className="empty-state">
            <div className="big">🏋️</div>
            Добавьте первое упражнение
          </div>
        )}
        <WorkoutEditor workout={active} />
        <label className="field" style={{ marginTop: 14 }}>
          <span>Заметка к тренировке</span>
          <textarea
            className="input"
            value={active.note ?? ''}
            placeholder="Самочувствие, сон, что изменить в следующий раз…"
            onChange={(e) => updateWorkout(active.id, (w) => ({ ...w, note: e.target.value }))}
          />
        </label>
        <button
          className="btn danger block"
          onClick={async () => {
            if (await tg.confirm('Отменить тренировку? Все данные этой тренировки будут удалены.')) {
              discardWorkout();
              stopRest();
            }
          }}
        >
          Отменить тренировку
        </button>
      </div>
    </div>
  );
}
