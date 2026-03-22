import Link from "next/link";
import { SEED_ENTRIES } from "@/lib/utils/seedData";
import { createClient } from "@/lib/supabase/server";
import type { Entry } from "@/types/entry";
import EntryNoteEditor from "@/components/entry/EntryNoteEditor";
import PostcardComposer from "@/components/entry/PostcardComposer";
import styles from "./entry.module.css";

interface EntryPageProps {
  params: Promise<{ id: string }>;
}

async function getEntry(id: string): Promise<Entry | undefined> {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("entries")
      .select("*")
      .eq("id", id)
      .single();

    if (!error && data) {
      return {
        id: data.id,
        spotify_id: data.spotify_id,
        artist_name: data.artist_name,
        album_name: data.album_name,
        song_name: data.song_name || data.album_name,
        release_year: data.release_year ?? 0,
        artwork_url: data.artwork_url,
        note_text: data.note_text,
        scale_tier: data.scale_tier ?? "medium",
        hover_color_index: data.hover_color_index ?? 0,
        date_added: data.date_added,
        updated_at: data.updated_at,
      };
    }
  } catch {
    // Fall through to seed data
  }

  return SEED_ENTRIES.find((e) => e.id === id);
}

function formatAddedAt(iso: string | undefined): string | null {
  if (!iso) return null;
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return null;
  }
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params;
  const entry = await getEntry(id);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authenticated = !!user;

  if (!entry) {
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

  const addedLabel = formatAddedAt(entry.date_added);

  return (
    <main className="min-h-screen" style={{ padding: "var(--margin-x)" }}>
      <Link
        href="/"
        className={`font-meta no-underline inline-block mb-8 ${styles.backLink}`}
      >
        ← Index
      </Link>

      <h1
        className="font-display text-dotted"
        style={{
          fontSize: "var(--type-large)",
          color: "var(--color-text)",
          ["--dotted-ink" as string]: "var(--color-text)",
        }}
      >
        {entry.artist_name}
      </h1>

      <p
        className="font-meta mt-2"
        style={{
          fontSize: "var(--type-meta)",
          color: "var(--color-text-meta)",
        }}
      >
        {entry.album_name} · {entry.song_name}
        {entry.release_year > 0 ? ` · ${entry.release_year}` : ""}
      </p>

      {addedLabel && (
        <p
          className="font-meta mt-1"
          style={{
            fontSize: "clamp(0.65rem, 1.5vw, 0.8rem)",
            color: "var(--color-text-meta)",
            letterSpacing: "0.06em",
          }}
        >
          Added {addedLabel}
        </p>
      )}

      {entry.artwork_url && (
        <div className="mt-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={entry.artwork_url}
            alt={`${entry.album_name} album artwork`}
            width={280}
            height={280}
            className="object-cover"
            style={{ borderRadius: 2 }}
          />
        </div>
      )}

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
    </main>
  );
}
