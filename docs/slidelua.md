# SlideLua — Event Scripting Reference

SlideLua is the scripting language for SlideBeat events. It is a **Lua-inspired subset** interpreted natively in JavaScript. Scripts live in `events/*.lue` inside each level folder.

---

## Script Lifecycle

When an event trigger fires (see `level.jsonl`), the engine:
1. Loads `events/<eventName>.lue`
2. Calls `onStart(params)` once
3. Calls `onUpdate(dt, t)` every frame until `isDone()` returns true

---

## Built-in Globals

### Camera

| Function | Description |
|----------|-------------|
| `camera.pulse(strength, duration)` | Scale the camera out then back in smoothly |
| `camera.shake(intensity, duration)` | Shake the camera |
| `camera.zoom(scale, duration)` | Smoothly zoom to a scale (1.0 = default) |
| `camera.rotate(degrees, duration)` | Smoothly rotate the camera |
| `camera.resetAll(duration)` | Ease all camera transforms back to default |

### Arrows

| Function | Description |
|----------|-------------|
| `arrows.move(direction, dx, dy, duration)` | Translate an arrow from its default position |
| `arrows.scale(direction, scale, duration)` | Scale an arrow |
| `arrows.rotate(direction, degrees, duration)` | Rotate an arrow |
| `arrows.color(direction, r, g, b, a, duration)` | Tint an arrow (0–1 per channel) |
| `arrows.resetAll(duration)` | Ease all arrows back to defaults |

`direction` is one of: `"up"`, `"down"`, `"left"`, `"right"`, `"all"`

### Timing

| Function | Description |
|----------|-------------|
| `wait(seconds)` | Pause script execution for N seconds |
| `bpm()` | Returns the level BPM as a number |
| `beat()` | Returns the current beat number (float) |
| `time()` | Returns the current playback time in seconds |

### Easing

All `duration`-based functions accept an optional final `easing` string argument:

`"linear"` | `"easeIn"` | `"easeOut"` | `"easeInOut"` | `"bounce"` | `"elastic"`

---

## Example Scripts

### `pulse.lue` — Camera pulse on beat

```lua
function onStart(params)
  local strength = params.strength or 1.15
  local speed    = params.speed    or 0.25
  camera.pulse(strength, speed, "easeInOut")
end

function onUpdate(dt, t)
  -- nothing needed
end

function isDone()
  return true  -- fires once, completes immediately
end
```

### `arrowDance.lue` — Arrows bounce in sequence

```lua
local elapsed = 0
local done    = false

function onStart(params)
  arrows.scale("up",    1.4, 0.1, "easeOut")
  wait(0.1)
  arrows.scale("down",  1.4, 0.1, "easeOut")
  wait(0.1)
  arrows.scale("left",  1.4, 0.1, "easeOut")
  wait(0.1)
  arrows.scale("right", 1.4, 0.1, "easeOut")
  wait(0.2)
  arrows.resetAll(0.15, "easeInOut")
  done = true
end

function onUpdate(dt, t)
  elapsed = elapsed + dt
end

function isDone()
  return done
end
```

### `colorWave.lue` — Shift arrow colors

```lua
local done = false

function onStart(params)
  arrows.color("up",    1, 0.3, 0.3, 1, 0.2, "easeInOut")
  arrows.color("down",  0.3, 1, 0.3, 1, 0.2, "easeInOut")
  arrows.color("left",  0.3, 0.3, 1, 1, 0.2, "easeInOut")
  arrows.color("right", 1, 1, 0.3, 1, 0.2, "easeInOut")
  wait(0.5)
  arrows.resetAll(0.3)
  done = true
end

function onUpdate(dt, t) end

function isDone()
  return done
end
```

---

## Language Rules

- Variables: `local x = value`
- Arithmetic: `+`, `-`, `*`, `/`, `%`
- Conditionals: `if ... then ... elseif ... else ... end`
- Loops: `for i = 1, 10 do ... end` / `while cond do ... end`
- Tables: `local t = {}` / `t.key = val` / `t[1] = val`
- String concat: `..`
- Comments: `-- single line`
- No `require`, `io`, `os`, `print` (use `log(msg)` for debug output)

---

## Notes

- Scripts run in a sandboxed JS context — no DOM, no network access.
- Each `.lue` file is scoped to a single event invocation; global state resets per call.
- `wait()` is cooperative — it yields within `onStart`; don't use it inside `onUpdate`.
