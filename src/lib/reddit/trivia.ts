import type { EntryTriviaItem } from "@/types/entry";

const REDDIT_SEARCH_URL = "https://www.reddit.com/search.json";
const MAX_RESULTS = 24;
const MAX_ITEMS = 6;

const SUBREDDIT_ALLOWLIST = new Set([
  "music",
  "letstalkmusic",
  "songwriting",
  "hiphopheads",
  "popheads",
  "indieheads",
  "listentothis",
  "ifyoulikeblank",
  "musicrecommendations",
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

/** Favor posts that read like opinions, stories, or discussion — not promo drops. */
const DISCUSSION_RE =
  /\b(thoughts?|opinion|feel|feels|feeling|discuss|discussion|interpretation|meaning|underrated|overrated|favorite|favourite|recommend|relat(e|es|ed)|memory|memories|cry|cried|goosebumps|hits different|personally|honestly|anyone else|unpopular|hot take|learned|realize|realised|why i love|changed my life|first time i|reminds me|nostalgia|depress|happy when|connect with)\b/i;

const NEWSY_TITLE_RE =
  /\b(official\s*(music\s*)?video|music\s*video|\bmv\b|out now|streaming now|premiere|drops tonight|visualizer|lyric video|audio only|spotify|apple music)\b/i;

function cleanSelftext(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\[deleted\]|\[removed\]/gi, "")
    .trim();
}

function buildSnippet(title: string, selftext: string): string {
  const plain = cleanSelftext(selftext);
  const t = title.trim();
  if (!plain) return t;
  if (plain.length >= 140) {
    const parts = plain.split(/(?<=[.!?])\s+/).filter(Boolean);
    const two = parts.slice(0, 2).join(" ");
    if (two.length >= 72) return two.slice(0, 320).trim();
  }
  const sentence = plain.split(/[.!?]\s+/)[0]?.trim() || plain;
  const merged = sentence.length >= 72 ? sentence : `${t} — ${sentence}`;
  return merged.slice(0, 320).trim();
}

function discussionBoost(combined: string): number {
  let b = 0;
  const hay = normalize(combined);
  if (DISCUSSION_RE.test(combined)) b += 45;
  if (combined.includes("?")) b += 12;
  if (/\b(i|i'm|i've|we|my|me)\b/i.test(combined)) b += 18;
  if (hay.includes(" song ") || hay.endsWith(" song")) b += 4;
  return b;
}

function looksPromoOnly(title: string, selftext: string): boolean {
  const t = title.trim();
  const s = cleanSelftext(selftext);
  if (NEWSY_TITLE_RE.test(t) && s.length < 50) return true;
  return false;
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

  const query = [
    `"${artistName}" "${songName}"`,
    "(",
    [
      "discussion",
      "thoughts",
      "opinion",
      "feelings",
      "interpretation",
      "meaning",
      "underrated",
      "overrated",
      "favorite",
      "recommend",
      "relate",
      "memories",
      "learned",
      "anyone else",
      "hits different",
      "what do you think",
    ].join(" OR "),
    ")",
  ].join(" ");

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
    const bodyLen = cleanSelftext(selftext).length;

    if (looksPromoOnly(title, selftext)) continue;

    const hasSubstance =
      bodyLen >= 56 ||
      (DISCUSSION_RE.test(combined) && bodyLen >= 28) ||
      (title.includes("?") && bodyLen >= 20) ||
      comments >= 12;

    if (!hasSubstance) continue;

    let score =
      tokenHits * 8 +
      discussionBoost(combined) +
      Math.log10(Math.max(1, ups + 1)) * 4 +
      Math.log10(Math.max(1, comments + 1)) * 14 +
      Math.min(bodyLen, 400) * 0.06;

    if (bodyLen < 40) score -= 22;

    const text = buildSnippet(title, selftext);
    if (!text || text.length < 28) continue;

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
