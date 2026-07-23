// SelectScene.js — Level selection
import { pushScene, ctx as gctx } from '../main.js';
import { LevelLoader } from '../utils/LevelLoader.js';
import { Renderer }    from '../engine/Renderer.js';

const ACCENT = '#ff66aa';

export class SelectScene {
  constructor() {
    this.renderer  = new Renderer(gctx);
    this._levels   = [];
    this._selected = 0;
    this._coverImgs = {};
    this._iconImgs  = {};
    this._loaded   = false;
    this._t        = 0;
    this._scroll   = 0;   // card list scroll offset
    this._targetScroll = 0;
    LevelLoader.scanLevels('levels').then(levels => {
      this._levels = levels;
      this._loaded = true;
      // Preload cover & icon images
      levels.forEach((lv, i) => {
        const img = new Image(); img.src = lv.coverUrl;
        this._coverImgs[i] = img;
        const ico = new Image(); ico.src = lv.iconUrl;
        this._iconImgs[i]  = ico;
      });
    });
  }

  update(dt) {
    this._t += dt;
    this.renderer.update(dt);
    this._scroll += (this._targetScroll - this._scroll) * Math.min(1, dt * 14);

    const ctx = gctx;
    const W = ctx.canvas.width, H = ctx.canvas.height;
    const mx = window.__input?.pos.x ?? -999;
    const my = window.__input?.pos.y ?? -999;

    if (!this._loaded) return;

    // Scroll wheel / keyboard (captured externally)
    if (window.__input?.justDown) {
      // Check card clicks
      this._levels.forEach((lv, i) => {
        const { cx, cy } = this._cardPos(i, W, H);
        if (mx >= cx && mx <= cx + 320 && my >= cy - 90 && my <= cy + 90) {
          if (this._selected === i) {
            // Play
            import('../main.js').then(m => {
              m.State.selectedLevel = lv;
              pushScene('game', lv);
            });
          } else {
            this._selected = i;
            this._targetScroll = i * 100;
          }
        }
      });
      // Back button
      if (mx >= 20 && mx <= 120 && my >= 20 && my <= 60) pushScene('menu');
    }
  }

  _cardPos(i, W, H) {
    const CARD_H = 100;
    const listTop = H * 0.2;
    return {
      cx: W * 0.55,
      cy: listTop + i * (CARD_H + 16) - this._scroll,
    };
  }

  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;

    // Background — cover art of selected level
    const coverImg = this._coverImgs[this._selected];
    if (coverImg?.complete && coverImg.naturalWidth) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.drawImage(coverImg, 0, 0, W, H);
      ctx.restore();
    }
    // Dark overlay
    ctx.fillStyle = 'rgba(10,10,15,0.75)';
    ctx.fillRect(0, 0, W, H);

    // Back button
    ctx.save();
    this.renderer.roundRect(ctx, 20, 20, 100, 40, 8, 'rgba(255,255,255,0.08)', 'rgba(255,255,255,0.2)');
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(H*0.027)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('← BACK', 70, 45);
    ctx.restore();

    if (!this._loaded || this._levels.length === 0) {
      ctx.textAlign = 'center';
      ctx.font = `${Math.floor(H*0.04)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText(this._loaded ? 'No levels found.' : 'Loading levels…', W/2, H/2);
      return;
    }

    // Title
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.floor(H*0.05)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('Select Level', W * 0.04, H * 0.13);

    // Level info panel (left side) for selected
    const sel = this._levels[this._selected];
    if (sel) this._drawInfoPanel(ctx, sel, W, H);

    // Cards list (right side)
    ctx.save();
    ctx.beginPath();
    ctx.rect(W * 0.5, H * 0.12, W * 0.48, H * 0.82);
    ctx.clip();

    this._levels.forEach((lv, i) => {
      const { cx, cy } = this._cardPos(i, W, H);
      const isSelected = i === this._selected;
      const CARD_H = 90, CARD_W = 320;

      ctx.save();
      if (isSelected) { ctx.shadowColor = ACCENT; ctx.shadowBlur = 18; }
      this.renderer.roundRect(ctx, cx, cy - CARD_H/2, CARD_W, CARD_H, 12,
        isSelected ? 'rgba(255,100,180,0.18)' : 'rgba(255,255,255,0.06)',
        isSelected ? ACCENT : 'rgba(255,255,255,0.12)'
      );

      // Icon
      const ico = this._iconImgs[i];
      if (ico?.complete && ico.naturalWidth) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(cx + 38, cy, 28, 0, Math.PI*2);
        ctx.clip();
        ctx.drawImage(ico, cx+10, cy-28, 56, 56);
        ctx.restore();
      } else {
        ctx.beginPath();
        ctx.arc(cx + 38, cy, 26, 0, Math.PI*2);
        ctx.fillStyle = 'rgba(255,100,180,0.3)';
        ctx.fill();
      }

      ctx.textAlign = 'left';
      ctx.font = `bold ${Math.floor(H*0.028)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = isSelected ? '#fff' : 'rgba(255,255,255,0.75)';
      ctx.fillText(lv.info.title ?? lv.folder, cx + 76, cy - 12);

      ctx.font = `${Math.floor(H*0.022)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = isSelected ? ACCENT : 'rgba(255,255,255,0.45)';
      ctx.fillText(lv.info.artist ?? '', cx + 76, cy + 12);

      ctx.font = `${Math.floor(H*0.020)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.4)';
      ctx.fillText(lv.info.difficulty ?? '', cx + 76, cy + 34);

      if (isSelected) {
        ctx.textAlign = 'right';
        ctx.font = `bold ${Math.floor(H*0.025)}px 'Segoe UI', sans-serif`;
        ctx.fillStyle = '#fff';
        ctx.fillText('▶ PLAY', cx + CARD_W - 16, cy + 8);
      }
      ctx.restore();
    });
    ctx.restore();
  }

  _drawInfoPanel(ctx, lv, W, H) {
    const px = W * 0.04, pw = W * 0.42, py = H * 0.2, ph = H * 0.65;
    this.renderer.roundRect(ctx, px, py, pw, ph, 16, 'rgba(0,0,0,0.45)', 'rgba(255,255,255,0.08)');

    // Cover
    const cover = this._coverImgs[this._selected];
    if (cover?.complete && cover.naturalWidth) {
      ctx.save();
      ctx.beginPath();
      this.renderer._manualRoundRect(ctx, px+12, py+12, pw-24, (ph*0.45), 10);
      ctx.clip();
      ctx.drawImage(cover, px+12, py+12, pw-24, ph*0.45);
      ctx.restore();
    }

    const ty = py + ph * 0.5;
    ctx.textAlign = 'left';

    ctx.font = `bold ${Math.floor(H*0.038)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText(lv.info.title ?? '—', px+16, ty);

    ctx.font = `${Math.floor(H*0.026)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = ACCENT;
    ctx.fillText(lv.info.artist ?? '', px+16, ty + Math.floor(H*0.042));

    ctx.font = `${Math.floor(H*0.022)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.55)';
    ctx.fillText(`Mapped by: ${lv.info.mapper ?? '?'}`, px+16, ty + Math.floor(H*0.075));
    ctx.fillText(`Difficulty: ${lv.info.difficulty ?? '?'}  •  BPM: ${lv.info.bpm ?? '?'}`, px+16, ty + Math.floor(H*0.105));

    if (lv.info.tags?.length) {
      ctx.fillStyle = 'rgba(255,100,180,0.7)';
      ctx.fillText(lv.info.tags.join('  •  '), px+16, ty + Math.floor(H*0.135));
    }
  }
}
