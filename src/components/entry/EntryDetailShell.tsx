import Link from "next/link";
import type { ReactNode } from "react";
import type { Entry } from "@/types/entry";
import InteractiveEntryArtwork from "@/components/entry/InteractiveEntryArtwork";
import backStyles from "@/app/entry/[id]/entry.module.css";
import styles from "./entry-detail-shell.module.css";

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

function spotifyOpenUrl(trackId: string): string {
  return `https://open.spotify.com/track/${trackId}`;
}

interface EntryDetailShellProps {
  entry: Entry;
  backHref: string;
  backLabel: string;
  journalColumn: ReactNode;
}

export default function EntryDetailShell({
  entry,
  backHref,
  backLabel,
  journalColumn,
}: EntryDetailShellProps) {
  const addedLabel = formatAddedAt(entry.date_added);
  const showTrivia =
    entry.trivia_summary != null && entry.trivia_summary.trim().length > 0;
  const showRenditions = entry.renditions.length > 0;

  return (
    <div className={styles.shell}>
      <Link
        href={backHref}
        className={`font-meta no-underline inline-block mb-8 ${backStyles.backLink}`}
      >
        {backLabel}
      </Link>

      <div className={styles.grid}>
        <div className={styles.left}>
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
            className={`font-meta ${styles.heroMeta}`}
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
              <InteractiveEntryArtwork
                src={entry.artwork_url}
                alt={`${entry.album_name} album artwork`}
              />
            </div>
          )}

          <section className={styles.section} aria-labelledby="trivia-heading">
            <h2 id="trivia-heading" className={styles.sectionLabel}>
              Trivia
            </h2>
            {showTrivia ? (
              <p className={styles.triviaHand}>{entry.trivia_summary}</p>
            ) : (
              <p className={styles.hintText}>
                {entry.context_fetched_at
                  ? "No public write-up found for this track yet."
                  : "Trivia loads from Last.fm when your server has LASTFM_API_KEY set."}
              </p>
            )}
          </section>

          <section
            className={styles.section}
            aria-labelledby="renditions-heading"
          >
            <h2 id="renditions-heading" className={styles.sectionLabel}>
              Other renditions
            </h2>
            {showRenditions ? (
              <ul className={styles.renditionList}>
                {entry.renditions.map((r) => (
                  <li key={r.spotify_id}>
                    <a
                      href={spotifyOpenUrl(r.spotify_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {r.title}
                    </a>
                    <span className={styles.renditionMeta}>
                      — {r.artist_name}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.hintText}>
                {entry.context_fetched_at
                  ? "No alternate recordings surfaced for this title (Spotify search)."
                  : "Cover versions and alternate recordings appear when Spotify credentials are configured."}
              </p>
            )}
          </section>
        </div>

        <aside className={styles.journal}>
          <div className={styles.journalInner}>{journalColumn}</div>
        </aside>
      </div>
    </div>
  );
}
