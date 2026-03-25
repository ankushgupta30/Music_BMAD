import type { EntryTriviaItem } from "@/types/entry";

const REDDIT_SEARCH_URL = "https://www.reddit.com/search.json";
const MAX_RESULTS = 28;
const MAX_ITEMS = 8;
const MAX_THREADS_FOR_COMMENTS = 6;
const MAX_COMMENTS_PER_THREAD = 10;
const SNIPPET_MAX = 420;

/**
 * Keep broad coverage: community context matters and many songs surface in
 * artist-specific or niche subreddits.
 */
const SUBREDDIT_ALLOWLIST = new Set<string>();

type SearchPost = {
  id: string;
  title: string;
  selftext: string;
  subreddit: string;
  ups: number;
  comments: number;
  permalink: string;
  baseScore: number;
};

type ThreadUtterance = {
  text: string;
  subreddit: string;
  permalink: string;
  threadBaseScore: number;
  commentUps: number;
  isComment: boolean;
};

type RabbitCategory =
  | "similar"
  | "sonic"
  | "emotional"
  | "hidden"
  | "debate"
  | "stories";

type CategorySpec = {
  key: RabbitCategory;
  label: string;
  regex: RegExp;
  bonus: number;
};

const CATEGORY_SPECS: CategorySpec[] = [
  {
    key: "similar",
    label: "Similar sounds",
    regex:
      /\b(sounds like|reminds me of|similar to|if you like|same vibe|same era|same producer|in the lane of|adjacent to|like a mix of|gives me .* vibes)\b/i,
    bonus: 28,
  },
  {
    key: "sonic",
    label: "Sonic detail",
    regex:
      /\b(sample|sampled|producer|produced by|mix|master|drum|snare|bassline|808|synth|guitar|strings|keys|vocal chain|reverb|distortion|recorded|session|arrangement|interpolation)\b/i,
    bonus: 22,
  },
  {
    key: "emotional",
    label: "Emotional texture",
    regex:
      /\b(feels like|makes me feel|hits different|haunting|warm|cold|dark|melancholy|euphoric|nostalgia|intimate|cinematic|weightless|raw|cathartic|chills|goosebumps)\b/i,
    bonus: 22,
  },
  {
    key: "hidden",
    label: "Hidden gem",
    regex:
      /\b(underrated|slept on|deep cut|nobody talks about|rarely mentioned|obscure|hidden gem|criminally ignored|buried)\b/i,
    bonus: 30,
  },
  {
    key: "debate",
    label: "Debate",
    regex:
      /\b(overrated|underrated|skip|no skip|mid|best track|worst track|hot take|unpopular opinion|disagree|hard disagree|washed|classic)\b|\?/i,
    bonus: 24,
  },
  {
    key: "stories",
    label: "Personal story",
    regex:
      /\b(i remember|when i|my dad|my mom|my brother|my sister|at my wedding|at my funeral|after my breakup|during college|in high school|in the car|first time i heard|helped me|saved me|got me through)\b/i,
    bonus: 34,
  },
];

const DISCUSSION_RE =
  /\b(thoughts?|opinion|feel|discussion|interpretation|meaning|favorite|favourite|personally|honestly|unpopular|hot take|anyone else|why i love|first time i|reminds me|essay|deep dive|reference(s)? behind|breakdown|analysis)\b/i;

