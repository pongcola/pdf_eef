import '@fontsource/kanit/400.css';
import '@fontsource/kanit/600.css';
import '@fontsource/kanit/800.css';
import './ui/styles.css';
import { Game } from './game/game.ts';
import { initPlatform } from './platform.ts';
import { UI } from './ui/ui.ts';

async function boot(): Promise<void> {
  // รอฟอนต์ก่อน เพื่อให้ตัวเลขบนประตูใช้ฟอนต์ถูกต้อง
  try {
    await Promise.race([
      Promise.all([document.fonts.load('800 64px Kanit'), document.fonts.load('600 20px Kanit')]),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  } catch {
    /* ใช้ฟอนต์สำรอง */
  }

  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const root = document.getElementById('ui') as HTMLElement;
  let game: Game | null = null;
  const ui = new UI(root, {
    play: () => game?.play(),
    upgrade: (id) => game?.buyUpgrade(id),
    pause: () => game?.pause(),
    resume: () => game?.resume(),
    quit: () => game?.quitToMenu(),
    menu: () => game?.quitToMenu(),
    toggle: (k) => game?.toggleSetting(k),
    reset: () => game?.resetProgress(),
    wheel: (m) => game?.claimWheel(m) ?? 0,
    meta: (id) => game?.buyMeta(id),
    timeline: (j) => game!.timelineData(j),
  });
  game = new Game(canvas, ui);
  ui.renderSettings(game.save.settings);

  initPlatform({
    onBack: () => game?.onBack(),
    onPause: () => game?.onAppPause(),
    onResume: () => game?.onAppResume(),
  });

  // สำหรับทดสอบอัตโนมัติ
  (window as unknown as { __game: Game }).__game = game;

  let last = performance.now();
  const loop = (now: number) => {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    game!.update(dt);
    requestAnimationFrame(loop);
  };
  requestAnimationFrame(loop);
  document.getElementById('boot')?.remove();
}

void boot();
