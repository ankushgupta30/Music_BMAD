import Link from "next/link";
import { notFound } from "next/navigation";
import { getAdminClient } from "@/lib/supabase/admin";
import type { Entry } from "@/types/entry";
import styles from "@/app/entry/[id]/entry.module.css";

interface Props {
  params: Promise<{ token: string; id: string }>;
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

  const entry: Entry = {
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
  };

  const addedLabel = formatAddedAt(entry.date_added);

  return (
    <main className="min-h-screen" style={{ padding: "var(--margin-x)" }}>
      <Link
        href={`/share/${token}`}
        className={`font-meta no-underline inline-block mb-8 ${styles.backLink}`}
      >
        ← Shared journal
      </Link>

      <h1
        className="font-display text-dotted"
        style={{
          fontSize: "var(--type-large)",
          color: "var(--color-text)",
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

      <p
        className="font-meta mt-12"
        style={{
          fontSize: "0.75rem",
          color: "var(--color-text-meta)",
          letterSpacing: "0.04em",
        }}
      >
        Private notes are only visible to the journal owner.
      </p>
    </main>
  );
}
