import { useEffect, useState } from 'react';
import { addRest, dismissFinished, stopRest, tickTimer, useTimer } from '../timer';
import { fmtClock } from '../utils';
import { tg } from '../tg';

export function RestTimer() {
  const t = useTimer();
  const [, force] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      tickTimer();
      force((x) => x + 1);
    }, 250);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!t.finished) return;
    const id = setTimeout(dismissFinished, 6000);
    return () => clearTimeout(id);
  }, [t.finished]);

  if (t.finished) {
    return (
      <div className="rest-bar">
        <div className="rest-inner finished" onClick={dismissFinished}>
          <span style={{ fontSize: 24 }}>🔔</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700 }}>Отдых окончен!</div>
            <div style={{ fontSize: 12, opacity: 0.85 }}>Время для следующего подхода</div>
          </div>
          <button className="rest-btn">OK</button>
        </div>
      </div>
    );
  }
  if (!t.endAt) return null;
  const left = (t.endAt - Date.now()) / 1000;
  const pct = Math.max(0, Math.min(100, (left / t.duration) * 100));

  return (
    <div className="rest-bar">
      <div className="rest-inner">
        <span style={{ fontSize: 20 }}>⏱</span>
        <div className="rest-time">{fmtClock(Math.ceil(left))}</div>
        <div className="rest-label">
          Отдых
          <br />
          {t.label}
        </div>
        <button
          className="rest-btn"
          onClick={() => {
            tg.haptic('light');
            addRest(-15);
          }}
        >
          −15
        </button>
        <button
          className="rest-btn"
          onClick={() => {
            tg.haptic('light');
            addRest(15);
          }}
        >
          +15
        </button>
        <button className="rest-btn" onClick={stopRest} aria-label="Пропустить отдых">
          ✕
        </button>
        <div className="rest-progress" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
