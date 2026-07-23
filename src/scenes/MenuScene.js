// MenuScene.js — Main Menu
import { pushScene, ctx as gctx } from '../main.js';
import { Renderer } from '../engine/Renderer.js';

const LOGO_COLOR  = '#ff66aa';
const BG_DARK     = '#0a0a0f';

export class MenuScene {
  constructor() {
    this.renderer = new Renderer(gctx);
    this._t = 0;
    this._buttons = [
      { label: 'PLAY',     action: () => pushScene('select') },
      { label: 'SETTINGS', action: () => pushScene('settings') },
    ];
    this._hovered = -1;
  }

  update(dt) {
    this._t += dt;
    this.renderer.update(dt);

    const ctx = gctx;
    const mx = window.__input?.pos.x ?? -999;
    const my = window.__input?.pos.y ?? -999;
    this._hovered = -1;
    const W = ctx.canvas.width, H = ctx.canvas.height;

    this._buttons.forEach((btn, i) => {
      const bx = W/2 - 140, by = H/2 + 30 + i * 70, bw = 280, bh = 55;
      if (mx >= bx && mx <= bx+bw && my >= by && my <= by+bh) {
        this._hovered = i;
        if (window.__input?.justDown) btn.action();
      }
    });
  }

  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;

    // Background gradient
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)/1.5);
    grad.addColorStop(0, '#1a0a2e');
    grad.addColorStop(1, BG_DARK);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Animated rings
    for (let r = 0; r < 4; r++) {
      const phase  = this._t * 0.4 + r * 0.8;
      const radius = 80 + r * 90 + Math.sin(phase) * 10;
      ctx.beginPath();
      ctx.arc(W/2, H/2 - 60, radius, 0, Math.PI*2);
      ctx.strokeStyle = `rgba(255,100,180,${0.04 + r * 0.02})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    // Logo
    ctx.save();
    ctx.textAlign = 'center';

    // Glow
    ctx.shadowColor = LOGO_COLOR;
    ctx.shadowBlur  = 30 + Math.sin(this._t * 2) * 10;

    ctx.font = `bold ${Math.floor(H * 0.13)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('Slide', W/2 - 80, H/2 - 60);

    ctx.fillStyle = LOGO_COLOR;
    ctx.fillText('Beat', W/2 + 90, H/2 - 60);

    ctx.shadowBlur = 0;
    ctx.font = `${Math.floor(H * 0.033)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.45)';
    ctx.fillText('Slide to the rhythm', W/2, H/2 - 10);
    ctx.restore();

    // Buttons
    this._buttons.forEach((btn, i) => {
      const bx = W/2 - 140, by = H/2 + 30 + i * 70, bw = 280, bh = 55;
      const hot = this._hovered === i;

      ctx.save();
      if (hot) { ctx.shadowColor = LOGO_COLOR; ctx.shadowBlur = 20; }
      this.renderer.roundRect(ctx, bx, by, bw, bh, 12,
        hot ? 'rgba(255,100,180,0.25)' : 'rgba(255,255,255,0.07)',
        hot ? LOGO_COLOR : 'rgba(255,255,255,0.15)'
      );
      ctx.lineWidth = hot ? 2 : 1;
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.floor(H * 0.03)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = hot ? '#fff' : 'rgba(255,255,255,0.7)';
      ctx.fillText(btn.label, W/2, by + bh/2 + 8);
      ctx.restore();
    });

    // Footer
    ctx.textAlign = 'center';
    ctx.font = `${Math.floor(H * 0.022)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.fillText('v0.1.0 — BrainLogic AI', W/2, H - 18);

    // Custom cursor dot
    this._drawCursor(ctx);
  }

  _drawCursor(ctx) {
    const mx = window.__input?.pos.x ?? -999;
    const my = window.__input?.pos.y ?? -999;
    ctx.beginPath();
    ctx.arc(mx, my, 7, 0, Math.PI*2);
    ctx.fillStyle = LOGO_COLOR;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(mx, my, 3, 0, Math.PI*2);
    ctx.fillStyle = '#fff';
    ctx.fill();
  }
}
