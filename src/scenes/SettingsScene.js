// SettingsScene.js — Settings menu
import { pushScene, State, ctx as gctx } from '../main.js';
import { Renderer } from '../engine/Renderer.js';

const ACCENT = '#ff66aa';

export class SettingsScene {
  constructor() {
    this.renderer = new Renderer(gctx);
    this._t = 0;
    this._items = [
      {
        key: 'volume',
        label: 'Master Volume',
        type: 'slider',
        min: 0, max: 1, step: 0.05,
      },
      {
        key: 'sfxVolume',
        label: 'SFX Volume',
        type: 'slider',
        min: 0, max: 1, step: 0.05,
      },
      {
        key: 'offset',
        label: 'Audio Offset (ms)',
        type: 'slider',
        min: -200, max: 200, step: 5,
      },
      {
        key: 'showFPS',
        label: 'Show FPS',
        type: 'toggle',
      },
      {
        key: 'hitAnimations',
        label: 'Hit Animations',
        type: 'toggle',
      },
    ];
    this._dragging = null;
  }

  update(dt) {
    this._t += dt;
    this.renderer.update(dt);

    const ctx = gctx;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const mx = window.__input?.pos.x ?? -999;
    const my = window.__input?.pos.y ?? -999;
    const justDown = window.__input?.justDown ?? false;
    const down     = window.__input?.down ?? false;

    // Back button
    if (justDown && mx >= 20 && mx <= 120 && my >= 20 && my <= 60) {
      pushScene('menu'); return;
    }

    const itemY = (i) => H * 0.22 + i * 74;

    this._items.forEach((item, i) => {
      const y = itemY(i);
      if (item.type === 'slider') {
        const sx = W * 0.55, sw = W * 0.3, sy = y + 10;
        if (justDown && mx >= sx && mx <= sx+sw && Math.abs(my - sy) < 20) {
          this._dragging = i;
        }
        if (this._dragging === i && down) {
          const ratio = Math.max(0, Math.min(1, (mx - sx) / sw));
          const val   = item.min + ratio * (item.max - item.min);
          const snapped = Math.round(val / item.step) * item.step;
          State.settings[item.key] = parseFloat(snapped.toFixed(4));
        }
        if (!down) this._dragging = null;
      } else if (item.type === 'toggle') {
        const tx = W * 0.7, tw = 64, th = 32;
        if (justDown && mx >= tx && mx <= tx+tw && my >= y-th/2 && my <= y+th/2) {
          State.settings[item.key] = !State.settings[item.key];
        }
      }
    });
  }

  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;

    // BG
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.5);
    grad.addColorStop(0, '#110820');
    grad.addColorStop(1, '#0a0a0f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Back button
    ctx.save();
    this.renderer.roundRect(ctx, 20, 20, 100, 40, 8, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)');
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(H*0.027)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('← BACK', 70, 45);
    ctx.restore();

    // Title
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.floor(H*0.055)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('Settings', W * 0.05, H * 0.14);

    // Items
    this._items.forEach((item, i) => {
      const y = H * 0.22 + i * 74;
      const val = State.settings[item.key];

      ctx.font = `${Math.floor(H*0.03)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'left';
      ctx.fillText(item.label, W * 0.05, y + 8);

      if (item.type === 'slider') {
        const sx = W * 0.55, sw = W * 0.3, sy = y + 10;
        // Track
        ctx.beginPath();
        ctx.rect(sx, sy - 3, sw, 6);
        ctx.fillStyle = 'rgba(255,255,255,0.15)';
        ctx.fill();
        // Fill
        const ratio = (val - item.min) / (item.max - item.min);
        ctx.beginPath();
        ctx.rect(sx, sy - 3, sw * ratio, 6);
        ctx.fillStyle = ACCENT;
        ctx.fill();
        // Thumb
        ctx.beginPath();
        ctx.arc(sx + sw * ratio, sy, 9, 0, Math.PI*2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        // Value label
        ctx.textAlign = 'left';
        ctx.font = `${Math.floor(H*0.025)}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = ACCENT;
        const display = item.key === 'offset' ? `${Math.round(val)}ms`
          : `${Math.round(val * 100)}%`;
        ctx.fillText(display, sx + sw + 16, y + 14);
      } else if (item.type === 'toggle') {
        const tx = W * 0.7, tw = 64, th = 32;
        // Track
        this.renderer.roundRect(ctx, tx, y - th/2, tw, th, th/2,
          val ? 'rgba(255,100,180,0.4)' : 'rgba(255,255,255,0.1)',
          val ? ACCENT : 'rgba(255,255,255,0.2)'
        );
        // Thumb
        ctx.beginPath();
        const knobX = val ? tx + tw - th/2 : tx + th/2;
        ctx.arc(knobX, y, th/2 - 4, 0, Math.PI*2);
        ctx.fillStyle = val ? '#fff' : 'rgba(255,255,255,0.5)';
        ctx.fill();
      }
    });

    // Cursor
    const mx = window.__input?.pos.x ?? -999;
    const my = window.__input?.pos.y ?? -999;
    ctx.beginPath(); ctx.arc(mx, my, 6, 0, Math.PI*2);
    ctx.fillStyle = ACCENT; ctx.fill();
    ctx.beginPath(); ctx.arc(mx, my, 2.5, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
  }
}
