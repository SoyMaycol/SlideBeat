# Level Format — `level.jsonl`

Each line in `level.jsonl` is a self-contained JSON object representing a **note** or an **event trigger**.

---

## Note Object

```json
{"type":"note","time":1.250,"direction":"up","duration":0.5,"holdDuration":0}
```

| Field         | Type    | Required | Description |
|---------------|---------|----------|-------------|
| `type`        | string  | ✅       | Always `"note"` |
| `time`        | number  | ✅       | Time in seconds when the note becomes active |
| `direction`   | string  | ✅       | One of: `"up"`, `"down"`, `"left"`, `"right"` |
| `duration`    | number  | ✅       | How long (seconds) the arrow stays lit before becoming a miss |
| `holdDuration`| number  | ❌       | If > 0, the player must hold the slide for this many seconds (held note) |

### Directions

```
         UP
          ↑
LEFT ←  [CENTER]  → RIGHT
          ↓
        DOWN
```

---

## Event Trigger Object

```json
{"type":"event","time":2.000,"event":"pulse","params":{"strength":1.2,"speed":0.3}}
```

| Field    | Type   | Required | Description |
|----------|--------|----------|-------------|
| `type`   | string | ✅       | Always `"event"` |
| `time`   | number | ✅       | Time in seconds to fire the event |
| `event`  | string | ✅       | Name of the `.lue` script in `events/` (without extension) |
| `params` | object | ❌       | Key/value pairs passed to the script as `params` table |

---

## Full Example — `level.jsonl`

```jsonl
{"type":"note","time":0.500,"direction":"up","duration":0.6,"holdDuration":0}
{"type":"note","time":1.000,"direction":"down","duration":0.6,"holdDuration":0}
{"type":"note","time":1.500,"direction":"up","duration":0.5,"holdDuration":0}
{"type":"note","time":2.000,"direction":"down","duration":0.5,"holdDuration":0}
{"type":"event","time":2.000,"event":"pulse","params":{"strength":1.15,"speed":0.25}}
{"type":"note","time":2.500,"direction":"left","duration":0.4,"holdDuration":0}
{"type":"note","time":2.750,"direction":"right","duration":0.4,"holdDuration":0}
{"type":"note","time":3.000,"direction":"left","duration":0.4,"holdDuration":0}
{"type":"note","time":3.250,"direction":"right","duration":0.4,"holdDuration":0}
{"type":"note","time":4.000,"direction":"up","duration":0.8,"holdDuration":0.5}
{"type":"event","time":4.000,"event":"pulse","params":{"strength":1.3,"speed":0.2}}
```

---

## `info.json` Format

```json
{
  "id": "level01",
  "title": "Example Track",
  "artist": "Artist Name",
  "mapper": "Mapper Name",
  "difficulty": "Normal",
  "bpm": 128,
  "previewTime": 12.5,
  "tags": ["electronic", "upbeat"]
}
```

| Field         | Description |
|---------------|-------------|
| `id`          | Unique level identifier (must match folder name) |
| `title`       | Song title shown in level select |
| `artist`      | Artist name |
| `mapper`      | Level creator |
| `difficulty`  | Display string: Easy / Normal / Hard / Insane |
| `bpm`         | BPM of the song (used by event scripts) |
| `previewTime` | Seconds offset for the preview clip in level select |
| `tags`        | Array of genre/style tags |
