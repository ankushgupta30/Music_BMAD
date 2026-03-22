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
}

export default function IndexEntry({
  id,
  artistName,
  songName,
  releaseYear,
  hoverColorIndex,
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
  const showDotted = focused || (fineHover && hovered);

  return (
    <Link
      href={`/entry/${id}`}
      className={`font-display no-underline indexArtistLink ${
        showDotted ? "text-dotted" : ""
      }`}
      title={artistName}
      style={{
        color: showDotted ? "var(--color-text)" : wadaColor,
      }}
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
