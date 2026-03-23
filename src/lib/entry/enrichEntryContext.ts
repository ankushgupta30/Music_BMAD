import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchLastFmTrackWikiSummary, isLastFmConfigured } from "@/lib/lastfm/trackWiki";
import { fetchRenditionsForEntry } from "@/lib/spotify/renditions";
import { isSpotifyConfigured } from "@/lib/spotify/client";
import type { Entry, EntryRendition } from "@/types/entry";

const CONTEXT_TTL_MS = 7 * 24 * 60 * 60 * 1000;

function isContextFresh(entry: Entry): boolean {
  if (!entry.context_fetched_at) return false;
  const t = Date.parse(entry.context_fetched_at);
  if (Number.isNaN(t)) return false;
  return Date.now() - t < CONTEXT_TTL_MS;
}

/** Local / demo entries are not stored in Supabase. */
export function isSeedEntryId(id: string): boolean {
  return id === "rewind-demo-seed" || id.startsWith("song-");
}

/**
 * If cache is stale, fetch trivia + renditions and persist. Returns updated entry fields merged in-memory.
 */
export async function enrichEntryContext(
  entry: Entry,
  supabase: SupabaseClient
): Promise<Entry> {
  if (isContextFresh(entry)) return entry;
  const seedEntry = isSeedEntryId(entry.id);

  let trivia: string | null = entry.trivia_summary;
  let renditions: EntryRendition[] = entry.renditions ?? [];

  try {
    if (isLastFmConfigured()) {
      trivia = await fetchLastFmTrackWikiSummary(
        entry.artist_name,
        entry.song_name || entry.album_name
      );
    }

    if (isSpotifyConfigured()) {
      renditions = await fetchRenditionsForEntry(
        entry.song_name || entry.album_name,
        entry.artist_name,
        entry.spotify_id,
        5
      );
    }
  } catch (e) {
    console.error("[entry-context] fetch failed", e);
  }

  const fetchedAt = new Date().toISOString();

  if (seedEntry) {
    return {
      ...entry,
      trivia_summary: trivia,
      renditions,
      context_fetched_at: fetchedAt,
    };
  }

  const { error } = await supabase
    .from("entries")
    .update({
      trivia_summary: trivia,
      renditions_json: renditions,
      context_fetched_at: fetchedAt,
    })
    .eq("id", entry.id);

  if (error) {
    console.warn("[entry-context] persist failed", error.message);
    return {
      ...entry,
      trivia_summary: trivia,
      renditions,
      context_fetched_at: entry.context_fetched_at,
    };
  }

  return {
    ...entry,
    trivia_summary: trivia,
    renditions,
    context_fetched_at: fetchedAt,
  };
}
