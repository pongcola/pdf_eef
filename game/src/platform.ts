import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

let vibrationOn = true;
let lastBuzz = 0;

export function setVibration(on: boolean): void {
  vibrationOn = on;
}

export function buzz(strength: 'light' | 'medium' | 'heavy' = 'light'): void {
  if (!vibrationOn) return;
  const now = performance.now();
  if (now - lastBuzz < 60) return;
  lastBuzz = now;
  if (Capacitor.isNativePlatform()) {
    const style = strength === 'heavy' ? ImpactStyle.Heavy : strength === 'medium' ? ImpactStyle.Medium : ImpactStyle.Light;
    void Haptics.impact({ style }).catch(() => {});
  } else if ('vibrate' in navigator) {
    navigator.vibrate(strength === 'heavy' ? 40 : strength === 'medium' ? 20 : 8);
  }
}

export interface PlatformHooks {
  onBack: () => void;
  onPause: () => void;
  onResume: () => void;
}

export function initPlatform(h: PlatformHooks): void {
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) h.onPause();
    else h.onResume();
  });
  if (Capacitor.isNativePlatform()) {
    void App.addListener('backButton', () => h.onBack());
    void App.addListener('pause', () => h.onPause());
    void App.addListener('resume', () => h.onResume());
  }
}

export function exitApp(): void {
  if (Capacitor.isNativePlatform()) void App.exitApp();
}
