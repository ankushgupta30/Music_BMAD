const LASTFM = "https://ws.audioscrobbler.com/2.0/";

export function isLastFmConfigured(): boolean {
  return !!process.env.LASTFM_API_KEY?.trim();
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArtistName(artist: string): string {
  return artist
    .replace(/\s*\((feat|ft)\.?.*?\)/gi, "")
    .replace(/\s*(feat|ft)\.?\s+.+$/gi, "")
    .replace(/\s*&\s*.+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

async function fetchTrackInfo(
  apiKey: string,
  artist: string,
  track: string,
  autocorrect: boolean
): Promise<{ summary: string | null; notFound: boolean }> {
  const params = new URLSearchParams({
    method: "track.getInfo",
    api_key: apiKey,
    artist: artist.trim(),
    track: track.trim(),
    format: "json",
    autocorrect: autocorrect ? "1" : "0",
  });

  const res = await fetch(`${LASTFM}?${params.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.warn("[lastfm] track.getInfo failed", res.status);
    return { summary: null, notFound: false };
  }

  const data = (await res.json()) as {
    track?: { wiki?: { summary?: string; content?: string } };
    error?: number;
    message?: string;
  };

  if (data.error) {
    const message = (data.message || "").toLowerCase();
    const notFound =
      data.error === 6 ||
      message.includes("not found") ||
      message.includes("does not exist");
    return { summary: null, notFound };
  }

  const raw =
    data.track?.wiki?.summary?.trim() || data.track?.wiki?.content?.trim();
  if (!raw) return { summary: null, notFound: false };

  const plain = stripHtml(raw);
  if (!plain) return { summary: null, notFound: false };

  const shortened = plain.replace(/\s*Read more on Last\.fm\.?$/i, "").trim();
  return {
    summary: shortened.length > 0 ? shortened : null,
    notFound: false,
  };
}

/**
 * Last.fm track.getInfo wiki summary (HTML stripped).
 */
export async function fetchLastFmTrackWikiSummary(
  artist: string,
  track: string
): Promise<string | null> {
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!apiKey) return null;
  const artistTrimmed = artist.trim();
  const trackTrimmed = track.trim();
  if (!artistTrimmed || !trackTrimmed) return null;

  const first = await fetchTrackInfo(apiKey, artistTrimmed, trackTrimmed, false);
  if (first.summary) return first.summary;

  const normalizedArtist = normalizeArtistName(artistTrimmed);
  if (first.notFound && normalizedArtist && normalizedArtist !== artistTrimmed) {
    const second = await fetchTrackInfo(apiKey, normalizedArtist, trackTrimmed, true);
    if (second.summary) return second.summary;
  }

  const third = await fetchTrackInfo(apiKey, artistTrimmed, trackTrimmed, true);
  return third.summary;
}
