import type { EntryTriviaItem } from "@/types/entry";

const WIKI_API = "https://en.wikipedia.org/w/api.php";
const USER_AGENT =
  "RewindSongList/1.0 (https://github.com/; entry trivia enrichment)";

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, " ").trim();
}

function tokenize(s: string): string[] {
  return normalize(s)
    .split(/[^a-z0-9]+/g)
    .filter((t) => t.length > 2);
}

function stripDisambiguationNoise(text: string): boolean {
  return normalize(text).includes("may refer to:");
}

function isRelevantToTrack(
  title: string,
  extract: string,
  artistTokens: string[],
  songTokens: string[]
): boolean {
  const hay = normalize(`${title} ${extract}`);
  const needArtist = artistTokens.length > 0;
  const needSong = songTokens.length > 0;
  const artistOk =
    !needArtist || artistTokens.some((tok) => hay.includes(tok));
  const songOk = !needSong || songTokens.some((tok) => hay.includes(tok));
  return artistOk && songOk;
}

function sanitizeExtract(raw: string, maxLen: number): string {
  let s = raw.replace(/\s+/g, " ").trim();
  s = s.replace(/\s*\([^)]*disambiguation[^)]*\)/gi, "");
  if (s.length <= maxLen) return s;
  const slice = s.slice(0, maxLen);
  const lastPeriod = slice.lastIndexOf(". ");
  const cut = lastPeriod > 80 ? lastPeriod + 1 : maxLen;
  return slice.slice(0, cut).trim();
}

type WikiSearchHit = { title?: string; snippet?: string; pageid?: number };

type WikiPage = {
  title?: string;
  extract?: string;
  fullurl?: string;
};

async function wikiGet(params: Record<string, string>): Promise<unknown> {
  const u = new URL(WIKI_API);
  for (const [k, v] of Object.entries(params)) {
    u.searchParams.set(k, v);
  }
  u.searchParams.set("format", "json");
  const res = await fetch(u.toString(), {
    headers: { "User-Agent": USER_AGENT },
    next: { revalidate: 3600 },
  });
  if (!res.ok) {
    console.warn("[wiki] api failed", res.status);
    return null;
  }
  return res.json();
}

export async function fetchWikiTriviaItems(
  artist: string,
  song: string
): Promise<EntryTriviaItem[]> {
  const artistName = artist.trim();
  const songName = song.trim();
  if (!artistName || !songName) return [];

  const artistTokens = tokenize(artistName);
  const songTokens = tokenize(songName);

  const srsearch = `"${songName}" ${artistName}`;
  const searchJson = (await wikiGet({
    action: "query",
    list: "search",
    srsearch,
    srlimit: "5",
  })) as {
    query?: { search?: WikiSearchHit[] };
  } | null;

  const hits = searchJson?.query?.search ?? [];
  const pageIds: number[] = [];
  for (const h of hits) {
    const t = (h.title || "").trim();
    const pid = typeof h.pageid === "number" ? h.pageid : NaN;
    if (!t || !Number.isFinite(pid)) continue;
    if (normalize(t).endsWith("(disambiguation)")) continue;
    pageIds.push(pid);
  }
  if (pageIds.length === 0) return [];

  const pageJson = (await wikiGet({
    action: "query",
    prop: "extracts|info",
    explaintext: "1",
    exintro: "1",
    redirects: "1",
    inprop: "url",
    pageids: pageIds.slice(0, 3).join("|"),
  })) as {
    query?: { pages?: Record<string, WikiPage> };
  } | null;

  const pages = pageJson?.query?.pages ?? {};
  const nowIso = new Date().toISOString();

  for (const pid of pageIds.slice(0, 3)) {
    const page = pages[String(pid)];
    if (!page || typeof page.extract !== "string") continue;
    if ("missing" in page) continue;
    const extract = page.extract.trim();
    if (extract.length < 48) continue;
    if (stripDisambiguationNoise(extract)) continue;
    const title = (page.title || "").trim();
    if (
      !isRelevantToTrack(title, extract, artistTokens, songTokens)
    ) {
      continue;
    }
    const text = sanitizeExtract(extract, 480);
    if (text.length < 40) continue;
    const sourceUrl =
      typeof page.fullurl === "string" && page.fullurl.startsWith("http")
        ? page.fullurl
        : `https://en.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, "_"))}`;

    return [
      {
        text,
        source_type: "wiki",
        source_url: sourceUrl,
        score: null,
        fetched_at: nowIso,
      },
    ];
  }

  return [];
}
