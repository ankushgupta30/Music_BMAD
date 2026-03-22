"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { addEntry } from "@/app/actions/entries";
import type { SpotifyAlbumResult } from "@/lib/spotify/client";
import styles from "./search-panel.module.css";

export default function SearchPanel() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SpotifyAlbumResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [, startTransition] = useTransition();
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const doSearch = useCallback(async (q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }

    setSearching(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/spotify/search?q=${encodeURIComponent(q.trim())}&type=album`
      );
      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Search failed.");
        setResults([]);
      } else {
        setResults(json.data ?? []);
      }
    } catch {
      setError("Network error. Try again.");
      setResults([]);
    } finally {
      setSearching(false);
    }
  }, []);

  const handleInput = useCallback(
    (value: string) => {
      setQuery(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => doSearch(value), 400);
    },
    [doSearch]
  );

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleAdd = useCallback(
    (result: SpotifyAlbumResult) => {
      if (addedIds.has(result.id)) return;

      setAddedIds((prev) => new Set(prev).add(result.id));

      startTransition(async () => {
        await addEntry({
          spotify_id: result.id,
          artist_name: result.artist_name,
          album_name: result.name,
          song_name: result.name,
          release_year: result.release_year,
          artwork_url: result.artwork_url,
        });
      });
    },
    [addedIds, startTransition]
  );

  return (
    <div className={styles.searchContainer}>
      <div className={styles.inputWrapper}>
        <input
          ref={inputRef}
          type="search"
          className={styles.searchInput}
          placeholder="Search albums..."
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          aria-label="Search Spotify"
        />
      </div>

      {error && (
        <p
          style={{
            fontFamily: "var(--font-meta), monospace",
            fontSize: "0.75rem",
            color: "var(--color-wada-1)",
          }}
        >
          {error}
        </p>
      )}

      {searching && (
        <div className={styles.dots}>
          <span className={styles.dot} />
          <span className={styles.dot} />
          <span className={styles.dot} />
        </div>
      )}

      {!searching && query.trim().length >= 2 && results.length === 0 && !error && (
        <p className={styles.empty}>Nothing found</p>
      )}

      <div className={styles.results}>
        {results.map((r) => {
          const added = addedIds.has(r.id);
          return (
            <button
              key={r.id}
              type="button"
              className={styles.resultItem}
              data-added={added || undefined}
              onClick={() => handleAdd(r)}
              aria-label={`Add ${r.name} by ${r.artist_name}`}
            >
              {r.artwork_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={r.artwork_url}
                  alt=""
                  className={styles.resultArtwork}
                  loading="lazy"
                />
              )}
              <div className={styles.resultMeta}>
                <span className={styles.resultAlbum}>{r.name}</span>
                <span className={styles.resultArtist}>{r.artist_name}</span>
                {r.release_year > 0 && (
                  <span className={styles.resultYear}>{r.release_year}</span>
                )}
              </div>
              {added && (
                <svg
                  className={styles.addedCheck}
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                >
                  <path
                    d="M5 13l4 4L19 7"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
