// Renderer.js — shared drawing utilities, camera state & tweens
export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;

    // Camera state
    this.cam = {
      scale:   1,
      angle:   0,
      offsetX: 0,
      offsetY: 0,
    };

    // Active tweens: [{ obj, prop, start, end, elapsed, duration, ease, onDone }]
    this._tweens      = [];
    this._shakeLeft   = 0;
    this._shakeIntens = 0;
    this._shakeX      = 0;
    this._shakeY      = 0;
  }

  // ── Easing ────────────────────────────────────────────────────────────────
  static ease(type, t) {
    t = Math.max(0, Math.min(1, t));
    switch (type) {
      case 'easeIn':    return t * t;
      case 'easeOut':   return 1 - (1-t)*(1-t);
      case 'easeInOut': return t < 0.5 ? 2*t*t : 1-Math.pow(-2*t+2,2)/2;
      case 'bounce':    {
        const n1 = 7.5625, d1 = 2.75;
        if (t < 1/d1)      return n1*t*t;
        if (t < 2/d1)      return n1*(t-=1.5/d1)*t+0.75;
        if (t < 2.5/d1)    return n1*(t-=2.25/d1)*t+0.9375;
        return n1*(t-=2.625/d1)*t+0.984375;
      }
      case 'elastic':   return t === 0 ? 0 : t === 1 ? 1
        : -Math.pow(2,10*t-10)*Math.sin((t*10-10.75)*(2*Math.PI)/3);
      default:          return t; // linear
    }
  }

  // ── Tween API ─────────────────────────────────────────────────────────────
  tween(obj, prop, endVal, duration, ease = 'easeInOut', onDone) {
    // Cancel existing tween on same prop
    this._tweens = this._tweens.filter(tw => !(tw.obj === obj && tw.prop === prop));
    this._tweens.push({
      obj, prop,
      start: obj[prop],
      end:   endVal,
      elapsed: 0, duration, ease, onDone,
    });
  }

  update(dt) {
    // Advance tweens
    this._tweens = this._tweens.filter(tw => {
      tw.elapsed += dt;
      const t = Math.min(1, tw.elapsed / tw.duration);
      tw.obj[tw.prop] = tw.start + (tw.end - tw.start) * Renderer.ease(tw.ease, t);
      if (t >= 1) { tw.onDone?.(); return false; }
      return true;
    });

    // Shake decay
    if (this._shakeLeft > 0) {
      this._shakeLeft -= dt;
      const i = this._shakeIntens * Math.max(0, this._shakeLeft);
      this._shakeX = (Math.random()*2-1) * i;
      this._shakeY = (Math.random()*2-1) * i;
    } else {
      this._shakeX = 0; this._shakeY = 0;
    }
  }

  // ── Camera helpers ────────────────────────────────────────────────────────

  /** Apply camera transform — call before drawing world objects */
  applyCameraTransform(ctx, W, H) {
    ctx.save();
    ctx.translate(W/2 + this.cam.offsetX + this._shakeX,
                  H/2 + this.cam.offsetY + this._shakeY);
    ctx.rotate(this.cam.angle);
    ctx.scale(this.cam.scale, this.cam.scale);
    ctx.translate(-W/2, -H/2);
  }

  /** Undo camera transform */
  restoreCameraTransform(ctx) {
    ctx.restore();
  }

  // ── Camera control (SlideLua-callable proxy) ──────────────────────────────
  cameraAPI() {
    const r = this;
    return {
      pulse(strength = 1.2, duration = 0.25, ease = 'easeInOut') {
        r.tween(r.cam, 'scale', strength, duration / 2, ease, () => {
          r.tween(r.cam, 'scale', 1, duration / 2, ease);
        });
      },
      shake(intensity = 10, duration = 0.3) {
        r._shakeIntens = intensity / Math.max(duration, 0.01);
        r._shakeLeft   = duration;
      },
      zoom(scale = 1, duration = 0.4, ease = 'easeInOut') {
        r.tween(r.cam, 'scale', scale, duration, ease);
      },
      rotate(degrees = 0, duration = 0.4, ease = 'easeInOut') {
        r.tween(r.cam, 'angle', degrees * Math.PI / 180, duration, ease);
      },
      resetAll(duration = 0.3, ease = 'easeInOut') {
        r.tween(r.cam, 'scale',   1, duration, ease);
        r.tween(r.cam, 'angle',   0, duration, ease);
        r.tween(r.cam, 'offsetX', 0, duration, ease);
        r.tween(r.cam, 'offsetY', 0, duration, ease);
      },
    };
  }

  // ── Drawing helpers ───────────────────────────────────────────────────────

  /** Draw a rounded rectangle (fill + optional stroke) */
  roundRect(ctx, x, y, w, h, r, fillStyle, strokeStyle) {
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(x, y, w, h, r);
    } else {
      this._manualRoundRect(ctx, x, y, w, h, r);
    }
    if (fillStyle)  { ctx.fillStyle   = fillStyle;  ctx.fill();   }
    if (strokeStyle){ ctx.strokeStyle = strokeStyle; ctx.stroke(); }
  }

  _manualRoundRect(ctx, x, y, w, h, r) {
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.arcTo(x+w, y,   x+w, y+r,   r);
    ctx.lineTo(x+w, y+h-r);
    ctx.arcTo(x+w, y+h, x+w-r, y+h, r);
    ctx.lineTo(x+r, y+h);
    ctx.arcTo(x, y+h,   x, y+h-r,   r);
    ctx.lineTo(x, y+r);
    ctx.arcTo(x, y,     x+r, y,     r);
    ctx.closePath();
  }
}
