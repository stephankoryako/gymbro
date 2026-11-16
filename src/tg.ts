// Тонкая обёртка над Telegram WebApp API с безопасными фолбэками для обычного браузера.
/* eslint-disable @typescript-eslint/no-explicit-any */

const W: any = (window as any).Telegram?.WebApp;

export const tg = {
  raw: W,
  inTelegram: !!W && !!W.initData,
  ready() {
    if (!W) return;
    W.ready();
    W.expand();
    try {
      W.disableVerticalSwipes?.();
    } catch {
      /* старые клиенты */
    }
    applyTheme();
    W.onEvent?.('themeChanged', applyTheme);
  },
  haptic(kind: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'select' = 'light') {
    const h = W?.HapticFeedback;
    if (!h || !W.isVersionAtLeast?.('6.1')) return;
    if (kind === 'select') h.selectionChanged();
    else if (kind === 'success' || kind === 'warning' || kind === 'error') h.notificationOccurred(kind);
    else h.impactOccurred(kind);
  },
  openLink(url: string) {
    if (W?.openLink) W.openLink(url);
    else window.open(url, '_blank');
  },
  confirm(msg: string): Promise<boolean> {
    return new Promise((res) => {
      if (W?.showConfirm && W.isVersionAtLeast?.('6.2') && tg.inTelegram) W.showConfirm(msg, (ok: boolean) => res(ok));
      else res(window.confirm(msg));
    });
  },
  alert(msg: string) {
    if (W?.showAlert && W.isVersionAtLeast?.('6.2') && tg.inTelegram) W.showAlert(msg);
    else window.alert(msg);
  },
  backButton(handler: (() => void) | null) {
    const b = W?.BackButton;
    if (!b || !W.isVersionAtLeast?.('6.1')) return;
    b.offClick?.(backHandler);
    backHandler = handler;
    if (handler) {
      b.onClick(handler);
      b.show();
    } else b.hide();
  },
  userName(): string | null {
    return W?.initDataUnsafe?.user?.first_name ?? null;
  },
  get cloudAvailable(): boolean {
    return !!W?.CloudStorage && tg.inTelegram && !!W.isVersionAtLeast?.('6.9');
  },
};

let backHandler: (() => void) | null = null;

function applyTheme() {
  const root = document.documentElement;
  const isDark = W?.colorScheme === 'dark';
  root.dataset.theme = W ? (isDark ? 'dark' : 'light') : '';
  const p = W?.themeParams ?? {};
  const map: Record<string, string> = {
    bg_color: '--tg-bg',
    secondary_bg_color: '--tg-bg2',
    text_color: '--tg-text',
    hint_color: '--tg-hint',
    link_color: '--tg-link',
    button_color: '--tg-btn',
    button_text_color: '--tg-btn-text',
    section_bg_color: '--tg-section',
    destructive_text_color: '--tg-danger',
  };
  for (const [k, v] of Object.entries(map)) {
    if (p[k]) root.style.setProperty(v, p[k]);
  }
  try {
    if (W?.isVersionAtLeast?.('6.1')) {
      W.setHeaderColor?.('secondary_bg_color');
      W.setBackgroundColor?.('secondary_bg_color');
    }
  } catch {
    /* ignore */
  }
}

// ── CloudStorage (промисы) ──
export const cloud = {
  getKeys(): Promise<string[]> {
    return new Promise((res, rej) => W.CloudStorage.getKeys((e: any, k: string[]) => (e ? rej(e) : res(k ?? []))));
  },
  getItems(keys: string[]): Promise<Record<string, string>> {
    if (!keys.length) return Promise.resolve({});
    return new Promise((res, rej) => W.CloudStorage.getItems(keys, (e: any, v: Record<string, string>) => (e ? rej(e) : res(v ?? {}))));
  },
  setItem(key: string, value: string): Promise<void> {
    return new Promise((res, rej) => W.CloudStorage.setItem(key, value, (e: any) => (e ? rej(e) : res())));
  },
  removeItems(keys: string[]): Promise<void> {
    if (!keys.length) return Promise.resolve();
    return new Promise((res, rej) => W.CloudStorage.removeItems(keys, (e: any) => (e ? rej(e) : res())));
  },
};
