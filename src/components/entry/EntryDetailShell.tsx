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

interface EntryDetailShellProps {
  entry: Entry;
  backHref: string;
  backLabel: string;
  journalColumn: ReactNode;
}

const MAX_TRIVIA_BLOCKS = 6;

/** Order: Last.fm lead, then Reddit by score, then Wiki, then other. */
function triviaRankScore(item: Entry["trivia_items"][number]): number {
  if (item.score != null) return item.score;
  if (item.source_type === "lastfm") return 1_000_000;
  if (item.source_type === "wiki") return 500_000;
  return 0;
}

function sourceLabel(kind: Entry["trivia_items"][number]["source_type"]): string {
  switch (kind) {
    case "lastfm":
      return "Last.fm";
    case "reddit":
      return "Reddit";
    case "wiki":
      return "Wiki";
    case "interview":
      return "Interview";
    case "editorial":
      return "Editorial";
    default:
      return "Source";
  }
}

export default function EntryDetailShell({
  entry,
  backHref,
  backLabel,
  journalColumn,
}: EntryDetailShellProps) {
  const addedLabel = formatAddedAt(entry.date_added);
  const rankedTrivia = [...(entry.trivia_items ?? [])].sort(
    (a, b) => triviaRankScore(b) - triviaRankScore(a)
  );
  const displayTrivia = rankedTrivia.slice(0, MAX_TRIVIA_BLOCKS);
  const fallbackTrivia =
    entry.trivia_summary && entry.trivia_summary.trim().length > 0
      ? entry.trivia_summary
      : null;
  const showStructured = displayTrivia.length > 0;
  const showLegacyFallback = !showStructured && Boolean(fallbackTrivia?.trim());
  const showTrivia = showStructured || showLegacyFallback;
  const postItVariant = showTrivia ? styles.postItYellow : styles.postItBlue;

  return (
    <div className={styles.shell}>
      <Link
        href={backHref}
        className={`font-meta no-underline inline-block mb-8 ${backStyles.backLink}`}
      >
        {backLabel}
      </Link>

      <div className={styles.grid}>
        <div className={`${styles.left} ${styles.cluster}`}>
          <section className={`${styles.paperSheet} ${styles.heroGroup}`}>
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
          </section>

          <section
            className={`${styles.paperCard} ${styles.section} ${styles.pinShadow}`}
            aria-label="Trivia"
          >
            <div className={styles.postItStack}>
              <div className={`${styles.postIt} ${styles.postItPeach}`}>
                <p className={styles.postItMeta}>archive note</p>
                <p className={styles.postItMetaLine}>
                  {entry.song_name} · {entry.release_year > 0 ? entry.release_year : "unknown year"}
                </p>
              </div>
              <div className={`${styles.postIt} ${postItVariant}`}>
                {showStructured ? (
                  <div className={styles.triviaList}>
                    {displayTrivia.map((item, i) => (
                      <div key={`${item.source_type}-${item.fetched_at}-${i}`}>
                        <p className={styles.triviaHand}>{item.text.trim()}</p>
                        <p className={styles.triviaSource}>
                          Source: {sourceLabel(item.source_type)}
                          {item.source_url ? (
                            <>
                              {" · "}
                              <a
                                href={item.source_url}
                                target="_blank"
                                rel="noopener noreferrer"
                              >
                                open
                              </a>
                            </>
                          ) : null}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : showLegacyFallback ? (
                  <p className={styles.triviaHand}>{fallbackTrivia}</p>
                ) : (
                  <p className={styles.hintText}>No public write-up found for this track yet.</p>
                )}
              </div>
            </div>
          </section>
        </div>

        <aside className={styles.journal}>
          <div className={styles.journalInner}>{journalColumn}</div>
        </aside>
      </div>
    </div>
  );
}
