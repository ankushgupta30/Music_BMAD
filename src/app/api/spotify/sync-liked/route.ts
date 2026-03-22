import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SPOTIFY_TRACKS_URL = "https://api.spotify.com/v1/me/tracks";
const PAGE_SIZE = 50;

interface SpotifyTrackItem {
  added_at: string;
  track: {
    id: string;
    name: string;
    artists: { name: string }[];
    album: {
      id: string;
      name: string;
      images: { url: string; width: number }[];
      release_date?: string;
    };
  };
}

const SCALE_TIERS = ["large", "medium", "small"] as const;

function mapTrackToEntry(item: SpotifyTrackItem) {
  const { track } = item;
  return {
    spotify_id: track.album.id,
    artist_name: track.artists.map((a) => a.name).join(", "),
    album_name: track.album.name,
    song_name: track.name,
    release_year: parseInt(track.album.release_date?.slice(0, 4) ?? "0", 10),
    artwork_url:
      track.album.images?.find((img) => img.width >= 300)?.url ??
      track.album.images?.[0]?.url ??
      "",
    scale_tier: SCALE_TIERS[Math.floor(Math.random() * SCALE_TIERS.length)],
    hover_color_index: Math.floor(Math.random() * 8),
  };
}

async function fetchAllLikedTracks(
  providerToken: string
): Promise<SpotifyTrackItem[]> {
  const all: SpotifyTrackItem[] = [];
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const params = new URLSearchParams({
      limit: `${PAGE_SIZE}`,
      offset: `${offset}`,
    });

    const res = await fetch(`${SPOTIFY_TRACKS_URL}?${params}`, {
      headers: {
        Authorization: `Bearer ${providerToken}`,
        Accept: "application/json",
      },
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(
        `Spotify /me/tracks failed: ${res.status} — ${body.slice(0, 200)}`
      );
    }

    const data = (await res.json()) as {
      items: SpotifyTrackItem[];
      total: number;
      next: string | null;
    };

    all.push(...data.items);
    offset += PAGE_SIZE;
    hasMore = data.next !== null && offset < data.total;
  }

  return all;
}

export async function POST() {
  try {
    const supabase = await createClient();

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json(
        { error: "Sign in with Spotify first." },
        { status: 401 }
      );
    }

    const providerToken = session.provider_token;
    if (!providerToken) {
      return NextResponse.json(
        {
          error:
            "Spotify token not available. Please sign out and sign in again to grant library access.",
        },
        { status: 401 }
      );
    }

    const tracks = await fetchAllLikedTracks(providerToken);

    if (tracks.length === 0) {
      return NextResponse.json({ synced: 0, total: 0 });
    }

    // De-duplicate by album spotify_id (keep first occurrence)
    const seen = new Set<string>();
    const entries = tracks
      .map(mapTrackToEntry)
      .filter((e) => {
        if (!e.spotify_id || seen.has(e.spotify_id)) return false;
        seen.add(e.spotify_id);
        return true;
      });

    // Batch upsert in chunks of 100
    const CHUNK = 100;
    let inserted = 0;

    for (let i = 0; i < entries.length; i += CHUNK) {
      const chunk = entries.slice(i, i + CHUNK);
      const { error } = await supabase
        .from("entries")
        .upsert(chunk, { onConflict: "spotify_id", ignoreDuplicates: true });

      if (error) {
        console.error("[sync-liked] upsert error:", error);
      } else {
        inserted += chunk.length;
      }
    }

    return NextResponse.json({
      synced: inserted,
      total: tracks.length,
      albums: entries.length,
    });
  } catch (e) {
    console.error("[sync-liked]", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Sync failed." },
      { status: 502 }
    );
  }
}
