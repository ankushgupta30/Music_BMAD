import Link from "next/link";
import { SEED_ENTRIES } from "@/lib/utils/seedData";
import styles from "./entry.module.css";

interface EntryPageProps {
  params: Promise<{ id: string }>;
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params;
  const entry = SEED_ENTRIES.find((e) => e.id === id);

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

  return (
    <main
      className="min-h-screen"
      style={{ padding: "var(--margin-x)" }}
    >
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

      <div className="mt-12">
        <p
          className="font-hand"
          style={{
            fontSize: "1.25rem",
            color: "var(--color-text-meta)",
            fontStyle: "italic",
          }}
        >
          Your notes will appear here...
        </p>
      </div>
    </main>
  );
}
