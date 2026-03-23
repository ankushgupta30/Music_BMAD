import { findSeedEntryById } from "@/lib/utils/seedData";
import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/types/entry";
import EntryNoteEditor from "@/components/entry/EntryNoteEditor";
import PostcardComposer from "@/components/entry/PostcardComposer";
import EntryDetailShell from "@/components/entry/EntryDetailShell";
import { enrichEntryContext } from "@/lib/entry/enrichEntryContext";
import { mapEntryRow } from "@/lib/utils/mapEntryRow";

interface EntryPageProps {
  params: Promise<{ id: string }>;
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

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params;
  const resolved = await getEntry(id);

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
  if (resolved.fromDb) {
    entry = await enrichEntryContext(entry, supabase);
  }

  return (
    <main className="min-h-screen" style={{ padding: "var(--margin-x)" }}>
      <EntryDetailShell
        entry={entry}
        backHref="/"
        backLabel="← Index"
        journalColumn={
          <>
            <PostcardComposer
              entryId={entry.id}
              artistName={entry.artist_name}
              albumName={entry.album_name}
              artworkUrl={entry.artwork_url || null}
              authenticated={authenticated}
            />
            <EntryNoteEditor
              entryId={entry.id}
              initialNote={entry.note_text}
              authenticated={authenticated}
            />
          </>
        }
      />
    </main>
  );
}
