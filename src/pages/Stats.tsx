import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useData } from '../store';
import { exName, getExercise, GROUPS, groupOf } from '../data/exercises';
import { e1rm, fmtDate, fmtDuration, fmtNum, fmtTonnage, fmtWeight, plural, weekStart, workoutVolume, workSets } from '../utils';
import { BackLink, Empty, ExThumb, useBack } from '../components/common';
import type { Workout } from '../types';

const PERIODS = [
  { key: '30', label: '30 дней', days: 30 },
  { key: '90', label: '3 мес', days: 90 },
  { key: '365', label: 'Год', days: 365 },
  { key: 'all', label: 'Всё', days: 0 },
];

const DAY = 86400000;

function ChartTip({ active, payload, label, unit, labelFmt }: { active?: boolean; payload?: { value: number }[]; label?: number | string; unit: string; labelFmt: (l: number | string) => string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tip">
      <div className="hint">{labelFmt(label ?? '')}</div>
      <b>
        {fmtNum(payload[0].value, 1)} {unit}
      </b>
    </div>
  );
}

function weekStreak(workouts: Workout[]): number {
  const weeks = new Set(workouts.map((w) => weekStart(w.start)));
  let ws = weekStart(Date.now());
  if (!weeks.has(ws)) ws -= 7 * DAY; // текущая неделя ещё может быть впереди
  let n = 0;
  while (weeks.has(ws)) {
    n++;
    ws = weekStart(ws - 3 * DAY);
  }
  return n;
}

