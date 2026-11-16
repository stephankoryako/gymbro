import { useEffect, useState, type ReactNode } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import type { Exercise } from '../types';
import { imageUrl } from '../data/exercises';
import { tg } from '../tg';
import { useData } from '../store';

/** Показывает системную кнопку «Назад» Telegram на вложенных экранах */
export function useBack(enabled = true) {
  const nav = useNavigate();
  useEffect(() => {
    if (!enabled) return;
    tg.backButton(() => nav(-1));
    return () => tg.backButton(null);
  }, [enabled, nav]);
}

export function BackLink() {
  const nav = useNavigate();
  if (tg.inTelegram) return null;
  return (
    <button className="btn ghost small" style={{ marginLeft: -10 }} onClick={() => nav(-1)}>
      ‹ Назад
    </button>
  );
}

export function Nav() {
  const hasActive = useData((d) => !!d.active);
  const items = [
    { to: '/', ico: '🏠', label: 'Главная', end: true },
    { to: '/workout', ico: '🏋️', label: 'Тренировка', dot: hasActive },
    { to: '/catalog', ico: '📚', label: 'Каталог' },
    { to: '/programs', ico: '📋', label: 'Программы' },
    { to: '/stats', ico: '📈', label: 'Прогресс' },
  ];
  return (
    <nav className="nav">
      <div className="nav-inner">
        {items.map((it) => (
          <NavLink key={it.to} to={it.to} end={it.end} onClick={() => tg.haptic('select')}>
            <span className="ico">{it.ico}</span>
            {it.label}
            {it.dot && <span className="dot" />}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}

export function ExThumb({ ex, size }: { ex?: Exercise; size?: number }) {
  const [err, setErr] = useState(false);
  const src = ex ? imageUrl(ex, 0) : null;
  const style = size ? { width: size, height: size } : undefined;
  if (!src || err) return <div className="thumb" style={style}>🏋️</div>;
  return <img className="thumb" style={style} src={src} loading="lazy" alt="" onError={() => setErr(true)} />;
}

export function Sheet({
  title,
  onClose,
  children,
  footer,
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div className="sheet" onClick={(e) => e.stopPropagation()}>
        <div className="sheet-head">
          <span>{title}</span>
          <button className="icon-btn" onClick={onClose} aria-label="Закрыть">
            ✕
          </button>
        </div>
        <div className="sheet-body">{children}</div>
        {footer && <div className="sheet-foot">{footer}</div>}
      </div>
    </div>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  fmt = (v: number) => String(v),
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  fmt?: (v: number) => string;
}) {
  return (
    <div className="stepper">
      <button onClick={() => onChange(Math.max(min, value - step))}>−</button>
      <span className="v">{fmt(value)}</span>
      <button onClick={() => onChange(value + step)}>+</button>
    </div>
  );
}

export function Empty({ icon, title, children }: { icon: string; title: string; children?: ReactNode }) {
  return (
    <div className="empty-state">
      <div className="big">{icon}</div>
      <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>{title}</div>
      {children}
    </div>
  );
}
