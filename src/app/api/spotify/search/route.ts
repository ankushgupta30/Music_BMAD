import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isSpotifyConfigured, searchSpotify } from "@/lib/spotify/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type =
    (searchParams.get("type") as "album" | "track" | "artist") ?? "album";

  if (!query || query.trim().length === 0) {
    return NextResponse.json({ error: "Query is required" }, { status: 400 });
  }

  if (!isSpotifyConfigured()) {
    return NextResponse.json(
      { error: "Spotify is not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET." },
      { status: 503 }
    );
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Sign in with Spotify first." },
        { status: 401 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Authentication check failed." },
      { status: 401 }
    );
  }

  try {
    const results = await searchSpotify(query.trim(), type, 20);
    return NextResponse.json({ data: results });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed." },
      { status: 502 }
    );
  }
}
