"use client";

import type { Entry } from "@/types/entry";
import IndexEntry from "./IndexEntry";
import InlineArtwork from "./InlineArtwork";
import shellStyles from "./index-shell.module.css";
import layoutStyles from "./index-layout.module.css";

interface IndexLayoutProps {
  entries: Entry[];
}

export default function IndexLayout({ entries }: IndexLayoutProps) {
  return (
    <div className={shellStyles.justifyStream}>
      {entries.map((entry, i) => (
        <span key={entry.id}>
          <span className={layoutStyles.entryBlock}>
            <IndexEntry
              id={entry.id}
              artistName={entry.artist_name}
              songName={entry.song_name}
              releaseYear={entry.release_year}
              hoverColorIndex={entry.hover_color_index}
            />

            {entry.artwork_url && (
              <span className={layoutStyles.coverMeta}>
                <InlineArtwork
                  entryId={entry.id}
                  artworkUrl={entry.artwork_url}
                  albumName={entry.album_name}
                />
                <span className={layoutStyles.metaStack}>
                  <span className={layoutStyles.metaSong}>{entry.song_name}</span>
                  <span className={layoutStyles.metaYear}>
                    {entry.release_year > 0 ? entry.release_year : "—"}
                  </span>
                </span>
              </span>
            )}
          </span>

          {i < entries.length - 1 && (
            <span className={layoutStyles.entrySep} aria-hidden="true">
              ···
            </span>
          )}
        </span>
      ))}
    </div>
  );
}
