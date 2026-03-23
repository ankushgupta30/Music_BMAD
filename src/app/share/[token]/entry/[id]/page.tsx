import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import EntryDetailShell from "@/components/entry/EntryDetailShell";
import { enrichEntryContext } from "@/lib/entry/enrichEntryContext";
import { mapEntryRow } from "@/lib/utils/mapEntryRow";

interface Props {
  params: Promise<{ token: string; id: string }>;
}

function ConfigMissing() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <p className="font-meta" style={{ color: "var(--color-text-meta)" }}>
        Page unavailable.
      </p>
    </main>
  );
}

export default async function SharedEntryPage({ params }: Props) {
  const { token, id } = await params;
  const admin = getAdminClient();
  if (!admin) return <ConfigMissing />;

  const { data: share } = await admin
    .from("journal_shares")
    .select("id")
    .eq("token", token)
    .maybeSingle();

  if (!share) notFound();

  const { data: row, error } = await admin
    .from("entries")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !row) notFound();

  let entry = mapEntryRow(row as Record<string, unknown>);
  entry = await enrichEntryContext(entry, admin);

  return (
    <main className="min-h-screen" style={{ padding: "var(--margin-x)" }}>
      <EntryDetailShell
        entry={entry}
        backHref={`/share/${token}`}
        backLabel="← Shared journal"
        journalColumn={
          <p
            className="font-meta"
            style={{
              fontSize: "0.75rem",
              color: "var(--color-text-meta)",
              letterSpacing: "0.04em",
              lineHeight: 1.5,
              margin: 0,
            }}
          >
            Private notes are only visible to the journal owner.
          </p>
        }
      />
    </main>
  );
}
