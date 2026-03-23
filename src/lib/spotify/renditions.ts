import { isSpotifyConfigured, searchSpotifyTracks } from "@/lib/spotify/client";
import type { EntryRendition } from "@/types/entry";

function normalizeArtistKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s*(feat\.?|ft\.?|featuring)\s+.*$/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function primaryArtist(artistField: string): string {
  const first = artistField.split(/,|&/)[0]?.trim() ?? artistField;
  return first;
}

/** Compare titles loosely (remasters, punctuation). */
function normTitle(t: string): string {
  return t
    .toLowerCase()
    .replace(/\s*[\(\[]\s*(remaster|mono|stereo|single version).*$/i, "")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titlesMatch(entryTitle: string, hitTitle: string): boolean {
  const a = normTitle(entryTitle);
  const b = normTitle(hitTitle);
  if (!a || !b) return false;
  if (a === b) return true;
  if (a.length >= 6 && (b.startsWith(a) || a.startsWith(b))) return true;
  return false;
}

/**
 * Find other recordings of the same title on Spotify (covers / alternate artists).
 * Excludes the journal entry's own track and tracks whose primary artist matches the entry.
 */
export async function fetchRenditionsForEntry(
  songName: string,
  entryArtistName: string,
  entrySpotifyId: string,
  maxResults: number = 5
): Promise<EntryRendition[]> {
  if (!isSpotifyConfigured()) return [];

  const title = songName.trim();
  if (!title) return [];

  const entryPrimary = normalizeArtistKey(primaryArtist(entryArtistName));

  const query = `track:"${title.replace(/"/g, "")}"`;
  let hits;
  try {
    hits = await searchSpotifyTracks(query, 25);
  } catch {
    return [];
  }

  const seen = new Set<string>();
  const out: EntryRendition[] = [];

  for (const h of hits) {
    if (h.id === entrySpotifyId) continue;
    if (!h.track_name || !h.artist_name) continue;

    const candPrimary = normalizeArtistKey(primaryArtist(h.artist_name));
    if (!candPrimary || candPrimary === entryPrimary) continue;

    if (!titlesMatch(title, h.track_name)) continue;

    if (seen.has(h.id)) continue;
    seen.add(h.id);

    out.push({
      spotify_id: h.id,
      title: h.track_name,
      artist_name: h.artist_name,
    });

    if (out.length >= maxResults) break;
  }

  return out;
}