export function Stats() {
  const all = useData((d) => d.workouts);
  const [period, setPeriod] = useState('90');
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
  });

  const days = PERIODS.find((p) => p.key === period)!.days;
  const list = useMemo(() => (days ? all.filter((w) => w.start >= Date.now() - days * DAY) : all), [all, days]);

  const totals = useMemo(() => {
    let vol = 0;
    let sets = 0;
    let dur = 0;
    let durN = 0;
    const groupSets: Record<string, number> = {};
    for (const w of list) {
      vol += workoutVolume(w);
      if (w.end) {
        dur += w.end - w.start;
        durN++;
      }
      for (const e of w.exercises) {
        const n = workSets(e.sets).length;
        sets += n;
        const ex = getExercise(e.exId);
        if (ex?.pm[0]) {
          const g = groupOf(ex.pm[0]);
          groupSets[g] = (groupSets[g] ?? 0) + n;
        }
      }
    }
    return { vol, sets, avgDur: durN ? dur / durN : 0, groupSets };
  }, [list]);

  // Тоннаж по неделям (последние 12 недель)
  const weekly = useMemo(() => {
    const now = weekStart(Date.now());
    const arr = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(now);
      d.setDate(d.getDate() - (11 - i) * 7);
      return { week: d.getTime(), vol: 0, n: 0 };
    });
    for (const w of all) {
      const ws = weekStart(w.start);
      const b = arr.find((x) => x.week === ws);
      if (b) {
        b.vol += workoutVolume(w);
        b.n++;
      }
    }
    return arr;
  }, [all]);

  // Лучшие результаты по упражнениям
  const prs = useMemo(() => {
    const m = new Map<string, { best: number; w: number; r: number; n: number }>();
    for (const w of all)
      for (const e of w.exercises) {
        const cur = m.get(e.exId) ?? { best: 0, w: 0, r: 0, n: 0 };
        cur.n++;
        for (const s of workSets(e.sets)) {
          const v = e1rm(s.w, s.r);
          if (v > cur.best) Object.assign(cur, { best: v, w: s.w, r: s.r });
        }
        m.set(e.exId, cur);
      }
    return [...m.entries()].filter(([, v]) => v.best > 0).sort((a, b) => b[1].n - a[1].n);
  }, [all]);

  if (!all.length) {
    return (
      <div className="page">
        <div className="page-title">Прогресс</div>
        <Empty icon="📈" title="Статистики пока нет">
          Завершите первую тренировку, и здесь появятся графики, рекорды и календарь.
        </Empty>
      </div>
    );
  }

  const maxGroup = Math.max(1, ...Object.values(totals.groupSets));

  return (
    <div className="page">
      <div className="page-title">
        <span>Прогресс</span>
        <Link to="/history" className="btn secondary small">
          🗓 История
        </Link>
      </div>
      <div className="seg">
        {PERIODS.map((p) => (
          <button key={p.key} className={period === p.key ? 'on' : ''} onClick={() => setPeriod(p.key)}>
            {p.label}
          </button>
        ))}
      </div>
      <div className="stat-grid">
        <div className="stat">
          <div className="stat-val">{list.length}</div>
          <div className="stat-label">{plural(list.length, ['тренировка', 'тренировки', 'тренировок'])}</div>
        </div>
        <div className="stat">
          <div className="stat-val">{fmtTonnage(totals.vol)}</div>
          <div className="stat-label">общий тоннаж</div>
        </div>
        <div className="stat">
          <div className="stat-val">{fmtNum(totals.sets)}</div>
          <div className="stat-label">рабочих подходов</div>
        </div>
        <div className="stat">
          <div className="stat-val">{totals.avgDur ? fmtDuration(totals.avgDur) : '—'}</div>
          <div className="stat-label">средняя длительность</div>
        </div>
      </div>
      <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 30 }}>🔥</span>
        <div>
          <div style={{ fontWeight: 700, fontSize: 18 }}>
            {weekStreak(all)} {plural(weekStreak(all), ['неделя', 'недели', 'недель'])} подряд
          </div>
          <div className="hint">с хотя бы одной тренировкой</div>
        </div>
      </div>

      <h2>Тоннаж по неделям, кг</h2>
      <div className="card" style={{ padding: '14px 6px 4px 0' }}>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={weekly} margin={{ left: 0, right: 8 }}>
            <CartesianGrid vertical={false} />
            <XAxis dataKey="week" tickFormatter={(v) => fmtDate(v, { day: 'numeric', month: 'numeric' })} tickLine={false} axisLine={false} interval={1} />
            <YAxis tickFormatter={(v) => (v >= 1000 ? `${fmtNum(v / 1000, 1)}т` : String(v))} tickLine={false} axisLine={false} width={38} />
            <Tooltip
              cursor={{ fill: 'var(--border)' }}
              content={<ChartTip unit="кг" labelFmt={(l) => `Неделя с ${fmtDate(Number(l))}`} />}
            />
            <Bar dataKey="vol" fill="var(--accent)" radius={[4, 4, 0, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <h2>Подходы по группам мышц</h2>
      <div className="card">
        {GROUPS.filter((g) => totals.groupSets[g.key]).map((g) => (
          <div key={g.key} className="bar-row">
            <span className="lbl">
              {g.icon} {g.label}
            </span>
            <div className="track">
              <div className="fill" style={{ width: `${(totals.groupSets[g.key] / maxGroup) * 100}%` }} />
            </div>
            <span className="val">{totals.groupSets[g.key]}</span>
          </div>
        ))}
        {!Object.keys(totals.groupSets).length && <div className="hint">Нет данных за период</div>}
      </div>

      <h2>Календарь</h2>
      <Calendar month={month} setMonth={setMonth} workouts={all} />

      <h2>Упражнения и рекорды</h2>
      <div className="list">
        {prs.map(([id, v]) => (
          <Link key={id} to={`/stats/exercise/${encodeURIComponent(id)}`} className="row" style={{ color: 'inherit' }}>
            <ExThumb ex={getExercise(id)} size={44} />
            <div className="row-main">
              <div className="row-title">{exName(id)}</div>
              <div className="row-sub">
                Лучший: {fmtWeight(v.w)} кг × {v.r} · 1ПМ ≈ {fmtWeight(v.best)} кг · {v.n} трен.
              </div>
            </div>
            <span className="chev">›</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

function Calendar({ month, setMonth, workouts }: { month: number; setMonth: (m: number) => void; workouts: Workout[] }) {
  const d = new Date(month);
  const y = d.getFullYear();
  const m = d.getMonth();
  const daysIn = new Date(y, m + 1, 0).getDate();
  const offset = (new Date(y, m, 1).getDay() + 6) % 7;
  const has = new Set(workouts.filter((w) => new Date(w.start).getMonth() === m && new Date(w.start).getFullYear() === y).map((w) => new Date(w.start).getDate()));
  const today = new Date();
  const isCur = today.getMonth() === m && today.getFullYear() === y;
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <button className="icon-btn" onClick={() => setMonth(new Date(y, m - 1, 1).getTime())} aria-label="Предыдущий месяц">
          ‹
        </button>
        <b style={{ textTransform: 'capitalize' }}>
          {d.toLocaleDateString('ru-RU', { month: 'long', year: 'numeric' })} · {has.size} {plural(has.size, ['день', 'дня', 'дней'])}
        </b>
        <button className="icon-btn" onClick={() => setMonth(new Date(y, m + 1, 1).getTime())} aria-label="Следующий месяц">
          ›
        </button>
      </div>
      <div className="cal">
        {['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'].map((x) => (
          <div key={x} className="dow">
            {x}
          </div>
        ))}
        {Array.from({ length: offset }, (_, i) => (
          <div key={'e' + i} className="day empty" />
        ))}
        {Array.from({ length: daysIn }, (_, i) => (
          <div key={i} className={`day ${has.has(i + 1) ? 'has' : ''} ${isCur && today.getDate() === i + 1 ? 'today' : ''}`}>
            {i + 1}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Прогресс по упражнению ──
const METRICS = [
  { key: 'e1rm', label: '1ПМ', unit: 'кг' },
  { key: 'maxW', label: 'Макс. вес', unit: 'кг' },
  { key: 'vol', label: 'Объём', unit: 'кг' },
  { key: 'reps', label: 'Повторы', unit: 'повт.' },
] as const;

export function ExerciseProgress() {
  useBack();
  const { id = '' } = useParams();
  const exId = decodeURIComponent(id);
  const all = useData((d) => d.workouts);
  const [metric, setMetric] = useState<(typeof METRICS)[number]['key']>('e1rm');
  const ex = getExercise(exId);

  const sessions = useMemo(() => {
    const out: { ts: number; wid: string; e1rm: number; maxW: number; vol: number; reps: number; sets: string }[] = [];
    for (const w of all) {
      const sets = w.exercises.filter((e) => e.exId === exId).flatMap((e) => workSets(e.sets));
      if (!sets.length) continue;
      out.push({
        ts: w.start,
        wid: w.id,
        e1rm: Math.max(...sets.map((s) => e1rm(s.w, s.r))),
        maxW: Math.max(...sets.map((s) => s.w)),
        vol: sets.reduce((a, s) => a + s.w * s.r, 0),
        reps: sets.reduce((a, s) => a + s.r, 0),
        sets: sets.map((s) => `${fmtWeight(s.w)}×${s.r}`).join(', '),
      });
    }
    return out.reverse();
  }, [all, exId]);

  // Рекорды по количеству повторений
  const repMax = useMemo(() => {
    const best: Record<number, { w: number; ts: number }> = {};
    for (const w of all)
      for (const e of w.exercises) {
        if (e.exId !== exId) continue;
        for (const s of workSets(e.sets)) {
          if (!best[s.r] || s.w > best[s.r].w) best[s.r] = { w: s.w, ts: w.start };
        }
      }
    return Object.entries(best)
      .map(([r, v]) => ({ r: +r, ...v }))
      .sort((a, b) => a.r - b.r)
      .slice(0, 12);
  }, [all, exId]);

  const m = METRICS.find((x) => x.key === metric)!;
  const first = sessions[0]?.[metric] ?? 0;
  const lastV = sessions[sessions.length - 1]?.[metric] ?? 0;
  const delta = first ? ((lastV - first) / first) * 100 : 0;

  return (
    <div className="page">
      <BackLink />
      <div style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '4px 0 12px' }}>
        <ExThumb ex={ex} />
        <div>
          <h1 style={{ fontSize: 20, margin: 0 }}>{exName(exId)}</h1>
          <Link to={`/exercise/${encodeURIComponent(exId)}`} className="hint">
            Описание упражнения ›
          </Link>
        </div>
      </div>
      {!sessions.length ? (
        <Empty icon="📉" title="Нет данных">
          Выполните это упражнение в тренировке.
        </Empty>
      ) : (
        <>
          <div className="seg">
            {METRICS.map((x) => (
              <button key={x.key} className={metric === x.key ? 'on' : ''} onClick={() => setMetric(x.key)}>
                {x.label}
              </button>
            ))}
          </div>
          <div className="stat-grid">
            <div className="stat">
              <div className="stat-val">{fmtNum(lastV, 1)}</div>
              <div className="stat-label">
                последний, {m.unit}
              </div>
            </div>
            <div className="stat">
              <div className="stat-val" style={{ color: delta > 0 ? 'var(--ok)' : delta < 0 ? 'var(--danger)' : undefined }}>
                {delta > 0 ? '▲' : delta < 0 ? '▼' : ''} {fmtNum(Math.abs(delta), 1)}%
              </div>
              <div className="stat-label">с первой тренировки</div>
            </div>
          </div>
          <div className="card" style={{ padding: '14px 6px 4px 0' }}>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={sessions} margin={{ left: 0, right: 12, top: 6 }}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="ts" tickFormatter={(v) => fmtDate(v, { day: 'numeric', month: 'numeric' })} tickLine={false} axisLine={false} minTickGap={20} />
                <YAxis domain={['auto', 'auto']} tickLine={false} axisLine={false} width={38} />
                <Tooltip
                  cursor={{ stroke: 'var(--hint)', strokeDasharray: '3 3' }}
                  content={<ChartTip unit={m.unit} labelFmt={(l) => fmtDate(Number(l), { day: 'numeric', month: 'long', year: 'numeric' })} />}
                />
                <Line
                  type="monotone"
                  dataKey={metric}
                  stroke="var(--accent)"
                  strokeWidth={2}
                  dot={{ r: 4, fill: 'var(--accent)', stroke: 'var(--card)', strokeWidth: 2 }}
                  activeDot={{ r: 6, stroke: 'var(--card)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <h2>Рекорды по повторениям</h2>
          <div className="card" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
            {repMax.map((x) => (
              <div key={x.r} style={{ background: 'var(--bg2)', borderRadius: 10, padding: 8, textAlign: 'center' }}>
                <div className="hint">{x.r} повт.</div>
                <div style={{ fontWeight: 700 }}>{fmtWeight(x.w)} кг</div>
              </div>
            ))}
          </div>

          <h2>История</h2>
          <div className="list">
            {[...sessions].reverse().map((s) => (
              <Link key={s.wid} to={`/history/${s.wid}`} className="row" style={{ color: 'inherit' }}>
                <div className="row-main">
                  <div className="row-title">{fmtDate(s.ts, { day: 'numeric', month: 'long', year: 'numeric' })}</div>
                  <div className="row-sub">{s.sets}</div>
                </div>
                <span className="hint">1ПМ {fmtWeight(s.e1rm)}</span>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
