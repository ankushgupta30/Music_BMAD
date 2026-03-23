import AuthCallbackNotice from "@/components/shared/AuthCallbackNotice";
import IndexLayout from "@/components/index/IndexLayout";
import IndexShell from "@/components/index/IndexShell";
import { CURATED_DEMO_ENTRY } from "@/lib/utils/seedData";
import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/types/entry";

/** Index depends on session + DB row count (demo vs empty vs list). */
export const dynamic = "force-dynamic";

async function getEntries(): Promise<Entry[]> {
  let supabase: Awaited<ReturnType<typeof createClient>>;
  let user: { id: string } | null = null;

  try {
    supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();
    user = auth.user;
  } catch {
    /* Supabase missing or misconfigured — still show demo index */
    return [CURATED_DEMO_ENTRY];
  }

  try {
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .order("date_added", { ascending: false });

    if (!error && data && data.length > 0) {
      return data.map((row) => ({
        id: row.id,
        spotify_id: row.spotify_id,
        artist_name: row.artist_name,
        album_name: row.album_name,
        song_name: row.song_name || row.album_name,
        release_year: row.release_year ?? 0,
        artwork_url: row.artwork_url,
        note_text: row.note_text,
        scale_tier: row.scale_tier ?? "medium",
        hover_color_index: row.hover_color_index ?? 0,
        date_added: row.date_added,
        updated_at: row.updated_at,
      }));
    }
  } catch {
    /* Network / RLS — fall through */
  }

  if (!user) {
    return [CURATED_DEMO_ENTRY];
  }

  return [];
}

export default async function Home() {
  const entries = await getEntries();

  return (
    <>
      <AuthCallbackNotice />
      <IndexShell>
        <IndexLayout entries={entries} />
      </IndexShell>
    </>
  );
}
