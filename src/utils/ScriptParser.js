// ScriptParser.js — SlideLua interpreter (Lua-like subset → JS AsyncFunction)
// Each .lue file has onStart(params), onUpdate(dt, t), isDone() functions.

export class SlideLuaScript {
  constructor(source, cameraRef, arrowsRef, levelInfo) {
    this._source  = source;
    this._camera  = cameraRef;   // Renderer.cameraAPI() result
    this._arrows  = arrowsRef;   // { up:{dx,dy,scale,angle,r,g,b,a}, … }
    this._info    = levelInfo;
    this._done    = false;
    this._time    = 0;
    this._running = false;
  }

  /** Called every frame */
  update(dt) {
    this._time += dt;
  }

  /** Fire the script asynchronously */
  run(params = {}) {
    if (!this._source) { this._done = true; return; }
    this._running = true;
    const js = this._compile(this._source);
    const fn = this._buildFn(js);
    fn(params, this._camera, this._arrows, this._info, () => this._time)
      .catch(e => console.warn('[SlideLua]', e))
      .finally(() => { this._done = true; });
  }

  get isDone() { return this._done; }

  // ── Compiler (Lua subset → async JS) ──────────────────────────────────────
  _compile(src) {
    let js = src;

    // -- comments
    js = js.replace(/--[^\n]*/g, '');

    // local x = … → let x = …
    js = js.replace(/\blocal\b/g, 'let');

    // not → !,  and → &&,  or → ||
    js = js.replace(/\bnot\b\s+/g, '!');
    js = js.replace(/\band\b/g, '&&');
    js = js.replace(/\bor\b/g,  '||');

    // nil → null,  true/false kept as-is
    js = js.replace(/\bnil\b/g, 'null');

    // ~= → !==
    js = js.replace(/~=/g, '!==');

    // string concat:  a .. b  →  (a) + (b)
    js = js.replace(/\s+\.\.\s+/g, ' + ');

    // if … then … elseif … else … end
    js = js.replace(/\bif\b(.+?)\bthen\b/g, 'if ($1) {');
    js = js.replace(/\belseif\b(.+?)\bthen\b/g, '} else if ($1) {');
    js = js.replace(/\belse\b(?!\s*if)/g, '} else {');

    // for i = a, b do … end
    js = js.replace(/\bfor\b\s+(\w+)\s*=\s*([^,]+),\s*([^\s]+)\s+\bdo\b/g,
      'for (let $1 = $2; $1 <= $3; $1++) {');

    // while … do
    js = js.replace(/\bwhile\b(.+?)\bdo\b/g, 'while ($1) {');

    // function name(…)  →  async function name(…) {
    js = js.replace(/\bfunction\b\s+(\w+)\s*\(([^)]*)\)/g, 'async function $1($2) {');

    // end → }
    js = js.replace(/\bend\b/g, '}');

    // wait(n) → await __wait(n)
    js = js.replace(/\bwait\s*\(/g, 'await __wait(');

    // Lua default pattern: local x = params.x or DEFAULT
    // already handled by || above

    return js;
  }

  _buildFn(js) {
    // Inject built-ins
    const preamble = `
const __wait = (s) => new Promise(r => setTimeout(r, s * 1000));
const camera = __camera;
const arrows = __arrows;
const bpm    = () => __info.bpm || 120;
const time   = () => __getTime();
const beat   = () => (__getTime() / 60) * bpm();
const log    = (msg) => console.log('[SlideLua]', msg);
`;
    const body = preamble + js + `
\nonStart(params);
`;

    try {
      // eslint-disable-next-line no-new-func
      return new Function(
        'params', '__camera', '__arrows', '__info', '__getTime',
        `"use strict"; return (async () => { ${body} })();`
      );
    } catch (e) {
      console.warn('[SlideLua] Compile error:', e.message);
      return async () => {};
    }
  }
}
