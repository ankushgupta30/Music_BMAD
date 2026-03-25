import { NextResponse } from "next/server";
import { requireAdminClient } from "@/lib/supabase/admin";
import { fetchRedditTriviaItemsDebug } from "@/lib/reddit/trivia";
import type { RedditTriviaDebugReport } from "@/lib/reddit/trivia";
import { SEED_ENTRIES } from "@/lib/utils/seedData";

function inferFailureStage(debug: RedditTriviaDebugReport): string {
  if (debug.searchResultsCount === 0) return "search_empty";
  if (debug.postsConsideredCount === 0) return "filtered_out";
  if (debug.seedPostsCount === 0) return "seed_empty";
  if (debug.threadsFetchedTotal === 0) return "thread_fetch_issue";
  if (debug.commentsFetchedTotal === 0) return "comments_empty";
  if (debug.extractedItemsCount === 0 && debug.usedFallback) return "category_miss_fallback";
  if (debug.extractedItemsCount === 0) return "category_miss";
  if (debug.persistedTriviaItemsCount === 0) return "persistence_mapping_drop";
  return "ok";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limitRaw = searchParams.get("limit");
  const limit =
    limitRaw != null && /^\d+$/.test(limitRaw)
      ? Math.min(30, Math.max(1, parseInt(limitRaw, 10)))
      : 30;

  let sample: Array<{
    id: string;
    artist_name: string;
    song_name: string | null;
    album_name: string | null;
  }> = [];

  try {
    const admin = requireAdminClient();
    const { data: rows, error } = await admin
      .from("entries")
      .select("id, artist_name, song_name, album_name")
      .order("updated_at", { ascending: true })
      .limit(limit);

    if (!error && rows) {
      sample = rows
        .map((r) => ({
          id: String(r.id),
          artist_name: String(r.artist_name),
          song_name: r.song_name ? String(r.song_name) : null,
          album_name: r.album_name ? String(r.album_name) : null,
        }))
        .filter((r) => !!r.artist_name && !!(r.song_name || r.album_name));
    }
  } catch {
    // Fall back to local seed data when admin credentials aren't available.
  }

  if (sample.length === 0) {
    sample = SEED_ENTRIES.slice(0, limit).map((e) => ({
      id: e.id,
      artist_name: e.artist_name,
      song_name: e.song_name ?? e.album_name,
      album_name: e.album_name,
    }));
  }

  const results: Array<{
    entryId: string;
    artistName: string;
    songQuery: string;
    stage: string;
    redditDebug: RedditTriviaDebugReport;
  }> = [];

  for (const row of sample) {
    const songQuery = (row.song_name || row.album_name) as string;
    const reddit = await fetchRedditTriviaItemsDebug(row.artist_name, songQuery).catch(
      (e) => {
        console.error("[reddit-audit] fetch failed", { entryId: row.id, error: e });
        return {
          items: [],
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
      }
    );

    results.push({
      entryId: String(row.id),
      artistName: row.artist_name as string,
      songQuery,
      stage: inferFailureStage(reddit.debug),
      redditDebug: reddit.debug,
    });
  }

  const stages: Record<string, number> = {};
  for (const r of results) stages[r.stage] = (stages[r.stage] ?? 0) + 1;

  return NextResponse.json({
    limit: sample.length,
    stages,
    results,
  });
}

