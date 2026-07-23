// EventEngine.js — fires SlideLua events at scheduled times
import { SlideLuaScript } from '../utils/ScriptParser.js';

export class EventEngine {
  constructor(events, scriptMap, cameraRef, arrowsStateRef, levelInfo) {
    this._queue       = events.slice().sort((a,b) => a.time - b.time);
    this._scriptMap   = scriptMap;
    this._camera      = cameraRef;
    this._arrows      = arrowsStateRef;
    this._info        = levelInfo;
    this._active      = [];   // running scripts
    this._index       = 0;
  }

  update(songTime, dt) {
    // Fire new events
    while (this._index < this._queue.length &&
           songTime >= this._queue[this._index].time) {
      const ev     = this._queue[this._index++];
      const source = this._scriptMap[ev.event] ?? '';
      const script = new SlideLuaScript(source, this._camera, this._arrows, this._info);
      script.update(0);
      script.run(ev.params ?? {});
      this._active.push(script);
    }

    // Tick running scripts
    for (const s of this._active) s.update(dt);
    this._active = this._active.filter(s => !s.isDone);
  }
}
