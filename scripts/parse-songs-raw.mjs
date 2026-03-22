import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const raw = fs.readFileSync(path.join(__dirname, "../data/songs_raw.txt"), "utf8");

function isGarbageLine(s) {
  const t = s.trim();
  if (!t) return true;
  if (t.length < 2) return true;
  if (/^\d{1,3}$/.test(t)) return true;
  if (/^\d{1,2}:\d{2}$/.test(t)) return true;
  if (/weeks?\s*ago$/i.test(t)) return true;
  if (/\d{1,2}\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\s+\d{4}/i.test(t))
    return true;
  if (/^tweek/i.test(t)) return true;
  if (/^[a-z]$/i.test(t)) return true;
  if (/^[@&*,.=)\]"'(\[|]+$/.test(t)) return true;
  return false;
}

function cleanArtist(s) {
  let a = s.trim();
  a = a.replace(/^GB\)\s*Musicvideo\s*«\s*/i, "");
  a = a.replace(/^GD\s*Music video\s*[-«+]\s*/i, "");
  a = a.replace(/^G\s*Music video\s*[-«+]\s*/i, "");
  a = a.replace(/^©\)?\s*Music video\s*\+\s*/i, "");
  a = a.replace(/^©\)?\s*Music video\s*»\s*/i, "");
  a = a.replace(/^©\)?\s*Music video\s*-\s*/i, "");
  a = a.replace(/^@\)?\s*Music video\s*»\s*/i, "");
  a = a.replace(/^Gi\s+/i, "");
  a = a.replace(/^G\s+The\s+/i, "The ");
  a = a.replace(/^G\s+(?=[A-Za-z])/i, ""); // lone G prefix
  a = a.replace(/^B\s+/i, "");
  a = a.replace(/^By\.?\s*/i, "");
  a = a.replace(/^B\.\.cole$/i, "J. Cole");
  a = a.replace(/^Guo$/i, "J. Cole");
  a = a.replace(/^cole$/i, "J. Cole");
  a = a.replace(/^50Cent$/i, "50 Cent");
  a = a.replace(/^GRaAgaP\s*/i, "A$AP ");
  a = a.replace(/^RaAgaP\s*/i, "A$AP ");
  a = a.replace(/^GB\s+/i, "");
  a = a.replace(/^GAb-/i, "Ab-");
  a = a.replace(/^Gkendrick/i, "Kendrick");
  a = a.replace(/^GClipse/i, "Clipse");
  a = a.replace(/^Bvon\s*/i, "Jon ");
  a = a.replace(/^G50Cent$/i, "50 Cent");
  a = a.trim();
  return a;
}

function cleanSong(s) {
  return s.replace(/^AWhistling/i, "A Whistling").trim();
}

const chunks = raw.split(/\r?\n\s*\r?\n/);
const seen = new Set();
const pairs = [];

for (const chunk of chunks) {
  const lines = chunk
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) continue;
  const song = cleanSong(lines[0]);
  const artist = cleanArtist(lines[1]);
  if (isGarbageLine(song) || isGarbageLine(artist)) continue;
  if (song.length < 4 || artist.length < 3) continue;
  if (/Music video|©\)/i.test(artist)) continue;
  if (/^[^a-zA-Z]*$/.test(song)) continue;
  const key = `${song}|${artist}`.toLowerCase();
  if (seen.has(key)) continue;
  seen.add(key);
  pairs.push({ song_name: song, artist_name: artist });
}

const outPath = path.join(__dirname, "../src/lib/data/parsed-songs.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(pairs, null, 0), "utf8");
console.error("Wrote", pairs.length, "pairs to", outPath);
