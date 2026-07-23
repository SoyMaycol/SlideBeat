// GameScene.js — Core gameplay
import { pushScene, State, audio, input, ctx as gctx } from '../main.js';
import { Renderer }      from '../engine/Renderer.js';
import { NoteEngine }    from '../engine/NoteEngine.js';
import { EventEngine }   from '../engine/EventEngine.js';
import { LevelLoader }   from '../utils/LevelLoader.js';

const ACCENT    = '#ff66aa';
const DIR_ANGLE = { up: -Math.PI/2, down: Math.PI/2, left: Math.PI, right: 0 };
const DIR_VEC   = {
  up:    { x:  0, y: -1 },
  down:  { x:  0, y:  1 },
  left:  { x: -1, y:  0 },
  right: { x:  1, y:  0 },
};
const DIRECTIONS = ['up', 'down', 'left', 'right'];

// Colours per direction
const DIR_COLOR = {
  up:    '#66aaff',
  down:  '#ff6666',
  left:  '#66ffaa',
  right: '#ffcc44',
};

export class GameScene {
  constructor(levelMeta) {
    this.renderer = new Renderer(gctx);
    this._t       = 0;
    this._phase   = 'loading'; // loading | countdown | playing | result
    this._countdown = 3;
    this._countdownTimer = 0;

    // Arrow visual state (modified by SlideLua events)
    this._arrowState = {
      up:    { dx:0, dy:0, scale:1, angle:0, r:1, g:1, b:1, a:1 },
      down:  { dx:0, dy:0, scale:1, angle:0, r:1, g:1, b:1, a:1 },
      left:  { dx:0, dy:0, scale:1, angle:0, r:1, g:1, b:1, a:1 },
      right: { dx:0, dy:0, scale:1, angle:0, r:1, g:1, b:1, a:1 },
    };

    // Slide detection
    this._holdStart    = null;  // { x, y } where hold began
    this._lastDetected = null;  // direction last registered to avoid spam
    this._SLIDE_THRESH = 55;    // px to count as a slide

    // Hit effects
    this._hitEffects = []; // { dir, result, x, y, life, maxLife }

    // FPS
    this._fps = 0;
    this._fpsAccum = 0;
    this._fpsCount = 0;

    // Pause
    this._paused = false;

    // Load
    this._load(levelMeta);
  }

  async _load(levelMeta) {
    const level = await LevelLoader.load(levelMeta.folder);
    this._info  = level.info;

    this._noteEngine  = new NoteEngine(level.notes, State.settings.offset);
    this._eventEngine = new EventEngine(
      level.events, level.scriptMap,
      this.renderer.cam, this._arrowState, level.info
    );

    audio.volume = State.settings.volume;
    await audio.load(level.musicUrl);

    this._phase = 'countdown';
    this._countdown = 3;
    this._countdownTimer = 0;
  }

  update(dt) {
    this._t += dt;

    // FPS counter
    this._fpsAccum += dt;
    this._fpsCount++;
    if (this._fpsAccum >= 0.5) {
      this._fps = Math.round(this._fpsCount / this._fpsAccum);
      this._fpsAccum = 0; this._fpsCount = 0;
    }

    this.renderer.update(dt);

    // Hit effect lifetimes
    this._hitEffects = this._hitEffects.filter(e => e.life > 0);
    this._hitEffects.forEach(e => e.life -= dt);

    if (this._phase === 'loading') return;

    // ── Pause toggle ────────────────────────────────────────────────────
    if (input.justDown) {
      const W = gctx.canvas.width, H = gctx.canvas.height;
      if (input.pos.x >= W - 60 && input.pos.y <= 60) {
        this._paused = !this._paused;
        if (this._paused) audio.stop();
        else audio.play(this._songTime);
      }
    }
    if (this._paused) return;

    // ── Countdown ───────────────────────────────────────────────────────
    if (this._phase === 'countdown') {
      this._countdownTimer += dt;
      if (this._countdownTimer >= 1) {
        this._countdown--;
        this._countdownTimer = 0;
        if (this._countdown <= 0) {
          this._phase = 'playing';
          this._songTime = 0;
          audio.play(0);
        }
      }
      return;
    }

    // ── Playing ─────────────────────────────────────────────────────────
    if (this._phase === 'playing') {
      this._songTime = audio.currentTime;
      this._noteEngine.update(this._songTime);
      this._eventEngine.update(this._songTime, dt);

      this._detectSlide();

      if (this._noteEngine.isFinished && !audio.playing) {
        this._phase = 'result';
        audio.stop();
      }
    }
  }

