// InputHandler.js — unified mouse & touch input
export class InputHandler {
  constructor(canvas) {
    this.canvas    = canvas;
    this.pos       = { x: 0, y: 0 };
    this.down      = false;
    this.justDown  = false;
    this.justUp    = false;
    this._pendingDown = false;
    this._pendingUp   = false;

    canvas.addEventListener('mousedown',  e => { this._setPos(e); this._pendingDown = true; this.down = true; });
    canvas.addEventListener('mousemove',  e => this._setPos(e));
    canvas.addEventListener('mouseup',    e => { this._pendingUp = true; this.down = false; });
    canvas.addEventListener('mouseleave', e => { this._pendingUp = true; this.down = false; });

    canvas.addEventListener('touchstart', e => {
      e.preventDefault();
      this._setTouchPos(e.touches[0]);
      this._pendingDown = true;
      this.down = true;
    }, { passive: false });
    canvas.addEventListener('touchmove', e => {
      e.preventDefault();
      this._setTouchPos(e.touches[0]);
    }, { passive: false });
    canvas.addEventListener('touchend', e => {
      e.preventDefault();
      this._pendingUp = true;
      this.down = false;
    }, { passive: false });
  }

  _setPos(e) {
    const r = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / r.width;
    const scaleY = this.canvas.height / r.height;
    this.pos.x = (e.clientX - r.left) * scaleX;
    this.pos.y = (e.clientY - r.top)  * scaleY;
  }

  _setTouchPos(t) {
    const r = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width  / r.width;
    const scaleY = this.canvas.height / r.height;
    this.pos.x = (t.clientX - r.left) * scaleX;
    this.pos.y = (t.clientY - r.top)  * scaleY;
  }

  endFrame() {
    this.justDown = this._pendingDown;
    this.justUp   = this._pendingUp;
    this._pendingDown = false;
    this._pendingUp   = false;
  }
}
