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

/**
 * Last.fm track.getInfo wiki summary (HTML stripped).
 */
export async function fetchLastFmTrackWikiSummary(
  artist: string,
  track: string
): Promise<string | null> {
  const apiKey = process.env.LASTFM_API_KEY?.trim();
  if (!apiKey) return null;

  const params = new URLSearchParams({
    method: "track.getInfo",
    api_key: apiKey,
    artist: artist.trim(),
    track: track.trim(),
    format: "json",
  });

  const res = await fetch(`${LASTFM}?${params.toString()}`, {
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    console.warn("[lastfm] track.getInfo failed", res.status);
    return null;
  }

  const data = (await res.json()) as {
    track?: { wiki?: { summary?: string; content?: string } };
    error?: number;
    message?: string;
  };

  if (data.error) {
    console.warn("[lastfm] track.getInfo error", data.message);
    return null;
  }

  const raw =
    data.track?.wiki?.summary?.trim() || data.track?.wiki?.content?.trim();
  if (!raw) return null;

  const plain = stripHtml(raw);
  if (!plain) return null;

  // Trim common Last.fm trailing attribution
  const shortened = plain.replace(/\s*Read more on Last\.fm\.?$/i, "").trim();
  return shortened.length > 0 ? shortened : null;
}
