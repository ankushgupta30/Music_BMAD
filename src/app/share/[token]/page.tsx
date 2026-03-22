import { notFound } from "next/navigation";
import IndexLayout from "@/components/index/IndexLayout";
import SharedJournalShell from "@/components/index/SharedJournalShell";
import { getAdminClient } from "@/lib/supabase/admin";
import { mapEntryRow } from "@/lib/utils/mapEntryRow";
import type { Entry } from "@/types/entry";

interface Props {
  params: Promise<{ token: string }>;
}

function mapRows(data: unknown[] | null): Entry[] {
  if (!data?.length) return [];
  return data.map((row) => mapEntryRow(row as Record<string, unknown>));
}

function ConfigMissing() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <p className="font-meta" style={{ color: "var(--color-text-meta)" }}>
        Shared journals aren&apos;t available (missing service role key).
      </p>
    </main>
  );
}

export default async function SharedJournalPage({ params }: Props) {
  const { token } = await params;
  const admin = getAdminClient();
  if (!admin) return <ConfigMissing />;

  const { data: share, error: shareErr } = await admin
    .from("journal_shares")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (shareErr || !share) notFound();

  const { data: rows, error: entriesErr } = await admin
    .from("entries")
    .select("*")
    .order("date_added", { ascending: false });

  if (entriesErr) notFound();

  const entries = mapRows(rows ?? []);

  return (
    <SharedJournalShell>
      <IndexLayout
        entries={entries}
        entryHrefBase={`/share/${token}/entry`}
      />
    </SharedJournalShell>
  );
}
