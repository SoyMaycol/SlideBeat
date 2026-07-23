# 🎵 SlideBeat

A rhythm game inspired by Osu! — hold and **slide** your cursor/finger to the beat.

## Gameplay

Four arrows are arranged around a central point:
- **↑ Up** — slide upward
- **↓ Down** — slide downward
- **← Left** — slide left
- **→ Right** — slide right

Hold the mouse button (or touch) at the **center**, then slide toward the highlighted arrow before time runs out. Fast sequences demand quick flicks — that's the challenge.

## Features

- 🖱️ Mouse & 📱 Touch support
- 🎵 `.ogg` audio format
- 📋 `.jsonl` level format (one note per line)
- 🌙 Lua-based event scripting (`SlideLua`) for camera/arrow animations
- 🗂️ Level selector with cover art
- ⚙️ Settings menu
- 💥 Osu-style hit feedback (Perfect / Good / Miss)

## Tech Stack

- **HTML5 Canvas + Vanilla JS** — no build step, runs in any browser
- **Web Audio API** — `.ogg` playback
- **SlideLua** — custom Lua-like scripting for level events (parsed in JS)

## Project Structure

```
SlideBeat/
├── index.html              ← Entry point
├── src/
│   ├── main.js             ← Boot, scene router
│   ├── scenes/
│   │   ├── MenuScene.js    ← Main menu
│   │   ├── SelectScene.js  ← Level selection
│   │   ├── GameScene.js    ← Gameplay
│   │   └── SettingsScene.js
│   ├── engine/
│   │   ├── AudioEngine.js  ← OGG playback
│   │   ├── InputHandler.js ← Mouse & Touch
│   │   ├── Renderer.js     ← Canvas drawing
│   │   ├── NoteEngine.js   ← Note timing / hit detection
│   │   └── EventEngine.js  ← SlideLua event runner
│   └── utils/
│       ├── LevelLoader.js  ← Parses level.jsonl + info.json
│       └── ScriptParser.js ← SlideLua interpreter
├── levels/
│   └── level01/
│       ├── music.ogg
│       ├── level.jsonl
│       ├── cover.png
│       ├── icon.png
│       ├── info.json
│       └── events/
│           └── pulse.lue
└── docs/
    ├── level-format.md     ← Level .jsonl spec
    └── slidelua.md         ← SlideLua scripting reference
```

## Level Folder Format

```
level01/
├── music.ogg       ← Audio track (OGG Vorbis)
├── level.jsonl     ← Notes & event triggers (one JSON object per line)
├── cover.png       ← Background shown in level select (recommended 1280×720)
├── icon.png        ← Small icon shown in level card (recommended 256×256)
├── info.json       ← Level metadata
└── events/
    └── pulse.lue   ← SlideLua script for the "pulse" event
```

## Running the Game

Just open `index.html` in a browser (use a local server to load level files):

```bash
npx serve .
# or
python3 -m http.server 8080
```

Then go to `http://localhost:8080`.

## Audio Format

Use **OGG Vorbis** (`.ogg`). Recommended encoding:
- Bitrate: 192 kbps
- Sample rate: 44100 Hz
- Channels: Stereo

Convert with ffmpeg:
```bash
ffmpeg -i song.mp3 -c:a libvorbis -q:a 6 music.ogg
```
