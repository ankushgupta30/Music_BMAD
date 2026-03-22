const TOKEN_ENDPOINT = "https://accounts.spotify.com/api/token";
const SEARCH_ENDPOINT = "https://api.spotify.com/v1/search";

let cachedToken: { access_token: string; expires_at: number } | null = null;

export function isSpotifyConfigured(): boolean {
  return !!(
    process.env.SPOTIFY_CLIENT_ID && process.env.SPOTIFY_CLIENT_SECRET
  );
}

async function getClientCredentialsToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expires_at - 60_000) {
    return cachedToken.access_token;
  }

  const clientId = process.env.SPOTIFY_CLIENT_ID!;
  const clientSecret = process.env.SPOTIFY_CLIENT_SECRET!;

  const res = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!res.ok) {
    throw new Error(`Spotify token request failed: ${res.status}`);
  }

  const data = await res.json();
  cachedToken = {
    access_token: data.access_token,
    expires_at: Date.now() + data.expires_in * 1000,
  };

  return cachedToken.access_token;
}

export interface SpotifyAlbumResult {
  id: string;
  name: string;
  artist_name: string;
  artwork_url: string;
  release_year: number;
}

export async function searchSpotify(
  query: string,
  type: "album" | "track" | "artist" = "album",
  limit: number = 10
): Promise<SpotifyAlbumResult[]> {
  const token = await getClientCredentialsToken();

  const n = typeof limit === "number" && Number.isFinite(limit) ? limit : 10;
  const safeLimit = Math.min(10, Math.max(1, Math.floor(Math.abs(n))));
  const params = new URLSearchParams({
    q: query.trim(),
    type,
    limit: `${safeLimit}`,
    offset: "0",
  });
  // Client-credentials search: explicit market avoids some 400s / empty catalog quirks.
  const market = (process.env.SPOTIFY_DEFAULT_MARKET || "US").trim();
  if (market.toLowerCase() !== "from_token") {
    params.set("market", market);
  }

  const url = `${SEARCH_ENDPOINT}?${params.toString()}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
  });

  if (!res.ok) {
    if (res.status === 401) {
      cachedToken = null;
      throw new Error("Spotify token expired. Retry.");
    }
    const errText = await res.text();
    let detail = "";
    try {
      const errJson = JSON.parse(errText) as {
        error?: { message?: string; reason?: string };
      };
      const msg = errJson?.error?.message ?? errJson?.error?.reason;
      if (msg) detail = ` — ${msg}`;
    } catch {
      if (errText) detail = ` — ${errText.slice(0, 200)}`;
    }
    console.error("[spotify] search failed", { url: url.replace(/Bearer\s\S+/, "Bearer ***"), status: res.status, detail, params: Object.fromEntries(params) });
    throw new Error(`Spotify search failed: ${res.status}${detail}`);
  }

  const data = await res.json();

  if (type === "album" && data.albums?.items) {
    return data.albums.items.map((album: Record<string, unknown>) => ({
      id: album.id,
      name: album.name,
      artist_name: (
        album.artists as { name: string }[]
      )
        .map((a) => a.name)
        .join(", "),
      artwork_url:
        (album.images as { url: string; width: number }[])?.find(
          (img) => img.width >= 300
        )?.url ??
        (album.images as { url: string }[])?.[0]?.url ??
        "",
      release_year: parseInt(
        (album.release_date as string)?.slice(0, 4) ?? "0",
        10
      ),
    }));
  }

  if (type === "track" && data.tracks?.items) {
    return data.tracks.items.map((track: Record<string, unknown>) => {
      const album = track.album as {
        name: string;
        images: { url: string; width: number }[];
        release_date?: string;
      };
      return {
        id: track.id,
        name: album.name,
        artist_name: (track.artists as { name: string }[])
          .map((a) => a.name)
          .join(", "),
        artwork_url:
          album.images?.find((img) => img.width >= 300)?.url ??
          album.images?.[0]?.url ??
          "",
        release_year: parseInt(
          album.release_date?.slice(0, 4) ?? "0",
          10
        ),
      };
    });
  }

  return [];
}