  _detectSlide() {
    const pos = input.pos;

    if (input.justDown) {
      this._holdStart    = { ...pos };
      this._lastDetected = null;
    }

    if (!input.down) {
      this._holdStart    = null;
      this._lastDetected = null;
      return;
    }

    if (!this._holdStart) return;

    const dx = pos.x - this._holdStart.x;
    const dy = pos.y - this._holdStart.y;
    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist < this._SLIDE_THRESH) return;

    // Determine dominant direction
    let dir;
    if (Math.abs(dx) > Math.abs(dy)) {
      dir = dx > 0 ? 'right' : 'left';
    } else {
      dir = dy > 0 ? 'down' : 'up';
    }

    if (dir === this._lastDetected) return;
    this._lastDetected = dir;

    // Reset slide origin so next slide can be detected
    this._holdStart = { ...pos };

    // Try hit
    const result = this._noteEngine.tryHit(dir, this._songTime ?? 0);
    if (result) {
      const W = gctx.canvas.width, H = gctx.canvas.height;
      const cx = W/2, cy = H/2;
      const ang = DIR_ANGLE[dir];
      const R   = Math.min(W,H) * 0.22;
      this._hitEffects.push({
        dir, result,
        x: cx + Math.cos(ang) * R,
        y: cy + Math.sin(ang) * R,
        life: 0.6, maxLife: 0.6,
      });
    }
  }

  draw(ctx) {
    const W = ctx.canvas.width, H = ctx.canvas.height;

    if (this._phase === 'loading') {
      ctx.fillStyle = '#0a0a0f';
      ctx.fillRect(0,0,W,H);
      ctx.textAlign = 'center';
      ctx.font = `${Math.floor(H*0.05)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillText('Loading…', W/2, H/2);
      return;
    }

    // Background
    const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, Math.max(W,H)*0.7);
    grad.addColorStop(0, '#12082a');
    grad.addColorStop(1, '#050508');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Camera transform
    this.renderer.applyCameraTransform(ctx, W, H);

    const cx = W/2, cy = H/2;
    const R  = Math.min(W,H) * 0.22;

    // Guide lines from center to each arrow
    DIRECTIONS.forEach(dir => {
      const ang = DIR_ANGLE[dir];
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(ang)*R, cy + Math.sin(ang)*R);
      ctx.strokeStyle = `rgba(255,255,255,0.07)`;
      ctx.lineWidth = 2;
      ctx.stroke();
    });

    // Outer ring
    ctx.beginPath();
    ctx.arc(cx, cy, R + 18, 0, Math.PI*2);
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Arrows
    DIRECTIONS.forEach(dir => {
      const ang  = DIR_ANGLE[dir];
      const st   = this._arrowState[dir];
      const ax   = cx + Math.cos(ang)*R + st.dx;
      const ay   = cy + Math.sin(ang)*R + st.dy;
      const active = this._noteEngine?.active?.direction === dir;
      this._drawArrow(ctx, dir, ax, ay, ang, active, st);
    });

    // Hit effects
    this._hitEffects.forEach(e => {
      const prog = 1 - e.life / e.maxLife;
      const alpha = 1 - prog;
      const scale = 1 + prog * 1.4;
      const label = e.result === 'perfect' ? 'PERFECT!' : e.result === 'good' ? 'GOOD' : 'MISS';
      const color = e.result === 'perfect' ? '#ffdd44' : e.result === 'good' ? '#66ffaa' : '#ff4444';

      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.floor(H*0.04 * scale)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 20;
      ctx.fillText(label, e.x, e.y - prog * 40);
      ctx.restore();
    });

    // Center ring (hold indicator)
    const holding = input.down;
    const pulseR  = 26 + Math.sin(this._t * 6) * (holding ? 4 : 0);
    ctx.beginPath();
    ctx.arc(cx, cy, pulseR, 0, Math.PI*2);
    ctx.fillStyle   = holding ? 'rgba(255,100,180,0.35)' : 'rgba(255,255,255,0.12)';
    ctx.strokeStyle = holding ? ACCENT : 'rgba(255,255,255,0.4)';
    ctx.lineWidth   = 3;
    ctx.fill();
    ctx.stroke();

    // Center cross / icon
    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(H*0.028)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = holding ? '#fff' : 'rgba(255,255,255,0.5)';
    ctx.fillText('●', cx, cy + 9);

    this.renderer.restoreCameraTransform(ctx);

    // ── HUD ──────────────────────────────────────────────────────────────
    this._drawHUD(ctx, W, H);

    // ── Countdown overlay ────────────────────────────────────────────────
    if (this._phase === 'countdown') {
      ctx.fillStyle = 'rgba(0,0,0,0.55)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.floor(H*0.2)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.shadowColor = ACCENT; ctx.shadowBlur = 40;
      ctx.fillText(this._countdown, W/2, H/2 + Math.floor(H*0.07));
      ctx.shadowBlur = 0;
    }

    // ── Result screen ────────────────────────────────────────────────────
    if (this._phase === 'result') this._drawResult(ctx, W, H);

    // ── Pause overlay ─────────────────────────────────────────────────────
    if (this._paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)';
      ctx.fillRect(0, 0, W, H);
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.floor(H*0.1)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText('PAUSED', W/2, H/2);
      ctx.font = `${Math.floor(H*0.035)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = ACCENT;
      ctx.fillText('Click ▐▐ to resume', W/2, H/2 + Math.floor(H*0.08));
    }

    // Cursor
    const mx = input.pos.x, my = input.pos.y;
    ctx.beginPath(); ctx.arc(mx, my, 7, 0, Math.PI*2);
    ctx.fillStyle = ACCENT; ctx.fill();
    ctx.beginPath(); ctx.arc(mx, my, 3, 0, Math.PI*2);
    ctx.fillStyle = '#fff'; ctx.fill();
  }

  _drawArrow(ctx, dir, ax, ay, ang, active, st) {
    const S   = 38 * st.scale;
    const col = DIR_COLOR[dir];
    ctx.save();
    ctx.translate(ax, ay);
    ctx.rotate(ang + st.angle);

    if (active) {
      ctx.shadowColor = col;
      ctx.shadowBlur  = 30 + Math.sin(this._t * 8) * 8;
    }

    ctx.globalAlpha = st.a;

    // Background circle
    ctx.beginPath();
    ctx.arc(0, 0, S + 6, 0, Math.PI*2);
    ctx.fillStyle = active
      ? `rgba(${this._hexToRgb(col)},0.25)`
      : 'rgba(255,255,255,0.06)';
    ctx.fill();
    ctx.strokeStyle = active ? col : 'rgba(255,255,255,0.2)';
    ctx.lineWidth   = active ? 3 : 1.5;
    ctx.stroke();

    // Arrow shape (pointing right — rotated by ang)
    ctx.beginPath();
    ctx.moveTo(S * 0.7, 0);
    ctx.lineTo(-S * 0.4, -S * 0.55);
    ctx.lineTo(-S * 0.15, 0);
    ctx.lineTo(-S * 0.4, S * 0.55);
    ctx.closePath();
    ctx.fillStyle = active
      ? col
      : `rgba(${this._hexToRgb(col)},0.45)`;
    ctx.fill();

    ctx.restore();
  }

  _drawHUD(ctx, W, H) {
    const ne = this._noteEngine;

    // Score
    ctx.textAlign = 'left';
    ctx.font = `bold ${Math.floor(H*0.045)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.floor(ne?.score ?? 0).toLocaleString(), 20, 50);

    // Combo
    if ((ne?.combo ?? 0) > 1) {
      ctx.textAlign = 'left';
      ctx.font = `bold ${Math.floor(H*0.032)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = ACCENT;
      ctx.shadowColor = ACCENT; ctx.shadowBlur = 10;
      ctx.fillText(`${ne.combo}x`, 20, 88);
      ctx.shadowBlur = 0;
    }

    // Song title
    ctx.textAlign = 'right';
    ctx.font = `${Math.floor(H*0.025)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillText(this._info?.title ?? '', W - 20, 36);
    ctx.fillStyle = ACCENT;
    ctx.fillText(this._info?.artist ?? '', W - 20, 58);

    // Progress bar
    const prog = ne?.progress ?? 0;
    const bh = 4, bw = W * 0.6, bx = W * 0.2, by = H - 14;
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(bx, by, bw * prog, bh);

    // Pause button
    const px2 = W - 52, py2 = 12;
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.fillRect(px2, py2, 42, 36);
    ctx.fillStyle = '#fff';
    ctx.font = `bold ${Math.floor(H*0.03)}px 'Segoe UI', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(this._paused ? '▶' : '▐▐', px2 + 21, py2 + 25);

    // FPS
    if (State.settings.showFPS) {
      ctx.textAlign = 'left';
      ctx.font = `${Math.floor(H*0.022)}px monospace`;
      ctx.fillStyle = 'rgba(255,200,100,0.7)';
      ctx.fillText(`FPS: ${this._fps}`, 20, H - 22);
    }

    // Counts
    const ne2 = ne ?? { counts: { perfect:0, good:0, miss:0 } };
    ctx.textAlign = 'left';
    ctx.font = `${Math.floor(H*0.022)}px 'Segoe UI', sans-serif`;
    const counts = [
      { label:'PERFECT', val: ne2.counts.perfect, col:'#ffdd44' },
      { label:'GOOD',    val: ne2.counts.good,    col:'#66ffaa' },
      { label:'MISS',    val: ne2.counts.miss,     col:'#ff4444' },
    ];
    counts.forEach((c, i) => {
      ctx.fillStyle = c.col;
      ctx.fillText(`${c.label} ${c.val}`, 20, H - 60 + i * 20);
    });
  }

  _drawResult(ctx, W, H) {
    const ne = this._noteEngine;
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.fillRect(0, 0, W, H);

    const total  = (ne.counts.perfect + ne.counts.good + ne.counts.miss) || 1;
    const acc    = ((ne.counts.perfect * 100 + ne.counts.good * 50) / (total * 100)) * 100;
    const grade  = acc >= 98 ? 'SS' : acc >= 90 ? 'S' : acc >= 80 ? 'A'
                 : acc >= 70 ? 'B' : acc >= 60 ? 'C' : 'D';
    const gradeColor = acc >= 90 ? '#ffdd44' : acc >= 80 ? '#aaddff' : '#cccccc';

    ctx.textAlign = 'center';
    ctx.font = `bold ${Math.floor(H*0.08)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText('Results', W/2, H * 0.18);

    ctx.font = `bold ${Math.floor(H*0.18)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = gradeColor;
    ctx.shadowColor = gradeColor; ctx.shadowBlur = 40;
    ctx.fillText(grade, W/2, H * 0.45);
    ctx.shadowBlur = 0;

    ctx.font = `bold ${Math.floor(H*0.05)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = '#fff';
    ctx.fillText(Math.floor(ne.score).toLocaleString(), W/2, H * 0.57);

    ctx.font = `${Math.floor(H*0.03)}px 'Segoe UI', sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.6)';
    ctx.fillText(`Accuracy: ${acc.toFixed(2)}%   Max Combo: ${ne.maxCombo}`, W/2, H * 0.64);

    const stats = [
      { label:'PERFECT', val:ne.counts.perfect, col:'#ffdd44' },
      { label:'GOOD',    val:ne.counts.good,    col:'#66ffaa' },
      { label:'MISS',    val:ne.counts.miss,     col:'#ff4444' },
    ];
    stats.forEach((s, i) => {
      ctx.font = `bold ${Math.floor(H*0.033)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = s.col;
      ctx.fillText(`${s.label}  ${s.val}`, W/2, H * 0.72 + i * Math.floor(H*0.05));
    });

    // Buttons
    const btns = [
      { label: 'RETRY',    x: W/2 - 180, action: () => pushScene('game', State.selectedLevel) },
      { label: 'BACK',     x: W/2 + 60,  action: () => pushScene('select') },
    ];
    btns.forEach(btn => {
      const bx = btn.x, by = H * 0.9, bw = 120, bh = 46;
      const mx = input.pos.x, my = input.pos.y;
      const hot = mx >= bx && mx <= bx+bw && my >= by && my <= by+bh;
      ctx.save();
      if (hot) { ctx.shadowColor = ACCENT; ctx.shadowBlur = 18; }
      this.renderer.roundRect(ctx, bx, by, bw, bh, 10,
        hot ? 'rgba(255,100,180,0.25)' : 'rgba(255,255,255,0.08)',
        hot ? ACCENT : 'rgba(255,255,255,0.2)'
      );
      ctx.textAlign = 'center';
      ctx.font = `bold ${Math.floor(H*0.03)}px 'Segoe UI', sans-serif`;
      ctx.fillStyle = '#fff';
      ctx.fillText(btn.label, bx + bw/2, by + bh/2 + 9);
      ctx.restore();
      if (input.justDown && hot) btn.action();
    });
  }

  _hexToRgb(hex) {
    const r = parseInt(hex.slice(1,3),16);
    const g = parseInt(hex.slice(3,5),16);
    const b = parseInt(hex.slice(5,7),16);
    return `${r},${g},${b}`;
  }

  destroy() {
    audio.stop();
  }
}
