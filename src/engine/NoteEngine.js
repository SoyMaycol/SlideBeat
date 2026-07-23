// NoteEngine.js — note timing, hit detection, scoring
export class NoteEngine {
  constructor(notes, offsetMs = 0) {
    this.notes  = notes.slice().sort((a, b) => a.time - b.time);
    this.offset = offsetMs / 1000;
    this.index  = 0;           // next note to activate
    this.active = null;        // currently shown note
    this.hitResults = [];      // { dir, result, time }
    this.score   = 0;
    this.combo   = 0;
    this.maxCombo = 0;
    this.counts  = { perfect: 0, good: 0, miss: 0 };

    // Hit windows (seconds)
    this.PERFECT_WINDOW = 0.080;
    this.GOOD_WINDOW    = 0.160;
  }

  update(songTime) {
    const t = songTime + this.offset;

    // Activate next note
    if (!this.active && this.index < this.notes.length) {
      const next = this.notes[this.index];
      if (t >= next.time - next.duration) {
        this.active = { ...next, activated: t };
        this.index++;
      }
    }

    // Auto-miss expired note
    if (this.active) {
      const deadline = this.active.time + this.active.duration;
      if (t > deadline) {
        this._registerResult(this.active.direction, 'miss', t);
        this.active = null;
      }
    }
  }

  /**
   * Called when the player slides toward a direction.
   * Returns the hit result or null.
   */
  tryHit(direction, songTime) {
    if (!this.active) return null;
    const t    = songTime + this.offset;
    const diff = Math.abs(t - this.active.time);
    const targetDir = this.active.direction;

    if (direction !== targetDir) return null; // wrong direction

    let result;
    if (diff <= this.PERFECT_WINDOW) result = 'perfect';
    else if (diff <= this.GOOD_WINDOW) result = 'good';
    else result = 'good'; // still within active window

    this._registerResult(targetDir, result, t);
    this.active = null;
    return result;
  }

  _registerResult(dir, result, t) {
    this.hitResults.push({ dir, result, t });
    if (result === 'miss') {
      this.combo = 0;
      this.counts.miss++;
    } else {
      this.combo++;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      if (result === 'perfect') {
        this.score += 300 * (1 + this.combo * 0.01);
        this.counts.perfect++;
      } else {
        this.score += 100 * (1 + this.combo * 0.01);
        this.counts.good++;
      }
    }
  }

  get progress() {
    const total = this.notes.length;
    if (!total) return 1;
    return this.index / total;
  }

  get isFinished() {
    return this.index >= this.notes.length && !this.active;
  }
}
