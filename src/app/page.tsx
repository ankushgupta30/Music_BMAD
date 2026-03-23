import AuthCallbackNotice from "@/components/shared/AuthCallbackNotice";
import IndexLayout from "@/components/index/IndexLayout";
import IndexShell from "@/components/index/IndexShell";
import { CURATED_DEMO_ENTRY } from "@/lib/utils/seedData";
import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/types/entry";
import { mapEntryRow } from "@/lib/utils/mapEntryRow";

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
      return data.map((row) =>
        mapEntryRow(row as Record<string, unknown>)
      );
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
