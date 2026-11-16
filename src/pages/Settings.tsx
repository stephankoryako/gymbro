import { useRef } from 'react';
import { exportJson, forceSync, importJson, resetAll, setData, useData, useSyncState } from '../store';
import { BackLink, Stepper, useBack } from '../components/common';
import { fmtClock, fmtWeight } from '../utils';
import { tg } from '../tg';
import type { Settings as S } from '../types';

export function Settings() {
  useBack();
  const s = useData((d) => d.settings);
  const count = useData((d) => d.workouts.length);
  const sync = useSyncState();
  const file = useRef<HTMLInputElement>(null);
  const upd = (p: Partial<S>) => setData((d) => ({ settings: { ...d.settings, ...p } }));

  const download = () => {
    const blob = new Blob([exportJson()], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `gymbro-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page">
      <BackLink />
      <div className="page-title">Настройки</div>

      <h2>Таймер отдыха</h2>
      <div className="list">
        <div className="row">
          <span className="row-main">Отдых по умолчанию</span>
          <Stepper value={s.defaultRest} step={15} min={15} fmt={fmtClock} onChange={(v) => upd({ defaultRest: v })} />
        </div>
        <label className="row">
          <span className="row-main">
            Автозапуск таймера
            <div className="row-sub">после отметки подхода</div>
          </span>
          <input type="checkbox" className="toggle" checked={s.autoRest} onChange={(e) => upd({ autoRest: e.target.checked })} />
        </label>
        <label className="row">
          <span className="row-main">Звуковой сигнал</span>
          <input type="checkbox" className="toggle" checked={s.sound} onChange={(e) => upd({ sound: e.target.checked })} />
        </label>
        <label className="row">
          <span className="row-main">Вибрация</span>
          <input type="checkbox" className="toggle" checked={s.vibrate} onChange={(e) => upd({ vibrate: e.target.checked })} />
        </label>
      </div>

      <h2>Тренировка</h2>
      <div className="list">
        <div className="row">
          <span className="row-main">Шаг прибавки веса</span>
          <Stepper value={s.weightStep} step={0.5} min={0.5} fmt={(v) => `${fmtWeight(v)} кг`} onChange={(v) => upd({ weightStep: v })} />
        </div>
      </div>

      <h2>Данные</h2>
      <div className="list">
        <div className="row">
          <span className="row-main">
            Синхронизация
            <div className="row-sub">
              {tg.cloudAvailable
                ? { local: 'не выполнялась', syncing: 'идёт…', synced: 'данные в облаке Telegram', error: 'ошибка — попробуйте ещё раз' }[sync]
                : 'доступна только внутри Telegram'}
            </div>
          </span>
          {tg.cloudAvailable && (
            <button className="btn secondary small" onClick={forceSync}>
              Синхр.
            </button>
          )}
        </div>
        <button className="row" onClick={download}>
          <span className="row-main">
            📤 Экспорт в JSON
            <div className="row-sub">{count} тренировок</div>
          </span>
        </button>
        <button className="row" onClick={() => file.current?.click()}>
          📥 Импорт из JSON
        </button>
        <button
          className="row"
          style={{ color: 'var(--danger)' }}
          onClick={async () => {
            if (await tg.confirm('Удалить ВСЕ данные (тренировки, программы, настройки)? Это нельзя отменить.')) resetAll();
          }}
        >
          🗑 Сбросить все данные
        </button>
      </div>
      <input
        ref={file}
        type="file"
        accept="application/json,.json"
        hidden
        onChange={async (e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          try {
            const text = await f.text();
            if (await tg.confirm('Заменить текущие данные данными из файла?')) {
              importJson(text);
              tg.alert('Данные импортированы');
            }
          } catch (err) {
            tg.alert('Ошибка импорта: ' + (err as Error).message);
          }
          e.target.value = '';
        }}
      />

      <div className="hint" style={{ marginTop: 20, textAlign: 'center' }}>
        GymBro · каталог упражнений и фото:{' '}
        <a href="#" onClick={(e) => { e.preventDefault(); tg.openLink('https://github.com/yuhonas/free-exercise-db'); }}>
          free-exercise-db
        </a>{' '}
        (public domain)
      </div>
    </div>
  );
}
