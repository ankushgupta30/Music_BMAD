import type { EntryTriviaItem } from "@/types/entry";

const REDDIT_SEARCH_URL = "https://www.reddit.com/search.json";
const MAX_RESULTS = 20;
const MAX_ITEMS = 3;

const SUBREDDIT_ALLOWLIST = new Set([
  "music",
  "letstalkmusic",
  "songwriting",
  "hiphopheads",
  "popheads",
  "indieheads",
  "listentothis",
]);

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length > 2);
}

function countTokenHits(text: string, tokens: string[]): number {
  const hay = normalize(text);
  let hits = 0;
  for (const token of tokens) {
    if (hay.includes(token)) hits += 1;
  }
  return hits;
}

function buildSnippet(title: string, selftext: string): string {
  const plain = selftext.replace(/\s+/g, " ").trim();
  if (!plain) return title.trim();
  const sentence = plain.split(/[.!?]\s+/)[0]?.trim() || plain;
  const merged = sentence.length >= 56 ? sentence : `${title.trim()} — ${sentence}`;
  return merged.slice(0, 280).trim();
}

function toSourceUrl(permalink: string): string | null {
  if (!permalink || typeof permalink !== "string") return null;
  return `https://www.reddit.com${permalink}`;
}

export function isRedditTriviaEnabled(): boolean {
  return process.env.REDDIT_TRIVIA_ENABLED?.trim() === "1";
}

export async function fetchRedditTriviaItems(
  artist: string,
  song: string
): Promise<EntryTriviaItem[]> {
  if (!isRedditTriviaEnabled()) return [];
  const artistName = artist.trim();
  const songName = song.trim();
  if (!artistName || !songName) return [];

  const query = `"${artistName}" "${songName}" (meaning OR story OR trivia OR interview)`;
  const params = new URLSearchParams({
    q: query,
    sort: "relevance",
    t: "all",
    limit: String(MAX_RESULTS),
    type: "link",
  });

  const res = await fetch(`${REDDIT_SEARCH_URL}?${params.toString()}`, {
    headers: {
      "User-Agent": "rewind-trivia-bot/1.0",
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.warn("[reddit] search failed", res.status);
    return [];
  }

  const data = (await res.json()) as {
    data?: {
      children?: Array<{
        data?: {
          title?: string;
          selftext?: string;
          subreddit?: string;
          ups?: number;
          num_comments?: number;
          permalink?: string;
        };
      }>;
    };
  };

  const artistTokens = tokenize(artistName);
  const songTokens = tokenize(songName);
  const requiredTokens = Array.from(new Set([...artistTokens, ...songTokens]));
  const nowIso = new Date().toISOString();

  const candidates: EntryTriviaItem[] = [];
  for (const child of data.data?.children ?? []) {
    const post = child.data;
    if (!post) continue;
    const title = (post.title || "").trim();
    const selftext = (post.selftext || "").trim();
    const subreddit = normalize(post.subreddit || "");
    if (!title) continue;
    if (SUBREDDIT_ALLOWLIST.size > 0 && !SUBREDDIT_ALLOWLIST.has(subreddit)) continue;

    const combined = `${title} ${selftext}`.trim();
    const tokenHits = countTokenHits(combined, requiredTokens);
    if (tokenHits < Math.min(2, requiredTokens.length)) continue;

    const ups = typeof post.ups === "number" ? post.ups : 0;
    const comments = typeof post.num_comments === "number" ? post.num_comments : 0;
    const score = tokenHits * 10 + Math.log10(Math.max(1, ups + 1)) * 5 + Math.log10(Math.max(1, comments + 1)) * 3;
    const text = buildSnippet(title, selftext);
    if (!text || text.length < 24) continue;

    candidates.push({
      text,
      source_type: "reddit",
      source_url: toSourceUrl(post.permalink || ""),
      score: Number(score.toFixed(2)),
      fetched_at: nowIso,
    });
  }

  candidates.sort((a, b) => (b.score ?? 0) - (a.score ?? 0));
  const deduped: EntryTriviaItem[] = [];
  const seen = new Set<string>();
  for (const item of candidates) {
    const key = normalize(item.text).slice(0, 120);
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(item);
    if (deduped.length >= MAX_ITEMS) break;
  }

  return deduped;
}

