// main.js — SlideBeat boot & scene router
import { MenuScene }     from './scenes/MenuScene.js';
import { SelectScene }   from './scenes/SelectScene.js';
import { GameScene }     from './scenes/GameScene.js';
import { SettingsScene } from './scenes/SettingsScene.js';
import { InputHandler }  from './engine/InputHandler.js';
import { AudioEngine }   from './engine/AudioEngine.js';

export const canvas = document.getElementById('game');
export const ctx    = canvas.getContext('2d');

// ── Responsive canvas ──────────────────────────────────────────────────────
function resize() {
  const W = window.innerWidth, H = window.innerHeight;
  const ratio = Math.min(W / 1280, H / 720);
  canvas.width  = Math.floor(1280 * ratio);
  canvas.height = Math.floor(720  * ratio);
  canvas.style.width  = canvas.width  + 'px';
  canvas.style.height = canvas.height + 'px';
}
window.addEventListener('resize', resize);
resize();

// ── Global state ────────────────────────────────────────────────────────────
export const State = {
  scene:    null,
  settings: {
    volume:          1.0,
    sfxVolume:       0.8,
    offset:          0,      // ms audio offset
    showFPS:         false,
    hitAnimations:   true,
  },
  selectedLevel: null,
};

export const audio  = new AudioEngine();
export const input  = new InputHandler(canvas);

// Expose input globally so scenes can access it without circular imports
window.__input = input;

// ── Scene manager ───────────────────────────────────────────────────────────
export function pushScene(name, ...args) {
  if (State.scene) State.scene.destroy?.();
  switch (name) {
    case 'menu':     State.scene = new MenuScene(...args);     break;
    case 'select':   State.scene = new SelectScene(...args);   break;
    case 'game':     State.scene = new GameScene(...args);     break;
    case 'settings': State.scene = new SettingsScene(...args); break;
  }
}

// ── Main loop ───────────────────────────────────────────────────────────────
let last = 0;
function loop(ts) {
  const dt = Math.min((ts - last) / 1000, 0.05);
  last = ts;

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  State.scene?.update(dt);
  State.scene?.draw(ctx);
  input.endFrame();

  requestAnimationFrame(loop);
}

// ── Boot ────────────────────────────────────────────────────────────────────
pushScene('menu');
requestAnimationFrame(loop);
