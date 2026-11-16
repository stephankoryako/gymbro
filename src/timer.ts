import { useSyncExternalStore } from 'react';
import { getData } from './store';
import { tg } from './tg';

// Таймер хранит время окончания, поэтому корректно работает после сворачивания приложения.
interface TimerState {
  endAt: number | null;
  duration: number;
  label: string;
  finished: boolean;
}

const LS = 'gymbro-timer';
let state: TimerState = load();
const listeners = new Set<() => void>();

function load(): TimerState {
  try {
    const s = JSON.parse(localStorage.getItem(LS) || 'null');
    if (s && s.endAt && s.endAt > Date.now()) return s;
  } catch {
    /* ignore */
  }
  return { endAt: null, duration: 0, label: '', finished: false };
}

function set(p: Partial<TimerState>) {
  state = { ...state, ...p };
  try {
    localStorage.setItem(LS, JSON.stringify(state));
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

export function useTimer() {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
  );
}

export function startRest(sec: number, label = '') {
  unlockAudio();
  set({ endAt: Date.now() + sec * 1000, duration: sec, label, finished: false });
}

export function addRest(sec: number) {
  if (!state.endAt) return;
  const endAt = Math.max(Date.now() + 1000, state.endAt + sec * 1000);
  set({ endAt, duration: Math.max(1, state.duration + sec) });
}

export function stopRest() {
  set({ endAt: null, finished: false });
}

export function dismissFinished() {
  set({ finished: false });
}

/** Вызывается периодически из компонента-таймера */
export function tickTimer() {
  if (state.endAt && Date.now() >= state.endAt) {
    set({ endAt: null, finished: true });
    alarm();
  }
}

// ── Сигнал ──
let ctx: AudioContext | null = null;
function unlockAudio() {
  try {
    if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
  } catch {
    /* нет аудио */
  }
}

function beep(t: number, freq: number) {
  if (!ctx) return;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.frequency.value = freq;
  o.type = 'sine';
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.4, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.25);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.3);
}

function alarm() {
  const s = getData().settings;
  if (s.sound && ctx) {
    const t = ctx.currentTime;
    beep(t, 880);
    beep(t + 0.35, 880);
    beep(t + 0.7, 1320);
  }
  if (s.vibrate) {
    tg.haptic('success');
    setTimeout(() => tg.haptic('heavy'), 300);
    setTimeout(() => tg.haptic('heavy'), 600);
    try {
      navigator.vibrate?.([200, 100, 200, 100, 300]);
    } catch {
      /* ignore */
    }
  }
}
