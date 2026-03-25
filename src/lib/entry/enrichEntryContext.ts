import type { SupabaseClient } from "@supabase/supabase-js";
import { fetchLastFmTrackWikiSummary, isLastFmConfigured } from "@/lib/lastfm/trackWiki";
import { fetchRenditionsForEntry } from "@/lib/spotify/renditions";
import { isSpotifyConfigured } from "@/lib/spotify/client";
import { fetchRedditTriviaItems, fetchRedditTriviaItemsDebug } from "@/lib/reddit/trivia";
import type { RedditTriviaDebugReport } from "@/lib/reddit/trivia";
import { fetchWikiTriviaItems } from "@/lib/wiki/trivia";
import type { Entry, EntryRendition, EntryTriviaItem } from "@/types/entry";

const CONTEXT_TTL_MS = 7 * 24 * 60 * 60 * 1000;
const NO_REDDIT_RETRY_MS = 24 * 60 * 60 * 1000;

function isContextFresh(entry: Entry): boolean {
  if (!entry.context_fetched_at) return false;
  const t = Date.parse(entry.context_fetched_at);
  if (Number.isNaN(t)) return false;
  const age = Date.now() - t;
  if (age >= CONTEXT_TTL_MS) return false;
  const hasRedditItem = (entry.trivia_items ?? []).some((i) => i.source_type === "reddit");
  if (!hasRedditItem && age >= NO_REDDIT_RETRY_MS) return false;
  return true;
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
    const nextItems: EntryTriviaItem[] = [];
    let lastFmText: string | null = null;

    try {
      const redditItems = await fetchRedditTriviaItems(
        entry.artist_name,
        entry.song_name || entry.album_name
      );
      nextItems.push(...redditItems);
    } catch (e) {
      console.warn("[entry-context] reddit failed", e);
    }

    if (isLastFmConfigured()) {
      try {
        lastFmText = await fetchLastFmTrackWikiSummary(
          entry.artist_name,
          entry.song_name || entry.album_name
        );
        const trimmed = lastFmText?.trim() ?? "";
        if (trimmed.length > 0) {
          const existing = new Set(nextItems.map((item) => item.text.trim().toLowerCase()));
          const key = trimmed.toLowerCase();
          if (!existing.has(key)) {
            nextItems.push({
              text: trimmed,
              source_type: "lastfm",
              source_url: null,
              score: null,
              fetched_at: new Date().toISOString(),
            });
          }
        }
      } catch (e) {
        console.warn("[entry-context] lastfm failed", e);
      }
    }

    try {
      const wikiItems = await fetchWikiTriviaItems(
        entry.artist_name,
        entry.song_name || entry.album_name
      );
      if (wikiItems.length > 0) {
        const existing = new Set(nextItems.map((item) => item.text.trim().toLowerCase()));
        for (const item of wikiItems) {
          const key = item.text.trim().toLowerCase();
          if (existing.has(key)) continue;
          nextItems.push(item);
          existing.add(key);
        }
      }
    } catch (e) {
      console.warn("[entry-context] wiki failed", e);
    }

    triviaItems = nextItems;
    // Legacy single field: prefer a discussion snippet, else first reference line.
    trivia =
      triviaItems.find((i) => i.source_type === "reddit")?.text?.trim()
      ?? lastFmText?.trim()
      ?? triviaItems[0]?.text?.trim()
      ?? null;

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

function isPersistableTriviaItem(item: EntryTriviaItem): boolean {
  if (!item || typeof item !== "object") return false;
  if (typeof item.text !== "string" || item.text.trim().length === 0) return false;
  if (
    item.source_type !== "lastfm" &&
    item.source_type !== "reddit" &&
    item.source_type !== "wiki" &&
    item.source_type !== "interview" &&
    item.source_type !== "editorial" &&
    item.source_type !== "other"
  ) {
    return false;
  }
  if (typeof item.fetched_at !== "string" || item.fetched_at.trim().length === 0) return false;
  return true;
}

/**
 * Debugging helper: forces a fresh fetch and returns a Reddit pipeline audit report.
 * Intended for short-lived tuning, not for end-user usage.
 */
export async function enrichEntryContextDebug(
  entry: Entry,
  _supabase: SupabaseClient
): Promise<{ entry: Entry; redditDebug: RedditTriviaDebugReport }> {
  // Force refresh for debugging.
  const seedEntry = isSeedEntryId(entry.id);

  let triviaItems: EntryTriviaItem[] = [];
  let trivia: string | null = entry.trivia_summary;
  let renditions: EntryRendition[] = entry.renditions ?? [];

  const { items: redditItems, debug: redditDebug } = await fetchRedditTriviaItemsDebug(
    entry.artist_name,
    entry.song_name || entry.album_name
  ).catch((e) => {
    console.error("[entry-context-debug] reddit failed", e);
    return {
      items: [] as EntryTriviaItem[],
      debug: {
        enabled: false,
        searchResultsCount: 0,
        postsConsideredCount: 0,
        postsDroppedReasons: {},
        seedPostsCount: 0,
        threadsFetchedTotal: 0,
        commentsFetchedTotal: 0,
        utterancesCount: 0,
        categoryUtteranceMatches: {
          similar: 0,
          sonic: 0,
          emotional: 0,
          hidden: 0,
          debate: 0,
          stories: 0,
        },
        categoryItemsCreated: {
          similar: 0,
          sonic: 0,
          emotional: 0,
          hidden: 0,
          debate: 0,
          stories: 0,
        },
        extractedItemsCount: 0,
        usedFallback: false,
        persistedTriviaItemsCount: 0,
        finalItemsPreview: [],
      } as RedditTriviaDebugReport,
    };
  });

  triviaItems = redditItems;

  let lastFmText: string | null = null;
  if (isLastFmConfigured()) {
    try {
      lastFmText = await fetchLastFmTrackWikiSummary(
        entry.artist_name,
        entry.song_name || entry.album_name
      );
      const trimmed = lastFmText?.trim() ?? "";
      if (trimmed.length > 0) {
        const existing = new Set(triviaItems.map((item) => item.text.trim().toLowerCase()));
        if (!existing.has(trimmed.toLowerCase())) {
          triviaItems.push({
            text: trimmed,
            source_type: "lastfm",
            source_url: null,
            score: null,
            fetched_at: new Date().toISOString(),
          });
        }
      }
    } catch (e) {
      console.warn("[entry-context-debug] lastfm failed", e);
    }
  }

  try {
    const wikiItems = await fetchWikiTriviaItems(
      entry.artist_name,
      entry.song_name || entry.album_name
    );
    if (wikiItems.length > 0) {
      const existing = new Set(triviaItems.map((item) => item.text.trim().toLowerCase()));
      for (const item of wikiItems) {
        const key = item.text.trim().toLowerCase();
        if (existing.has(key)) continue;
        triviaItems.push(item);
        existing.add(key);
      }
    }
  } catch (e) {
    console.warn("[entry-context-debug] wiki failed", e);
  }

  trivia =
    triviaItems.find((i) => i.source_type === "reddit")?.text?.trim() ??
    lastFmText?.trim() ??
    triviaItems[0]?.text?.trim() ??
    null;

  // How many trivia items would survive the `mapEntryRow` validation layer.
  const persistedTriviaItemsCount = triviaItems.filter(isPersistableTriviaItem).length;
  redditDebug.persistedTriviaItemsCount = persistedTriviaItemsCount;

  const fetchedAt = new Date().toISOString();

  if (isSpotifyConfigured()) {
    renditions = await fetchRenditionsForEntry(
      entry.song_name || entry.album_name,
      entry.artist_name,
      entry.spotify_id,
      5
    );
  }

  const nextEntry: Entry = {
    ...entry,
    trivia_summary: trivia,
    trivia_items: triviaItems,
    renditions,
    context_fetched_at: fetchedAt,
  };

  // In debug mode we do not persist; the UI reads the returned in-memory values.
  if (seedEntry) return { entry: nextEntry, redditDebug };
  return { entry: nextEntry, redditDebug };
}
