import { findSeedEntryById } from "@/lib/utils/seedData";
import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/types/entry";
import EntryNoteEditor from "@/components/entry/EntryNoteEditor";
import EntryDetailShell from "@/components/entry/EntryDetailShell";
import { enrichEntryContext } from "@/lib/entry/enrichEntryContext";
import { enrichEntryContextDebug } from "@/lib/entry/enrichEntryContext";
import { mapEntryRow } from "@/lib/utils/mapEntryRow";

interface EntryPageProps {
  params: Promise<{ id: string }>;
  searchParams?: { debugReddit?: string };
}

async function getEntry(
  id: string
): Promise<{ entry: Entry; fromDb: boolean } | undefined> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return {
        entry: mapEntryRow(data as Record<string, unknown>),
        fromDb: true,
      };
    }
  } catch {
    // Fall through to seed data
  }

  const seed = findSeedEntryById(id);
  if (!seed) return undefined;
  return { entry: seed, fromDb: false };
}

export default async function EntryPage({ params, searchParams }: EntryPageProps) {
  const { id } = await params;
  const resolved = await getEntry(id);
  const debugReddit =
    searchParams?.debugReddit?.trim() === "1" ||
    process.env.DEBUG_REDDIT?.trim() === "1";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authenticated = !!user;

  if (!resolved) {
    return (
      <main
        className="min-h-screen flex items-center justify-center"
        style={{ padding: "var(--margin-x)" }}
      >
        <p className="font-meta" style={{ color: "var(--color-text-meta)" }}>
          Entry not found.
        </p>
      </main>
    );
  }

  let { entry } = resolved;
  if (debugReddit) {
    const debug = await enrichEntryContextDebug(entry, supabase);
    entry = debug.entry;
    return (
      <main
        className="min-h-screen flex flex-col box-border"
        style={{
          padding: "var(--margin-x)",
          minHeight: "100dvh",
          backgroundColor: "var(--color-text)",
        }}
      >
        <EntryDetailShell
          entry={entry}
          backHref="/"
          backLabel="← Index"
          journalColumn={
            <EntryNoteEditor
              entryId={entry.id}
              initialNote={entry.note_text}
              authenticated={authenticated}
              variant="journal"
            />
          }
        />
        <section style={{ marginTop: "2rem", color: "var(--color-text-meta)" }}>
          <p className="font-meta" style={{ marginBottom: "0.75rem" }}>
            Reddit debug (query: <code>?debugReddit=1</code>)
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              fontSize: "0.75rem",
              lineHeight: 1.4,
              background: "rgba(0,0,0,0.06)",
              padding: "1rem",
              borderRadius: "0.5rem",
              maxHeight: "50vh",
              overflow: "auto",
            }}
          >
            {JSON.stringify(debug.redditDebug, null, 2)}
          </pre>
        </section>
      </main>
    );
  }

  entry = await enrichEntryContext(entry, supabase);

  return (
    <main
      className="min-h-screen flex flex-col box-border"
      style={{
        padding: "var(--margin-x)",
        minHeight: "100dvh",
        backgroundColor: "var(--color-text)",
      }}
    >
      <EntryDetailShell
        entry={entry}
        backHref="/"
        backLabel="← Index"
        journalColumn={
          <EntryNoteEditor
            entryId={entry.id}
            initialNote={entry.note_text}
            authenticated={authenticated}
            variant="journal"
          />
        }
      />
    </main>
  );
}
