import type { Entry, EntryRendition } from "@/types/entry";

function parseRenditions(raw: unknown): EntryRendition[] {
  if (!Array.isArray(raw)) return [];
  const out: EntryRendition[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const spotify_id = o.spotify_id;
    const title = o.title;
    const artist_name = o.artist_name;
    if (
      typeof spotify_id === "string" &&
      typeof title === "string" &&
      typeof artist_name === "string"
    ) {
      out.push({ spotify_id, title, artist_name });
    }
  }
  return out;
}

/** Map Supabase `entries` row to `Entry` */
export function mapEntryRow(row: Record<string, unknown>): Entry {
  return {
    id: String(row.id),
    spotify_id: String(row.spotify_id),
    artist_name: String(row.artist_name),
    album_name: String(row.album_name),
    song_name: String(row.song_name ?? row.album_name),
    release_year: typeof row.release_year === "number" ? row.release_year : 0,
    artwork_url: String(row.artwork_url ?? ""),
    note_text: (row.note_text as string | null) ?? null,
    scale_tier: (row.scale_tier as Entry["scale_tier"]) ?? "medium",
    hover_color_index:
      typeof row.hover_color_index === "number" ? row.hover_color_index : 0,
    date_added: String(row.date_added ?? ""),
    updated_at: String(row.updated_at ?? ""),
    trivia_summary: (row.trivia_summary as string | null) ?? null,
    renditions: parseRenditions(row.renditions_json),
    context_fetched_at: (row.context_fetched_at as string | null) ?? null,
  };
}
