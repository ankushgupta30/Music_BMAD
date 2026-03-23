import type { Entry } from "@/types/entry";
import parsedPairs from "@/lib/data/parsed-songs.json";
import { getEstimatedReleaseYear } from "@/lib/data/estimatedReleaseYears";

type ParsedPair = { song_name: string; artist_name: string };

function artworkSeed(song: string, artist: string): string {
  const key = `${song}-${artist}`.replace(/\s+/g, "-").slice(0, 80);
  return `https://picsum.photos/seed/${encodeURIComponent(key)}/300/300`;
}

const firstPair = (parsedPairs as ParsedPair[])[0]!;

/**
 * Single curated row for first-open / demo (Epic 1 Story 1.6, Epic 2 Story 2.5).
 * Shown when there are no DB entries and the visitor is not signed in.
 */
export const CURATED_DEMO_ENTRY: Entry = {
  id: "rewind-demo-seed",
  spotify_id: "demo-seed",
  artist_name: firstPair.artist_name,
  album_name: firstPair.song_name,
  song_name: firstPair.song_name,
  release_year: getEstimatedReleaseYear(firstPair.song_name, firstPair.artist_name),
  artwork_url: artworkSeed(firstPair.song_name, firstPair.artist_name),
  note_text: null,
  scale_tier: "large",
  hover_color_index: 0,
  date_added: new Date(Date.UTC(2026, 0, 22)).toISOString(),
  updated_at: new Date(Date.UTC(2026, 0, 22)).toISOString(),
};

/** Built from `data/songs_raw.txt` via `npm run parse-songs`; years are editorial guesses. */
export const SEED_ENTRIES: Entry[] = (parsedPairs as ParsedPair[]).map(
  (row, i) => {
    const iso = new Date(Date.UTC(2026, 0, 22 - (i % 20))).toISOString();
    return {
      id: `song-${i + 1}`,
      spotify_id: `raw-${i + 1}`,
      artist_name: row.artist_name,
      album_name: row.song_name,
      song_name: row.song_name,
      release_year: getEstimatedReleaseYear(row.song_name, row.artist_name),
      artwork_url: artworkSeed(row.song_name, row.artist_name),
      note_text: null,
      scale_tier: "medium" as const,
      hover_color_index: i % 8,
      date_added: iso,
      updated_at: iso,
    };
  }
);

/** Resolve demo or legacy dev seed ids for `/entry/[id]` when not in Supabase. */
export function findSeedEntryById(id: string): Entry | undefined {
  if (id === CURATED_DEMO_ENTRY.id) return CURATED_DEMO_ENTRY;
  return SEED_ENTRIES.find((e) => e.id === id);
}
