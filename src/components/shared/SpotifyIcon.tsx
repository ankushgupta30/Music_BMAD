"use client";

export default function SpotifyIcon() {
  return (
    <button
      type="button"
      className="flex items-center justify-center w-11 h-11 rounded-full"
      style={{
        background: "var(--color-bg)",
        border: "1.5px solid var(--color-text-meta)",
        transition: `border-color var(--duration-hover) ease-out`,
        cursor: "pointer",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.borderColor = "var(--color-wada-6)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.borderColor = "var(--color-text-meta)")
      }
      aria-label="Connect Spotify"
      title="Connect Spotify"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ color: "var(--color-text)" }}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M8 14.5c2-1 4.5-1.2 7-.5" />
        <path d="M7 11.5c2.5-1.2 6-1.5 9-.4" />
        <path d="M6.5 8.5c3-1.5 7.5-1.7 11-.3" />
      </svg>
    </button>
  );
}