const OPINION_RE =
  /\b(imo|in my opinion|i think|i feel|i wish|i love|i hate|makes me|we should|really wish|slaps?|\bmid\b|bloat|bloated|normalize|rant|vibes?|biased|deluxe|dont pad|don't pad)\b/i;

const NEWSY_TITLE_RE =
  /\b(official\s*(music\s*)?video|music\s*video|\bmv\b|out now|streaming now|premiere|drops tonight|visualizer|lyric video|audio only|spotify|apple music)\b/i;

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

function cleanText(raw: string): string {
  return raw
    .replace(/\s+/g, " ")
    .replace(/\[deleted\]|\[removed\]/gi, "")
    .trim();
}

function firstSentences(text: string, maxSentences: number, maxChars: number): string {
  const parts = text.split(/(?<=[.!?])\s+/).filter(Boolean);
  let out = "";
  for (let i = 0; i < Math.min(maxSentences, parts.length); i++) {
    const next = out ? `${out} ${parts[i]}` : parts[i];
    if (next.length > maxChars) break;
    out = next;
  }
  return out.trim();
}

function quoteSnippet(text: string): string {
  const plain = cleanText(text);
  if (!plain) return "";
  const chosen =
    plain.length >= 220
      ? firstSentences(plain, 3, SNIPPET_MAX)
      : plain.length >= 120
        ? firstSentences(plain, 2, SNIPPET_MAX)
        : plain.slice(0, SNIPPET_MAX);
  return chosen.trim();
}

function toSourceUrl(permalink: string): string | null {
  if (!permalink || typeof permalink !== "string") return null;
  return `https://www.reddit.com${permalink}`;
}

function looksPromoOnly(title: string, selftext: string): boolean {
  const t = title.trim();
  const s = cleanText(selftext);
  return NEWSY_TITLE_RE.test(t) && s.length < 50;
}

function threadBaseScore(rawText: string, ups: number, comments: number): number {
  let score = 0;
  if (DISCUSSION_RE.test(rawText)) score += 45;
  if (OPINION_RE.test(rawText)) score += 40;
  if (/\b(i|i'm|i've|my|me|we)\b/i.test(rawText)) score += 20;
  score += Math.log10(Math.max(1, ups + 1)) * 4;
  score += Math.log10(Math.max(1, comments + 1)) * 10;
  return score;
}

async function fetchThreadComments(permalink: string): Promise<Array<{ body: string; ups: number; permalink: string }>> {
  const url = `https://www.reddit.com${permalink}.json?sort=top&limit=${MAX_COMMENTS_PER_THREAD}&depth=1`;
  const res = await fetch(url, {
    headers: { "User-Agent": "rewind-trivia-bot/1.0" },
    next: { revalidate: 0 },
  });
  if (!res.ok) return [];

  const json = (await res.json()) as Array<{
    data?: {
      children?: Array<{
        kind?: string;
        data?: {
          body?: string;
          ups?: number;
          permalink?: string;
        };
      }>;
    };
  }>;

  const listing = json[1];
  const out: Array<{ body: string; ups: number; permalink: string }> = [];
  for (const child of listing?.data?.children ?? []) {
    if (child.kind !== "t1") continue;
    const body = cleanText(child.data?.body || "");
    if (body.length < 24) continue;
    const commentPermalink = child.data?.permalink || permalink;
    out.push({
      body,
      ups: typeof child.data?.ups === "number" ? child.data.ups : 0,
      permalink: commentPermalink,
    });
  }
  return out;
}

function createUtterances(post: SearchPost, comments: Array<{ body: string; ups: number; permalink: string }>): ThreadUtterance[] {
  const out: ThreadUtterance[] = [];
  const self = cleanText(post.selftext);
  if (self.length > 0) {
    out.push({
      text: `${post.title}. ${self}`,
      subreddit: post.subreddit,
      permalink: post.permalink,
      threadBaseScore: post.baseScore + 8,
      commentUps: post.ups,
      isComment: false,
    });
  } else {
    out.push({
      text: post.title,
      subreddit: post.subreddit,
      permalink: post.permalink,
      threadBaseScore: post.baseScore,
      commentUps: post.ups,
      isComment: false,
    });
  }
  for (const c of comments) {
    out.push({
      text: c.body,
      subreddit: post.subreddit,
      permalink: c.permalink,
      threadBaseScore: post.baseScore,
      commentUps: c.ups,
      isComment: true,
    });
  }
  return out;
}

function buildCategoryItems(utterances: ThreadUtterance[], nowIso: string): EntryTriviaItem[] {
  const resultsByCategory = new Map<RabbitCategory, EntryTriviaItem[]>();
  const globalSeen = new Set<string>();

  for (const utterance of utterances) {
    const raw = utterance.text;
    const snippet = quoteSnippet(raw);
    if (snippet.length < 36) continue;

    for (const category of CATEGORY_SPECS) {
      if (!category.regex.test(raw)) continue;
      const dedupeKey = `${category.key}:${normalize(snippet).slice(0, 150)}`;
      if (globalSeen.has(dedupeKey)) continue;
      globalSeen.add(dedupeKey);

      let score = utterance.threadBaseScore + category.bonus;
      score += Math.log10(Math.max(1, utterance.commentUps + 1)) * 8;
      if (utterance.isComment) score += 12;
      if (OPINION_RE.test(raw)) score += 18;
      if (/\b(i|i'm|i've|my|me|we)\b/i.test(raw)) score += 10;
      if (raw.length >= 260) score += 8;

      const text = `${category.label} · r/${utterance.subreddit}: "${snippet}"`;
      const item: EntryTriviaItem = {
        text,
        source_type: "reddit",
        source_url: toSourceUrl(utterance.permalink),
        score: Number(score.toFixed(2)),
        fetched_at: nowIso,
      };

      const arr = resultsByCategory.get(category.key) ?? [];
      arr.push(item);
      resultsByCategory.set(category.key, arr);
    }
  }

  const ordered: EntryTriviaItem[] = [];
  for (const spec of CATEGORY_SPECS) {
    const candidates = (resultsByCategory.get(spec.key) ?? []).sort(
      (a, b) => (b.score ?? 0) - (a.score ?? 0)
    );
    if (candidates[0]) ordered.push(candidates[0]);
    if (spec.key === "hidden" && candidates[1]) ordered.push(candidates[1]);
  }

  return ordered.slice(0, MAX_ITEMS);
}

export function isRedditTriviaEnabled(): boolean {
  return process.env.REDDIT_TRIVIA_ENABLED?.trim() === "1";
}

export async function fetchRedditTriviaItems(artist: string, song: string): Promise<EntryTriviaItem[]> {
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
      "meaning",
      "interpretation",
      "memories",
      "\"what do you think\"",
      "\"hits different\"",
      "\"hot take\"",
      "\"unpopular opinion\"",
      "\"reference behind\"",
      "\"sounds like\"",
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
    headers: { "User-Agent": "rewind-trivia-bot/1.0" },
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
          id?: string;
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
  const posts: SearchPost[] = [];

  for (const child of data.data?.children ?? []) {
    const p = child.data;
    if (!p) continue;
    const title = (p.title || "").trim();
    const selftext = (p.selftext || "").trim();
    const subreddit = normalize(p.subreddit || "");
    const permalink = (p.permalink || "").trim();
    const id = (p.id || "").trim();
    if (!title || !id || !permalink) continue;
    if (SUBREDDIT_ALLOWLIST.size > 0 && !SUBREDDIT_ALLOWLIST.has(subreddit)) continue;
    if (looksPromoOnly(title, selftext)) continue;

    const combined = `${title} ${selftext}`.trim();
    const tokenHits = countTokenHits(combined, requiredTokens);
    if (tokenHits < Math.min(1, requiredTokens.length)) continue;

    const ups = typeof p.ups === "number" ? p.ups : 0;
    const comments = typeof p.num_comments === "number" ? p.num_comments : 0;
    const baseScore = tokenHits * 8 + threadBaseScore(combined, ups, comments);
    if (comments < 2 && cleanText(selftext).length < 40) continue;

    posts.push({
      id,
      title,
      selftext,
      subreddit,
      ups,
      comments,
      permalink,
      baseScore,
    });
  }

  posts.sort((a, b) => b.baseScore - a.baseScore);
  const seedPosts = posts.slice(0, MAX_THREADS_FOR_COMMENTS);
  const nowIso = new Date().toISOString();

  const utterances: ThreadUtterance[] = [];
  for (const post of seedPosts) {
    const comments = await fetchThreadComments(post.permalink);
    utterances.push(...createUtterances(post, comments));
  }

  const items = buildCategoryItems(utterances, nowIso);
  if (items.length > 0) return items;

  // Fallback if category extraction misses everything.
  return seedPosts.slice(0, 3).map((post) => ({
    text: `Discussion · r/${post.subreddit}: "${quoteSnippet(post.selftext || post.title)}"`,
    source_type: "reddit",
    source_url: toSourceUrl(post.permalink),
    score: Number(post.baseScore.toFixed(2)),
    fetched_at: nowIso,
  }));
}
