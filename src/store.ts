import { useSyncExternalStore } from 'react';
import { get as idbGet, set as idbSet } from 'idb-keyval';
import type { AppData, Settings } from './types';
import { cloud, tg } from './tg';

const IDB_KEY = 'gymbro-data';
const CHUNK = 4000; // CloudStorage: значение до 4096 символов
const META = 'm';

export const defaultSettings: Settings = {
  defaultRest: 90,
  autoRest: true,
  sound: true,
  vibrate: true,
  weightStep: 2.5,
};

function emptyData(): AppData {
  return {
    v: 1,
    ts: 0,
    workouts: [],
    programs: [],
    customExercises: [],
    settings: { ...defaultSettings },
    active: null,
    restOverrides: {},
  };
}

let data: AppData = emptyData();
const listeners = new Set<() => void>();

export type SyncState = 'local' | 'syncing' | 'synced' | 'error';
let syncState: SyncState = 'local';
const syncListeners = new Set<() => void>();
function setSync(s: SyncState) {
  syncState = s;
  syncListeners.forEach((l) => l());
}

function emit() {
  listeners.forEach((l) => l());
}

export function getData() {
  return data;
}

/** Иммутабельное обновление: передайте частичный объект или функцию, возвращающую его. */
export function setData(patch: Partial<AppData> | ((d: AppData) => Partial<AppData>)) {
  const p = typeof patch === 'function' ? patch(data) : patch;
  data = { ...data, ...p, ts: Date.now() };
  emit();
  scheduleSave();
}

export function useData<T>(selector: (d: AppData) => T): T {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => selector(data),
  );
}

export function useSyncState(): SyncState {
  return useSyncExternalStore(
    (cb) => {
      syncListeners.add(cb);
      return () => syncListeners.delete(cb);
    },
    () => syncState,
  );
}

function normalize(d: Partial<AppData>): AppData {
  const e = emptyData();
  return {
    ...e,
    ...d,
    settings: { ...e.settings, ...(d.settings ?? {}) },
    restOverrides: d.restOverrides ?? {},
  } as AppData;
}

// ── Сохранение ──
let saveTimer: number | undefined;
let cloudTimer: number | undefined;

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = window.setTimeout(() => {
    idbSet(IDB_KEY, data).catch((e) => console.error('IDB save', e));
  }, 250);
  if (tg.cloudAvailable) {
    clearTimeout(cloudTimer);
    cloudTimer = window.setTimeout(pushCloud, 2500);
  }
}

// Сохраняем сразу при сворачивании приложения
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') {
    idbSet(IDB_KEY, data).catch(() => {});
    if (tg.cloudAvailable && cloudTimer) {
      clearTimeout(cloudTimer);
      pushCloud();
    }
  }
});

let lastChunks: string[] = [];
let pushing = false;
let pushAgain = false;

async function pushCloud() {
  cloudTimer = undefined;
  if (pushing) {
    pushAgain = true;
    return;
  }
  pushing = true;
  setSync('syncing');
  try {
    const json = JSON.stringify(data);
    const chunks: string[] = [];
    for (let i = 0; i < json.length; i += CHUNK) chunks.push(json.slice(i, i + CHUNK));
    if (chunks.length > 1000) throw new Error('Слишком много данных для CloudStorage');
    // пишем только изменившиеся куски
    const writes: Promise<void>[] = [];
    chunks.forEach((c, i) => {
      if (lastChunks[i] !== c) writes.push(cloud.setItem('c' + i, c));
    });
    await Promise.all(writes);
    await cloud.setItem(META, JSON.stringify({ ts: data.ts, n: chunks.length }));
    if (lastChunks.length > chunks.length) {
      const stale = [];
      for (let i = chunks.length; i < lastChunks.length; i++) stale.push('c' + i);
      await cloud.removeItems(stale);
    }
    lastChunks = chunks;
    setSync('synced');
  } catch (e) {
    console.error('Cloud push', e);
    setSync('error');
  } finally {
    pushing = false;
    if (pushAgain) {
      pushAgain = false;
      pushCloud();
    }
  }
}

async function pullCloud(): Promise<{ ts: number; data: AppData | null; chunks: string[] }> {
  const metaRaw = (await cloud.getItems([META]))[META];
  if (!metaRaw) return { ts: 0, data: null, chunks: [] };
  const meta = JSON.parse(metaRaw) as { ts: number; n: number };
  const keys = Array.from({ length: meta.n }, (_, i) => 'c' + i);
  const chunks: string[] = [];
  for (let i = 0; i < keys.length; i += 50) {
    const part = await cloud.getItems(keys.slice(i, i + 50));
    keys.slice(i, i + 50).forEach((k) => chunks.push(part[k] ?? ''));
  }
  return { ts: meta.ts, data: JSON.parse(chunks.join('')), chunks };
}

/** Загрузка при старте: локальные данные + сверка с облаком (побеждает более свежая версия). */
export async function initStore() {
  try {
    const local = await idbGet<AppData>(IDB_KEY);
    if (local) data = normalize(local);
  } catch (e) {
    console.error('IDB load', e);
  }
  emit();
  if (!tg.cloudAvailable) return;
  setSync('syncing');
  try {
    const remote = await pullCloud();
    lastChunks = remote.chunks;
    if (remote.data && remote.ts > data.ts) {
      data = normalize(remote.data);
      emit();
      await idbSet(IDB_KEY, data);
      setSync('synced');
    } else if (data.ts > remote.ts) {
      await pushCloud();
    } else setSync('synced');
  } catch (e) {
    console.error('Cloud pull', e);
    setSync('error');
  }
}

export function forceSync() {
  if (tg.cloudAvailable) pushCloud();
}

// ── Экспорт / импорт ──
export function exportJson(): string {
  return JSON.stringify(data, null, 1);
}

export function importJson(text: string) {
  const parsed = JSON.parse(text) as AppData;
  if (!parsed || !Array.isArray(parsed.workouts)) throw new Error('Неверный формат файла');
  data = normalize({ ...parsed, ts: Date.now() });
  emit();
  scheduleSave();
}

export function resetAll() {
  data = { ...emptyData(), ts: Date.now() };
  emit();
  scheduleSave();
}
