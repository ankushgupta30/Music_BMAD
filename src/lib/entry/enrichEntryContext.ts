import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchLastFmTrackWikiSummary, isLastFmConfigured } from "@/lib/lastfm/trackWiki";
import { fetchRenditionsForEntry } from "@/lib/spotify/renditions";
import { isSpotifyConfigured } from "@/lib/spotify/client";
import { fetchRedditTriviaItems } from "@/lib/reddit/trivia";
import type { Entry, EntryRendition, EntryTriviaItem } from "@/types/entry";

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
  let triviaItems: EntryTriviaItem[] = entry.trivia_items ?? [];
  let renditions: EntryRendition[] = entry.renditions ?? [];

  try {
    if (isLastFmConfigured()) {
      trivia = await fetchLastFmTrackWikiSummary(
        entry.artist_name,
        entry.song_name || entry.album_name
      );
      if (trivia && trivia.trim().length > 0) {
        triviaItems = [
          {
            text: trivia,
            source_type: "lastfm",
            source_url: null,
            score: null,
            fetched_at: new Date().toISOString(),
          },
        ];
      }
    }

    const redditItems = await fetchRedditTriviaItems(
      entry.artist_name,
      entry.song_name || entry.album_name
    );
    if (redditItems.length > 0) {
      const existing = new Set(triviaItems.map((item) => item.text.trim().toLowerCase()));
      for (const item of redditItems) {
        const key = item.text.trim().toLowerCase();
        if (existing.has(key)) continue;
        triviaItems.push(item);
        existing.add(key);
      }
    }

    // Keep legacy UI populated while structured trivia rolls out.
    if ((!trivia || trivia.trim().length === 0) && triviaItems.length > 0) {
      trivia = triviaItems[0]?.text ?? null;
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
      trivia_items: triviaItems,
      renditions,
      context_fetched_at: fetchedAt,
    };
  }

  const { error } = await supabase
    .from("entries")
    .update({
      trivia_summary: trivia,
      trivia_items_json: triviaItems,
      renditions_json: renditions,
      context_fetched_at: fetchedAt,
    })
    .eq("id", entry.id);

  if (error) {
    console.warn("[entry-context] persist failed", error.message);
    return {
      ...entry,
      trivia_summary: trivia,
      trivia_items: triviaItems,
      renditions,
      context_fetched_at: entry.context_fetched_at,
    };
  }

  return {
    ...entry,
    trivia_summary: trivia,
    trivia_items: triviaItems,
    renditions,
    context_fetched_at: fetchedAt,
  };
}
