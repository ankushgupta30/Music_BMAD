"use client";

import { useState } from "react";
import Link from "next/link";
import { getWadaColor } from "@/lib/utils/wadaPalette";

interface IndexEntryProps {
  id: string;
  artistName: string;
  songName: string;
  releaseYear: number;
  hoverColorIndex: number;
}

export default function IndexEntry({
  id,
  artistName,
  songName,
  releaseYear,
  hoverColorIndex,
}: IndexEntryProps) {
  const [hovered, setHovered] = useState(false);
  const wadaColor = getWadaColor(hoverColorIndex);

  return (
    <Link
      href={`/entry/${id}`}
      className="font-display text-dotted text-hover-wada no-underline"
      style={{
        display: "inline",
        color: hovered ? wadaColor : "var(--color-text)",
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      aria-label={`${artistName} — ${songName}, ${releaseYear}`}
    >
      {artistName}
    </Link>
  );
}
