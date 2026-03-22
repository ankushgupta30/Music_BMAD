"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getWadaColor } from "@/lib/utils/wadaPalette";

interface IndexEntryProps {
  id: string;
  artistName: string;
  songName: string;
  releaseYear: number;
  hoverColorIndex: number;
  /** Base path without trailing slash, e.g. `/entry` or `/share/TOKEN/entry` */
  entryHrefBase?: string;
}

export default function IndexEntry({
  id,
  artistName,
  songName,
  releaseYear,
  hoverColorIndex,
  entryHrefBase = "/entry",
}: IndexEntryProps) {
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [fineHover, setFineHover] = useState(true);

  useEffect(() => {
    const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
    const apply = () => setFineHover(mq.matches);
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, []);

  const wadaColor = getWadaColor(hoverColorIndex);
  const active = focused || (fineHover && hovered);

  return (
    <Link
      href={`${entryHrefBase}/${id}`}
      className={`font-display no-underline indexArtistLink ${
        active ? "" : "text-dotted"
      }`}
      title={artistName}
      style={{ color: wadaColor }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      aria-label={`${artistName} — ${songName}, ${releaseYear}`}
    >
      {artistName}
    </Link>
  );
}
