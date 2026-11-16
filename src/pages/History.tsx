import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useData } from '../store';
import { deleteWorkout, updateWorkout } from '../workout';
import { exName } from '../data/exercises';
import { BackLink, Empty, useBack } from '../components/common';
import { WorkoutEditor } from '../components/WorkoutEditor';
import { fmtDate, fmtDateFull, fmtDuration, fmtTonnage, plural, workoutSetCount, workoutVolume } from '../utils';
import { tg } from '../tg';

export function History() {
  useBack();
  const workouts = useData((d) => d.workouts);
  const groups: { label: string; items: typeof workouts }[] = [];
  for (const w of workouts) {
    const label = fmtDate(w.start, { month: 'long', year: 'numeric' });
    const g = groups[groups.length - 1];
    if (g?.label === label) g.items.push(w);
    else groups.push({ label, items: [w] });
  }
  return (
    <div className="page">
      <BackLink />
      <div className="page-title">История</div>
      {!workouts.length && <Empty icon="🗓" title="Тренировок пока нет" />}
      {groups.map((g) => (
        <div key={g.label}>
          <h2>{g.label}</h2>
          <div className="list">
            {g.items.map((w) => (
              <Link key={w.id} to={`/history/${w.id}`} className="row" style={{ color: 'inherit' }}>
                <div className="thumb" style={{ fontSize: 15, fontWeight: 700, flexDirection: 'column', lineHeight: 1 }}>
                  {new Date(w.start).getDate()}
                  <span style={{ fontSize: 10, fontWeight: 400, color: 'var(--hint)' }}>
                    {new Date(w.start).toLocaleDateString('ru-RU', { weekday: 'short' })}
                  </span>
                </div>
                <div className="row-main">
                  <div className="row-title">{w.name}</div>
                  <div className="row-sub">{w.exercises.map((e) => exName(e.exId)).join(', ')}</div>
                  <div className="row-sub">
                    {workoutSetCount(w)} подх. · {fmtTonnage(workoutVolume(w))}
                    {w.end ? ` · ${fmtDuration(w.end - w.start)}` : ''}
                  </div>
                </div>
                <span className="chev">›</span>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function toLocalInput(ts: number) {
  const d = new Date(ts);
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 16);
}

export function WorkoutView() {
  useBack();
  const nav = useNavigate();
  const { id } = useParams();
  const [sp] = useSearchParams();
  const w = useData((d) => d.workouts.find((x) => x.id === id));
  if (!w) return <div className="page">Тренировка не найдена</div>;
  const justDone = sp.get('done') === '1';

  return (
    <div className="page">
      <BackLink />
      {justDone && (
        <div className="hero">
          <div className="hero-title">🎉 Отличная тренировка!</div>
          <div style={{ opacity: 0.9 }}>
            {fmtDuration((w.end ?? Date.now()) - w.start)} · {workoutSetCount(w)} {plural(workoutSetCount(w), ['подход', 'подхода', 'подходов'])} · {fmtTonnage(workoutVolume(w))}
          </div>
        </div>
      )}
      <input
        className="input"
        style={{ fontSize: 20, fontWeight: 700, border: 0, background: 'transparent', padding: '4px 0' }}
        value={w.name}
        onChange={(e) => updateWorkout(w.id, (x) => ({ ...x, name: e.target.value }))}
      />
      <div className="hint" style={{ marginBottom: 10 }}>{fmtDateFull(w.start)}</div>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-val">{fmtTonnage(workoutVolume(w))}</div>
          <div className="stat-label">тоннаж</div>
        </div>
        <div className="stat">
          <div className="stat-val">{w.end ? fmtDuration(w.end - w.start) : '—'}</div>
          <div className="stat-label">длительность</div>
        </div>
      </div>
      <label className="field">
        <span>Дата и время начала</span>
        <input
          type="datetime-local"
          className="input"
          value={toLocalInput(w.start)}
          onChange={(e) => {
            const ts = new Date(e.target.value).getTime();
            if (!isNaN(ts)) updateWorkout(w.id, (x) => ({ ...x, start: ts, end: x.end ? ts + (x.end - x.start) : undefined }));
          }}
        />
      </label>
      <h2>Упражнения (можно редактировать)</h2>
      <WorkoutEditor workout={w} />
      <label className="field" style={{ marginTop: 14 }}>
        <span>Заметка</span>
        <textarea className="input" value={w.note ?? ''} onChange={(e) => updateWorkout(w.id, (x) => ({ ...x, note: e.target.value }))} />
      </label>
      <button
        className="btn danger block"
        onClick={async () => {
          if (await tg.confirm('Удалить тренировку безвозвратно?')) {
            deleteWorkout(w.id);
            nav(-1);
          }
        }}
      >
        Удалить тренировку
      </button>
    </div>
  );
}
