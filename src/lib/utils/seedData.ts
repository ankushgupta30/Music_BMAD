import type { Entry } from "@/types/entry";
import parsedPairs from "@/lib/data/parsed-songs.json";

type ParsedPair = { song_name: string; artist_name: string };

function artworkSeed(song: string, artist: string): string {
  const key = `${song}-${artist}`.replace(/\s+/g, "-").slice(0, 80);
  return `https://picsum.photos/seed/${encodeURIComponent(key)}/300/300`;
}

/** Built from `data/songs_raw.txt` via `npm run parse-songs` */
export const SEED_ENTRIES: Entry[] = (parsedPairs as ParsedPair[]).map(
  (row, i) => {
    const iso = new Date(Date.UTC(2026, 0, 22 - (i % 20))).toISOString();
    return {
      id: `song-${i + 1}`,
      spotify_id: `raw-${i + 1}`,
      artist_name: row.artist_name,
      album_name: row.song_name,
      song_name: row.song_name,
      release_year: 0,
      artwork_url: artworkSeed(row.song_name, row.artist_name),
      note_text: null,
      scale_tier: "medium" as const,
      hover_color_index: i % 8,
      date_added: iso,
      updated_at: iso,
    };
  }
);
