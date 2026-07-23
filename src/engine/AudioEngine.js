// AudioEngine.js — OGG playback via Web Audio API
export class AudioEngine {
  constructor() {
    this.ctx     = null;
    this.buffer  = null;
    this.source  = null;
    this.gainNode = null;
    this._startedAt = 0;
    this._offsetAt  = 0;
    this.playing    = false;
  }

  _ensure() {
    if (!this.ctx) {
      this.ctx = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.ctx.createGain();
      this.gainNode.connect(this.ctx.destination);
    }
  }

  async load(url) {
    this._ensure();
    const res  = await fetch(url);
    const data = await res.arrayBuffer();
    this.buffer = await this.ctx.decodeAudioData(data);
  }

  play(offsetSec = 0) {
    if (!this.buffer) return;
    this._ensure();
    this.stop();
    this.source = this.ctx.createBufferSource();
    this.source.buffer = this.buffer;
    this.source.connect(this.gainNode);
    this._offsetAt  = offsetSec;
    this._startedAt = this.ctx.currentTime - offsetSec;
    this.source.start(0, Math.max(0, offsetSec));
    this.playing = true;
    this.source.onended = () => { this.playing = false; };
  }

  stop() {
    if (this.source) {
      try { this.source.stop(); } catch {}
      this.source = null;
    }
    this.playing = false;
  }

  get currentTime() {
    if (!this.ctx || !this.playing) return 0;
    return this.ctx.currentTime - this._startedAt;
  }

  set volume(v) {
    this._ensure();
    this.gainNode.gain.value = v;
  }
}
