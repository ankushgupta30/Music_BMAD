import type { Entry, EntryRendition, EntryTriviaItem, TriviaSourceType } from "@/types/entry";

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

function isTriviaSourceType(v: unknown): v is TriviaSourceType {
  return (
    v === "lastfm" ||
    v === "reddit" ||
    v === "wiki" ||
    v === "interview" ||
    v === "editorial" ||
    v === "other"
  );
}

function parseTriviaItems(raw: unknown): EntryTriviaItem[] {
  if (!Array.isArray(raw)) return [];
  const out: EntryTriviaItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== "object") continue;
    const o = item as Record<string, unknown>;
    const text = o.text;
    const source_type = o.source_type;
    const source_url = o.source_url;
    const score = o.score;
    const fetched_at = o.fetched_at;

    if (
      typeof text === "string" &&
      text.trim().length > 0 &&
      isTriviaSourceType(source_type) &&
      (typeof source_url === "string" || source_url === null || source_url === undefined) &&
      (typeof score === "number" || score === null || score === undefined) &&
      typeof fetched_at === "string" &&
      fetched_at.trim().length > 0
    ) {
      out.push({
        text: text.trim(),
        source_type,
        source_url: typeof source_url === "string" ? source_url : null,
        score: typeof score === "number" ? score : null,
        fetched_at,
      });
    }
  }
  return out;
}

/** Map Supabase `entries` row to `Entry` */
export function mapEntryRow(row: Record<string, unknown>): Entry {
  const trivia_summary = (row.trivia_summary as string | null) ?? null;
  const trivia_items = parseTriviaItems(row.trivia_items_json);
  const fallbackTriviaItems =
    trivia_items.length > 0 || !trivia_summary || trivia_summary.trim().length === 0
      ? trivia_items
      : [
          {
            text: trivia_summary,
            source_type: "lastfm",
            source_url: null,
            score: null,
            fetched_at: String(row.context_fetched_at ?? row.updated_at ?? ""),
          } satisfies EntryTriviaItem,
        ];

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
    trivia_summary,
    trivia_items: fallbackTriviaItems,
    renditions: parseRenditions(row.renditions_json),
    context_fetched_at: (row.context_fetched_at as string | null) ?? null,
  };
}
