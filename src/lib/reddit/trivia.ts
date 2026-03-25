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

export type RabbitCategory =
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

export type RedditTriviaDebugReport = {
  enabled: boolean;
  searchResultsCount: number;
  postsConsideredCount: number;
  postsDroppedReasons: Record<string, number>;
  seedPostsCount: number;
  threadsFetchedTotal: number;
  commentsFetchedTotal: number;
  utterancesCount: number;
  categoryUtteranceMatches: Record<RabbitCategory, number>;
  categoryItemsCreated: Record<RabbitCategory, number>;
  extractedItemsCount: number;
  usedFallback: boolean;
  persistedTriviaItemsCount: number;
  finalItemsPreview: string[];
};

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

function windowAroundMatch(raw: string, rx: RegExp, maxLen: number): string {
  const text = cleanText(raw);
  try {
    const m = rx.exec(text);
    if (m && typeof m.index === "number") {
      const start = Math.max(0, m.index - 70);
      const end = Math.min(text.length, m.index + m[0].length + (maxLen - 80));
      return text.slice(start, end).trim();
    }
  } catch {
    // ignore
  }
  return text.slice(0, maxLen).trim();
}

function extractEntitiesForCategory(raw: string, category: RabbitCategory): string[] {
  const text = cleanText(raw);
  const addUnique = (arr: string[], v: string) => {
    const cleaned = v.trim().replace(/^["'`]+|["'`]+$/g, "");
    if (!cleaned) return arr;
    if (arr.includes(cleaned)) return arr;
    arr.push(cleaned);
    return arr;
  };

  const out: string[] = [];
  let m: RegExpMatchArray | null = null;

  switch (category) {
    case "similar": {
      m = text.match(
        /\b(sounds like|reminds me of|similar to|same vibe|same era|same producer|in the lane of)\b[^A-Za-z0-9]{0,15}([^.!?]{3,80})/i
      );
      if (m?.[2]) {
        const parts = m[2].split(/,| and | & /i).map((s) => s.trim());
        for (const p of parts) {
          if (!p) continue;
          if (p.length < 3) continue;
          addUnique(out, p.slice(0, 46));
          if (out.length >= 3) break;
        }
      }
      break;
    }
    case "sonic": {
      const producerMatch = text.match(
        /\b(produced by|producer)\b[^A-Za-z0-9]{0,10}([^.!?]{2,70})/i
      );
      const sampleMatch = text.match(
        /\b(sampled?|sample|interpolation)\b[^A-Za-z0-9]{0,10}([^.!?]{2,70})/i
      );
      if (producerMatch?.[2]) addUnique(out, producerMatch[2].slice(0, 46));
      if (sampleMatch?.[2]) addUnique(out, sampleMatch[2].slice(0, 46));
      const instrumentHints: Array<[string, string]> = [
        ["808", "808"],
        ["synth", "synth"],
        ["guitar", "guitar"],
        ["strings", "strings"],
        ["piano", "piano"],
        ["drum", "drums"],
        ["reverb", "reverb"],
        ["distortion", "distortion"],
      ];
      for (const [needle, token] of instrumentHints) {
        if (out.length >= 3) break;
        if (new RegExp(`\\b${needle}\\b`, "i").test(text)) addUnique(out, token);
      }
      break;
    }
    case "emotional": {
      m = text.match(
        /\b(feels like|makes me feel|hits different|haunting|nostalgia|intimate|cathartic)\b([^.!?]{3,90})/i
      );
      if (m?.[2]) {
        const phrase = m[2].trim().split(/,|;|\s{2,}/)[0].trim();
        if (phrase) addUnique(out, phrase.split(" ").slice(0, 6).join(" "));
      }
      break;
    }
    case "hidden": {
      m = text.match(
        /\b(underrated|slept on|deep cut|nobody talks about|rarely mentioned|hidden gem|criminally ignored|buried)\b[^A-Za-z0-9]{0,10}([^.!?]{2,70})/i
      );
      if (m?.[2]) {
        const parts = m[2].split(/,| and | & /i).map((s) => s.trim());
        for (const p of parts) {
          if (!p) continue;
          addUnique(out, p.slice(0, 46));
          if (out.length >= 2) break;
        }
      }
      break;
    }
    case "debate": {
      m = text.match(
        /\b(overrated|underrated|skip|no skip|hot take|unpopular opinion)\b[^A-Za-z0-9]{0,10}([^.!?]{2,70})/i
      );
      if (m?.[2]) {
        addUnique(out, m[2].slice(0, 46));
      }
      break;
    }
    case "stories": {
      m = text.match(
        /\b(first time i heard|when i|in the car|during college|after my breakup|at my wedding|at my funeral|got me through|helped me|saved me)\b([^.!?]{0,90})/i
      );
      if (m) {
        const trigger = m[1]?.trim();
        const tail = (m[2] ?? "").trim();
        if (trigger) addUnique(out, trigger);
        if (tail) {
          const t2 = tail.split(/[,.]/)[0].trim();
          if (t2) addUnique(out, t2.slice(0, 40));
        }
      }
      break;
    }
  }

  return out.slice(0, 3);
}

function buildWhySnippet(raw: string, category: RabbitCategory): string {
  const text = cleanText(raw);
  const spec = CATEGORY_SPECS.find((s) => s.key === category);
  if (!spec) return text.slice(0, 90);
  return windowAroundMatch(text, spec.regex, 140);
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

function buildCategoryItemsWithDebug(
  utterances: ThreadUtterance[],
  nowIso: string
): {
  items: EntryTriviaItem[];
  categoryUtteranceMatches: Record<RabbitCategory, number>;
  categoryItemsCreated: Record<RabbitCategory, number>;
  extractedItemsCount: number;
} {
  const resultsByCategory = new Map<RabbitCategory, EntryTriviaItem[]>();
  const globalSeen = new Set<string>();
  const categoryUtteranceMatches = {} as Record<RabbitCategory, number>;
  const categoryItemsCreated = {} as Record<RabbitCategory, number>;
  for (const spec of CATEGORY_SPECS) {
    categoryUtteranceMatches[spec.key] = 0;
    categoryItemsCreated[spec.key] = 0;
  }

  for (const utterance of utterances) {
    const raw = utterance.text;
    const snippet = quoteSnippet(raw);
    if (snippet.length < 36) continue;

    for (const category of CATEGORY_SPECS) {
      if (!category.regex.test(raw)) continue;
      categoryUtteranceMatches[category.key] += 1;

      const dedupeKey = `${category.key}:${normalize(snippet).slice(0, 150)}`;
      if (globalSeen.has(dedupeKey)) continue;
      globalSeen.add(dedupeKey);
      categoryItemsCreated[category.key] += 1;

      let score = utterance.threadBaseScore + category.bonus;
      score += Math.log10(Math.max(1, utterance.commentUps + 1)) * 8;
      if (utterance.isComment) score += 12;
      if (OPINION_RE.test(raw)) score += 18;
      if (/\b(i|i'm|i've|my|me|we)\b/i.test(raw)) score += 10;
      if (raw.length >= 260) score += 8;

      const entities = extractEntitiesForCategory(raw, category.key);
      const why = buildWhySnippet(raw, category.key);
      const entityPart = entities.length ? ` · [${entities.join(", ")}]` : "";
      const whyPart = why ? ` — ${why}` : "";
      const label = category.key === "hidden" ? `Hidden gem:` : category.label;
      const fullText = `${label} · r/${utterance.subreddit}: "${snippet}"${entityPart}${whyPart}`;
      const text =
        fullText.length > 560 ? `${fullText.slice(0, 560).trim()}...` : fullText;
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

  const extractedItemsCount = Object.values(categoryItemsCreated).reduce(
    (a, b) => a + b,
    0
  );

  return {
    items: ordered.slice(0, MAX_ITEMS),
    categoryUtteranceMatches,
    categoryItemsCreated,
    extractedItemsCount,
  };
}

export function isRedditTriviaEnabled(): boolean {
  return process.env.REDDIT_TRIVIA_ENABLED?.trim() === "1";
}

export async function fetchRedditTriviaItems(
  artist: string,
  song: string
): Promise<EntryTriviaItem[]> {
  const { items } = await fetchRedditTriviaItemsInternal(artist, song, false);
  return items;
}

export async function fetchRedditTriviaItemsDebug(
  artist: string,
  song: string
): Promise<{ items: EntryTriviaItem[]; debug: RedditTriviaDebugReport }> {
  return fetchRedditTriviaItemsInternal(artist, song, true);
}

async function fetchRedditTriviaItemsInternal(
  artist: string,
  song: string,
  debugEnabled: boolean
): Promise<{ items: EntryTriviaItem[]; debug: RedditTriviaDebugReport }> {
  const emptyCategoryCounts = () =>
    ({
      similar: 0,
      sonic: 0,
      emotional: 0,
      hidden: 0,
      debate: 0,
      stories: 0,
    }) as Record<RabbitCategory, number>;

  const debug: RedditTriviaDebugReport = {
    enabled: debugEnabled,
    searchResultsCount: 0,
    postsConsideredCount: 0,
    postsDroppedReasons: {},
    seedPostsCount: 0,
    threadsFetchedTotal: 0,
    commentsFetchedTotal: 0,
    utterancesCount: 0,
    categoryUtteranceMatches: emptyCategoryCounts(),
    categoryItemsCreated: emptyCategoryCounts(),
    extractedItemsCount: 0,
    usedFallback: false,
    persistedTriviaItemsCount: 0,
    finalItemsPreview: [],
  };

  if (!isRedditTriviaEnabled()) return { items: [], debug: { ...debug, enabled: false } };
  const artistName = artist.trim();
  const songName = song.trim();
  if (!artistName || !songName) return { items: [], debug: { ...debug, enabled: false } };

  const query = [
    `${artistName} ${songName}`,
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
    return { items: [], debug };
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

  debug.searchResultsCount = data.data?.children?.length ?? 0;

  const incDropped = (reason: string) => {
    debug.postsDroppedReasons[reason] = (debug.postsDroppedReasons[reason] ?? 0) + 1;
  };

  const artistTokens = tokenize(artistName);
  const songTokens = tokenize(songName);
  const requiredTokens = Array.from(new Set([...artistTokens, ...songTokens]));
  const posts: SearchPost[] = [];

  for (const child of data.data?.children ?? []) {
    const p = child.data;
    if (!p) {
      incDropped("missing_child_data");
      continue;
    }
    const title = (p.title || "").trim();
    const selftext = (p.selftext || "").trim();
    const subreddit = normalize(p.subreddit || "");
    const permalink = (p.permalink || "").trim();
    const id = (p.id || "").trim();
    if (!title || !id || !permalink) {
      incDropped("missing_fields");
      continue;
    }
    if (SUBREDDIT_ALLOWLIST.size > 0 && !SUBREDDIT_ALLOWLIST.has(subreddit)) {
      incDropped("subreddit_filtered");
      continue;
    }
    if (looksPromoOnly(title, selftext)) {
      incDropped("promo_only");
      continue;
    }

    const combined = `${title} ${selftext}`.trim();
    const tokenHits = countTokenHits(combined, requiredTokens);
    if (tokenHits < Math.min(1, requiredTokens.length)) {
      incDropped("token_gate");
      continue;
    }

    const ups = typeof p.ups === "number" ? p.ups : 0;
    const comments = typeof p.num_comments === "number" ? p.num_comments : 0;
    const baseScore = tokenHits * 8 + threadBaseScore(combined, ups, comments);
    if (comments < 1 && cleanText(selftext).length < 30) {
      incDropped("low_comment_or_short_selftext");
      continue;
    }

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
    debug.postsConsideredCount += 1;
  }

  posts.sort((a, b) => b.baseScore - a.baseScore);
  const seedPosts = posts.slice(0, MAX_THREADS_FOR_COMMENTS);
  debug.seedPostsCount = seedPosts.length;
  const nowIso = new Date().toISOString();

  const utterances: ThreadUtterance[] = [];
  let commentsFetchedTotal = 0;
  for (const post of seedPosts) {
    const comments = await fetchThreadComments(post.permalink);
    commentsFetchedTotal += comments.length;
    utterances.push(...createUtterances(post, comments));
  }
  debug.threadsFetchedTotal = seedPosts.length;
  debug.commentsFetchedTotal = commentsFetchedTotal;
  debug.utterancesCount = utterances.length;

  const { items: categoryItems, categoryUtteranceMatches, categoryItemsCreated, extractedItemsCount } =
    buildCategoryItemsWithDebug(utterances, nowIso);
  debug.categoryUtteranceMatches = categoryUtteranceMatches;
  debug.categoryItemsCreated = categoryItemsCreated;
  debug.extractedItemsCount = extractedItemsCount;

  if (categoryItems.length > 0) {
    debug.usedFallback = false;
    debug.finalItemsPreview = categoryItems.slice(0, 3).map((i) => i.text);
    debug.persistedTriviaItemsCount = categoryItems.filter(
      (i) =>
        typeof i.text === "string" &&
        i.text.trim().length > 0 &&
        i.source_type === "reddit" &&
        typeof i.fetched_at === "string" &&
        i.fetched_at.trim().length > 0
    ).length;
    return { items: categoryItems, debug };
  }

  debug.usedFallback = true;
  // Category extraction sometimes misses even when we have utterances; in that
  // case, surface the strongest raw listener utterances so the UI doesn't
  // degrade into “still digging”.
  const rankedUtterances = [...utterances].sort((a, b) => {
    const aScore =
      a.threadBaseScore +
      (a.isComment ? 50 : 10) +
      Math.log10(Math.max(1, a.commentUps + 1)) * 20;
    const bScore =
      b.threadBaseScore +
      (b.isComment ? 50 : 10) +
      Math.log10(Math.max(1, b.commentUps + 1)) * 20;
    return bScore - aScore;
  });

  const fallbackUtterances = rankedUtterances.slice(0, 3);
  const fallbackItems: EntryTriviaItem[] = fallbackUtterances.map((u) => ({
    text: `Listener take · r/${u.subreddit}: "${quoteSnippet(u.text)}"`,
    source_type: "reddit",
    source_url: toSourceUrl(u.permalink),
    score: Number(
      (
        u.threadBaseScore +
        (u.isComment ? 50 : 10) +
        Math.log10(Math.max(1, u.commentUps + 1)) * 20
      ).toFixed(2)
    ),
    fetched_at: nowIso,
  }));

  debug.finalItemsPreview = fallbackItems.slice(0, 3).map((i) => i.text);
  debug.persistedTriviaItemsCount = fallbackItems.filter(
    (i) =>
      typeof i.text === "string" &&
      i.text.trim().length > 0 &&
      i.source_type === "reddit" &&
      typeof i.fetched_at === "string" &&
      i.fetched_at.trim().length > 0
  ).length;
  return { items: fallbackItems, debug };
}
