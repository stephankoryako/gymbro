import { Link, useNavigate } from 'react-router-dom';
import { useData, useSyncState } from '../store';
import { tg } from '../tg';
import { findProgram, nextDayIdx, startWorkout } from '../workout';
import { fmtDateFull, fmtDuration, fmtTonnage, plural, weekStart, workoutSetCount, workoutVolume } from '../utils';
import { Empty } from '../components/common';

export function Home() {
  const nav = useNavigate();
  const active = useData((d) => d.active);
  const workouts = useData((d) => d.workouts);
  const sync = useSyncState();
  const name = tg.userName();

  const ws = weekStart(Date.now());
  const thisWeek = workouts.filter((w) => w.start >= ws);
  const weekVol = thisWeek.reduce((a, w) => a + workoutVolume(w), 0);
  const lastProgWorkout = workouts.find((w) => w.programId);
  const prog = findProgram(lastProgWorkout?.programId);
  const nextIdx = prog ? nextDayIdx(prog) : 0;

  const syncLabel = { local: '💾 На устройстве', syncing: '🔄 Синхронизация…', synced: '☁️ В облаке Telegram', error: '⚠️ Ошибка синхронизации' }[sync];

  return (
    <div className="page">
      <div className="page-title">
        <span>{name ? `Привет, ${name}!` : 'GymBro'} 💪</span>
        <Link to="/settings" className="icon-btn" aria-label="Настройки">
          ⚙️
        </Link>
      </div>

      {active ? (
        <div className="hero">
          <div className="hero-title">Тренировка идёт</div>
          <div style={{ opacity: 0.9, marginBottom: 12 }}>
            {active.name} · {fmtDuration(Date.now() - active.start)}
          </div>
          <button className="btn block" onClick={() => nav('/workout')}>
            Продолжить ▶
          </button>
        </div>
      ) : (
        <div className="hero">
          <div className="hero-title">Готов к тренировке?</div>
          <div style={{ opacity: 0.9, marginBottom: 12 }}>
            {prog ? `Следующая: ${prog.name} — ${prog.days[nextIdx].name}` : 'Начни свободную тренировку или выбери программу'}
          </div>
          <div className="btn-row">
            {prog && (
              <button
                className="btn"
                onClick={() => {
                  startWorkout({ programId: prog.id, dayIdx: nextIdx });
                  tg.haptic('success');
                  nav('/workout');
                }}
              >
                ▶ {prog.days[nextIdx].name}
              </button>
            )}
            <button
              className="btn"
              style={prog ? { background: 'rgba(255,255,255,.2)', color: '#fff' } : undefined}
              onClick={() => {
                startWorkout();
                tg.haptic('success');
                nav('/workout');
              }}
            >
              {prog ? 'Свободная' : '▶ Начать тренировку'}
            </button>
          </div>
        </div>
      )}

      <div className="stat-grid">
        <div className="stat">
          <div className="stat-val">{thisWeek.length}</div>
          <div className="stat-label">{plural(thisWeek.length, ['тренировка', 'тренировки', 'тренировок'])} на этой неделе</div>
        </div>
        <div className="stat">
          <div className="stat-val">{fmtTonnage(weekVol)}</div>
          <div className="stat-label">тоннаж за неделю</div>
        </div>
      </div>

      <div className="btn-row" style={{ marginBottom: 6 }}>
        <Link to="/programs" className="btn secondary">
          📋 Программы
        </Link>
        <Link to="/history" className="btn secondary">
          🗓 История
        </Link>
      </div>

      <h2>Последние тренировки</h2>
      {workouts.length === 0 ? (
        <Empty icon="🏋️" title="Пока нет тренировок">
          Начни первую тренировку — и здесь появится история и прогресс.
        </Empty>
      ) : (
        <div className="list">
          {workouts.slice(0, 5).map((w) => (
            <Link key={w.id} to={`/history/${w.id}`} className="row" style={{ color: 'inherit' }}>
              <div className="thumb">🏋️</div>
              <div className="row-main">
                <div className="row-title">{w.name}</div>
                <div className="row-sub">
                  {fmtDateFull(w.start)} · {w.exercises.length} упр. · {workoutSetCount(w)} подх. · {fmtTonnage(workoutVolume(w))}
                </div>
              </div>
              <span className="chev">›</span>
            </Link>
          ))}
        </div>
      )}
      <div className="hint" style={{ textAlign: 'center', marginTop: 12 }}>
        {syncLabel}
      </div>
    </div>
  );
}
