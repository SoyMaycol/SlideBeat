// LevelLoader.js — loads level folder assets
export class LevelLoader {
  /**
   * Load a level from a folder path.
   * Returns { info, notes, events, musicUrl, coverUrl, iconUrl }
   */
  static async load(folderPath) {
    // Load info.json
    const infoRes = await fetch(`${folderPath}/info.json`);
    const info    = await infoRes.json();

    // Load level.jsonl
    const jsonlRes = await fetch(`${folderPath}/level.jsonl`);
    const text     = await jsonlRes.text();
    const lines    = text.trim().split('\n').filter(l => l.trim());
    const objects  = lines.map(l => JSON.parse(l));

    const notes  = objects.filter(o => o.type === 'note');
    const events = objects.filter(o => o.type === 'event');

    // Preload event scripts
    const scriptMap = {};
    const eventNames = [...new Set(events.map(e => e.event))];
    await Promise.all(eventNames.map(async name => {
      try {
        const r = await fetch(`${folderPath}/events/${name}.lue`);
        scriptMap[name] = await r.text();
      } catch { scriptMap[name] = ''; }
    }));

    return {
      info,
      notes,
      events,
      scriptMap,
      musicUrl: `${folderPath}/music.ogg`,
      coverUrl:  `${folderPath}/cover.png`,
      iconUrl:   `${folderPath}/icon.png`,
    };
  }

  /** Scan levels/ directory by trying level01..level99 */
  static async scanLevels(basePath = 'levels') {
    const results = [];
    // We rely on a levels/index.json manifest for reliable listing
    try {
      const idx = await fetch(`${basePath}/index.json`);
      const list = await idx.json(); // array of folder names e.g. ["level01","level02"]
      for (const folder of list) {
        try {
          const infoRes = await fetch(`${basePath}/${folder}/info.json`);
          const info    = await infoRes.json();
          results.push({
            folder: `${basePath}/${folder}`,
            info,
            coverUrl: `${basePath}/${folder}/cover.png`,
            iconUrl:  `${basePath}/${folder}/icon.png`,
          });
        } catch {}
      }
    } catch {
      // fallback: try level01–level20
      for (let i = 1; i <= 20; i++) {
        const folder = `level${String(i).padStart(2,'0')}`;
        try {
          const infoRes = await fetch(`${basePath}/${folder}/info.json`);
          if (!infoRes.ok) continue;
          const info = await infoRes.json();
          results.push({
            folder: `${basePath}/${folder}`,
            info,
            coverUrl: `${basePath}/${folder}/cover.png`,
            iconUrl:  `${basePath}/${folder}/icon.png`,
          });
        } catch {}
      }
    }
    return results;
  }
}
