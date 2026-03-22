"use client";

import styles from "./spotify-icon.module.css";

interface SpotifyIconProps {
  onClick?: () => void;
  connected?: boolean;
  "aria-expanded"?: boolean;
}

export default function SpotifyIcon({
  onClick,
  connected,
  "aria-expanded": ariaExpanded,
}: SpotifyIconProps) {
  return (
    <button
      type="button"
      className={styles.button}
      aria-label={connected ? "Spotify connected" : "Open Spotify panel"}
      title={connected ? "Spotify connected" : "Open Spotify panel"}
      aria-expanded={ariaExpanded}
      aria-controls="rewind-spotify-drawer"
      onClick={onClick}
      data-connected={connected ? "true" : undefined}
    >
      <span className={styles.ring} aria-hidden />
      <span className={styles.inner}>
        <svg
          className={styles.icon}
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path
            d="M8 14.5c2-1 4.5-1.2 7-.5"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M7 11.5c2.5-1.2 6-1.5 9-.4"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
          <path
            d="M6.5 8.5c3-1.5 7.5-1.7 11-.3"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
          />
        </svg>
      </span>
    </button>
  );
}
