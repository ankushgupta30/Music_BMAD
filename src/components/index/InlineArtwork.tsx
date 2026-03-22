"use client";

import { useState } from "react";
import Link from "next/link";

interface InlineArtworkProps {
  entryId: string;
  artworkUrl: string;
  albumName: string;
}

export default function InlineArtwork({
  entryId,
  artworkUrl,
  albumName,
}: InlineArtworkProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <Link
      href={`/entry/${entryId}`}
      className="no-underline"
      style={{
        display: "inline-block",
        verticalAlign: "middle",
        height: "0.85em",
        width: "0.85em",
        position: "relative",
        zIndex: hovered ? 10 : "auto",
        marginLeft: "0.08em",
        marginRight: "0.08em",
        flexShrink: 0,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${albumName} album artwork`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={artworkUrl}
        alt={`${albumName} album artwork`}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          objectFit: "cover",
          borderRadius: 2,
          transform: hovered ? "scale(var(--scale-artwork-hover, 2.5))" : "scale(1)",
          transition: `transform var(--duration-zoom) var(--ease-out)`,
          transformOrigin: "center center",
        }}
      />
    </Link>
  );
}
