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

/**
 * Order: Reddit (discussion) first, using per-item score for ties;
 * encyclopedic sources after.
 */
function triviaRankScore(item: Entry["trivia_items"][number]): number {
  if (item.source_type === "reddit") {
    return 2_000_000 + (item.score ?? 0);
  }
  if (item.source_type === "lastfm") return 100_000;
  if (item.source_type === "wiki") return 50_000;
  return (item.score ?? 0) + 1;
}

const REDDIT_POST_IT_SURFACES = [
  styles.postItYellow,
  styles.postItMint,
  styles.postItApricot,
  styles.postItLime,
] as const;

function postItSurface(
  item: Entry["trivia_items"][number],
  redditIndex: number
): string {
  if (item.source_type === "reddit") {
    return (
      REDDIT_POST_IT_SURFACES[redditIndex % REDDIT_POST_IT_SURFACES.length] ??
      styles.postItYellow
    );
  }
  if (item.source_type === "wiki") return styles.postItLavender;
  return styles.postItBlue;
}

function sourceLabel(kind: Entry["trivia_items"][number]["source_type"]): string {
  switch (kind) {
    case "lastfm":
      return "Reference · Last.fm";
    case "reddit":
      return "Discussion · Reddit";
    case "wiki":
      return "Reference · Wikipedia";
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
  let redditOrdinal = 0;

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
            aria-label="Listener notes and reference"
          >
            <div className={styles.postItStack}>
              <div className={`${styles.postIt} ${styles.postItPeach}`}>
                <p className={styles.postItMeta}>from listeners</p>
                <p className={styles.postItMetaLine}>
                  {entry.song_name} · {entry.release_year > 0 ? entry.release_year : "unknown year"}
                </p>
              </div>
              {showStructured ? (
                displayTrivia.map((item, i) => {
                  const surfaceClass = postItSurface(
                    item,
                    item.source_type === "reddit" ? redditOrdinal++ : 0
                  );
                  return (
                    <div
                      key={`${item.source_type}-${item.fetched_at}-${i}`}
                      className={styles.triviaCardWrap}
                      style={{
                        alignSelf: i % 2 === 1 ? "flex-end" : "flex-start",
                      }}
                    >
                      <div className={`${styles.postIt} ${surfaceClass}`}>
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
                                open thread
                              </a>
                            </>
                          ) : null}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : showLegacyFallback ? (
                <div
                  className={styles.triviaCardWrap}
                  style={{ alignSelf: "flex-start" }}
                >
                  <div className={`${styles.postIt} ${styles.postItYellow}`}>
                    <p className={styles.triviaHand}>{fallbackTrivia}</p>
                  </div>
                </div>
              ) : (
                <div
                  className={styles.triviaCardWrap}
                  style={{ alignSelf: "flex-start" }}
                >
                  <div className={`${styles.postIt} ${styles.postItBlue}`}>
                    <p className={styles.hintText}>
                      No discussion threads or listener notes surfaced for this track yet.
                    </p>
                  </div>
                </div>
              )}
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
