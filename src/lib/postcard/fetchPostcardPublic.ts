import type { SupabaseClient } from "@supabase/supabase-js";

export interface PostcardPublicPayload {
  id: string;
  note_text: string;
  created_at: string;
  artist_name: string;
  album_name: string;
  song_name: string;
  release_year: number;
  artwork_url: string;
}

export async function fetchPostcardPublic(
  admin: SupabaseClient,
  postcardId: string
): Promise<PostcardPublicPayload | null> {
  const { data: pc, error: pcErr } = await admin
    .from("postcards")
    .select("id, note_text, created_at, entry_id")
    .eq("id", postcardId)
    .maybeSingle();

  if (pcErr || !pc?.entry_id) return null;

  const { data: entry, error: enErr } = await admin
    .from("entries")
    .select("artist_name, album_name, song_name, release_year, artwork_url")
    .eq("id", pc.entry_id)
    .maybeSingle();

  if (enErr || !entry) return null;

  return {
    id: pc.id as string,
    note_text: pc.note_text as string,
    created_at: pc.created_at as string,
    artist_name: entry.artist_name as string,
    album_name: entry.album_name as string,
    song_name: (entry.song_name as string) || (entry.album_name as string),
    release_year: typeof entry.release_year === "number" ? entry.release_year : 0,
    artwork_url: String(entry.artwork_url ?? ""),
  };
}
