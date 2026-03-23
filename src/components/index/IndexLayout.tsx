"use client";

import { useRef, useEffect } from "react";
import type { Entry } from "@/types/entry";
import IndexEntry from "./IndexEntry";
import InlineArtwork from "./InlineArtwork";
import shellStyles from "./index-shell.module.css";
import layoutStyles from "./index-layout.module.css";

interface IndexLayoutProps {
  entries: Entry[];
  /** Base for entry links (default `/entry`). Shared journal: `/share/[token]/entry` */
  entryHrefBase?: string;
}

function chunkEntries<T>(items: T[], rowCount: number): T[][] {
  if (items.length === 0) return [];
  const n = Math.max(1, Math.min(rowCount, items.length));
  const perRow = Math.ceil(items.length / n);
  const rows: T[][] = [];
  for (let r = 0; r < n; r++) {
    const start = r * perRow;
    const slice = items.slice(start, start + perRow);
    if (slice.length > 0) rows.push(slice);
  }
  return rows;
}

function tapestryRowCount(entryCount: number): number {
  if (entryCount <= 0) return 1;
  return Math.min(12, Math.max(1, Math.ceil(entryCount / 6)));
}

/** Repeat row entries horizontally so the ribbon feels continuous while scrolling. */
const ROW_HORIZONTAL_COPIES = 3;

function repeatRowEntries<T>(items: T[], copies: number): T[] {
  const out: T[] = [];
  for (let c = 0; c < copies; c++) {
    out.push(...items);
  }
  return out;
}

function renderEntryUnit(
  entry: Entry,
  keySuffix: string,
  entryHrefBase: string
) {
  return (
    <div key={keySuffix} className={layoutStyles.entryUnit}>
      <div className={layoutStyles.artistCell}>
        <IndexEntry
          id={entry.id}
          artistName={entry.artist_name}
          songName={entry.song_name}
          releaseYear={entry.release_year}
          hoverColorIndex={entry.hover_color_index}
          entryHrefBase={entryHrefBase}
        />
      </div>

      {entry.artwork_url ? (
        <span className={layoutStyles.coverMeta}>
          <InlineArtwork
            entryId={entry.id}
            artworkUrl={entry.artwork_url}
            albumName={entry.album_name}
            entryHrefBase={entryHrefBase}
          />
          <span className={layoutStyles.metaStack}>
            <span className={layoutStyles.metaSong}>{entry.song_name}</span>
            <span className={layoutStyles.metaYear}>
              {entry.release_year > 0 ? entry.release_year : "\u2014"}
            </span>
          </span>
        </span>
      ) : null}
    </div>
  );
}

export default function IndexLayout({
  entries,
  entryHrefBase = "/entry",
}: IndexLayoutProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const rows = chunkEntries(entries, tapestryRowCount(entries.length));

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      const atLeft = el.scrollLeft <= 0;
      const atRight = el.scrollLeft + el.clientWidth >= el.scrollWidth - 1;
      if ((e.deltaY < 0 && atLeft) || (e.deltaY > 0 && atRight)) return;
      e.preventDefault();
      el.scrollLeft += e.deltaY;
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (entries.length === 0) {
    return (
      <div className={shellStyles.indexScrollViewport}>
        <div
          className={layoutStyles.emptyState}
          role="status"
          aria-live="polite"
        >
          <h2 className={layoutStyles.emptyStateTitle}>Nothing saved yet</h2>
          <p className={layoutStyles.emptyStateBody}>
            Open the Spotify icon, connect, and search to add your first track.
            Your typographic journal will grow here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={shellStyles.indexScrollViewport}>
      <div ref={scrollRef} className={shellStyles.indexScroll}>
        <div className={layoutStyles.tapestry}>
          {rows.map((row, rowIndex) => (
            <div
              key={`tapestry-row-${rowIndex}`}
              className={`${layoutStyles.tapestryRow} ${
                rowIndex % 2 === 1 ? layoutStyles.tapestryRowStagger : ""
              }`}
            >
              {repeatRowEntries(row, ROW_HORIZONTAL_COPIES).map((entry, segIndex) =>
                renderEntryUnit(
                  entry,
                  `${entry.id}-r${rowIndex}-s${segIndex}`,
                  entryHrefBase
                )
              )}
            </div>
          ))}
        </div>
      </div>
      <span
        className={shellStyles.indexScrollFadeLeft}
        aria-hidden
      />
      <span
        className={shellStyles.indexScrollFadeRight}
        aria-hidden
      />
    </div>
  );
}
