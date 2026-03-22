import type { Entry } from "@/types/entry";

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
  };
}
