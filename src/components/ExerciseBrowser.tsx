import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise } from '../types';
import { allExercises, CATEGORIES, EQUIPMENT, GROUPS, LEVELS, MUSCLES } from '../data/exercises';
import { ExThumb, Sheet } from './common';
import { useData } from '../store';
import { tg } from '../tg';

interface Filters {
  q: string;
  group: string;
  eq: string[];
  lv: string[];
  cat: string[];
}

const PAGE = 50;
let saved: Filters = { q: '', group: '', eq: [], lv: [], cat: [] };

function useFilteredExercises(f: Filters) {
  const custom = useData((d) => d.customExercises);
  return useMemo(() => {
    const q = f.q.trim().toLowerCase();
    const g = GROUPS.find((x) => x.key === f.group);
    return allExercises().filter((e) => {
      if (q && !e.name.toLowerCase().includes(q) && !e.en.toLowerCase().includes(q)) return false;
      if (g && !e.pm.some((m) => g.muscles.includes(m))) return false;
      if (f.eq.length && !f.eq.includes(e.eq)) return false;
      if (f.lv.length && !f.lv.includes(e.lv)) return false;
      if (f.cat.length && !f.cat.includes(e.cat)) return false;
      return true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [f, custom]);
}

export function ExerciseBrowser({
  onOpen,
  selectable,
  selected,
  onToggle,
}: {
  onOpen?: (e: Exercise) => void;
  selectable?: boolean;
  selected?: string[];
  onToggle?: (e: Exercise) => void;
}) {
  const [f, setF] = useState<Filters>(saved);
  const [limit, setLimit] = useState(PAGE);
  const [showFilters, setShowFilters] = useState(false);
  const list = useFilteredExercises(f);
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saved = f;
    setLimit(PAGE);
  }, [f]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el) return;
    const io = new IntersectionObserver((ents) => {
      if (ents[0].isIntersecting) setLimit((l) => l + PAGE);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [list]);

  const nFilters = f.eq.length + f.lv.length + f.cat.length;
  const toggleIn = (key: 'eq' | 'lv' | 'cat', v: string) =>
    setF((p) => ({ ...p, [key]: p[key].includes(v) ? p[key].filter((x) => x !== v) : [...p[key], v] }));

  return (
    <div>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="search"
          placeholder="Поиск: жим, squat, бицепс…"
          value={f.q}
          onChange={(e) => setF({ ...f, q: e.target.value })}
        />
        <button className="btn secondary small" style={{ height: 42 }} onClick={() => setShowFilters(true)}>
          ⚙︎{nFilters ? ` ${nFilters}` : ''}
        </button>
      </div>
      <div className="chips">
        <button className={`chip ${!f.group ? 'on' : ''}`} onClick={() => setF({ ...f, group: '' })}>
          Все
        </button>
        {GROUPS.map((g) => (
          <button
            key={g.key}
            className={`chip ${f.group === g.key ? 'on' : ''}`}
            onClick={() => {
              tg.haptic('select');
              setF({ ...f, group: f.group === g.key ? '' : g.key });
            }}
          >
            {g.icon} {g.label}
          </button>
        ))}
      </div>
      <div className="hint" style={{ margin: '0 4px 6px' }}>
        Найдено: {list.length}
      </div>
      <div className="list">
        {list.slice(0, limit).map((e) => {
          const on = selected?.includes(e.id);
          return (
            <button
              key={e.id}
              className="row"
              onClick={() => {
                if (selectable) {
                  tg.haptic('select');
                  onToggle?.(e);
                } else onOpen?.(e);
              }}
            >
              <ExThumb ex={e} />
              <div className="row-main">
                <div className="row-title">{e.name}</div>
                <div className="row-sub">
                  {e.pm.map((m) => MUSCLES[m]).join(', ')} · {EQUIPMENT[e.eq] ?? e.eq}
                </div>
              </div>
              {selectable ? (
                <span className={`check ${on ? 'on' : ''}`} style={{ display: 'grid', placeItems: 'center' }}>
                  {on ? '✓' : '+'}
                </span>
              ) : (
                <span className="chev">›</span>
              )}
            </button>
          );
        })}
      </div>
      {limit < list.length && <div ref={sentinel} style={{ height: 40 }} />}
      {!list.length && <div className="empty-state">Ничего не найдено</div>}

      {showFilters && (
        <Sheet
          title="Фильтры"
          onClose={() => setShowFilters(false)}
          footer={
            <div className="btn-row">
              <button className="btn secondary" onClick={() => setF({ ...f, eq: [], lv: [], cat: [] })}>
                Сбросить
              </button>
              <button className="btn" onClick={() => setShowFilters(false)}>
                Показать ({list.length})
              </button>
            </div>
          }
        >
          <h2>Оборудование</h2>
          <ChipGroup map={EQUIPMENT} value={f.eq} onToggle={(v) => toggleIn('eq', v)} />
          <h2>Уровень</h2>
          <ChipGroup map={LEVELS} value={f.lv} onToggle={(v) => toggleIn('lv', v)} />
          <h2>Тип</h2>
          <ChipGroup map={CATEGORIES} value={f.cat} onToggle={(v) => toggleIn('cat', v)} />
        </Sheet>
      )}
    </div>
  );
}

function ChipGroup({ map, value, onToggle }: { map: Record<string, string>; value: string[]; onToggle: (v: string) => void }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
      {Object.entries(map).map(([k, label]) => (
        <button key={k} className={`chip ${value.includes(k) ? 'on' : ''}`} onClick={() => onToggle(k)}>
          {label}
        </button>
      ))}
    </div>
  );
}

/** Модальное окно выбора нескольких упражнений */
export function ExercisePicker({ onClose, onDone, title = 'Добавить упражнения' }: { onClose: () => void; onDone: (ids: string[]) => void; title?: string }) {
  const [sel, setSel] = useState<string[]>([]);
  return (
    <Sheet
      title={title}
      onClose={onClose}
      footer={
        <button className="btn block" disabled={!sel.length} onClick={() => onDone(sel)}>
          Добавить{sel.length ? ` (${sel.length})` : ''}
        </button>
      }
    >
      <ExerciseBrowser
        selectable
        selected={sel}
        onToggle={(e) => setSel((s) => (s.includes(e.id) ? s.filter((x) => x !== e.id) : [...s, e.id]))}
      />
    </Sheet>
  );
}
