"use client";

import { useCallback, useRef, useState } from "react";
import styles from "./interactive-entry-artwork.module.css";

interface InteractiveEntryArtworkProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
}

/**
 * Pointer-reactive cover: subtle tilt + lift (journal “hero” affordance).
 */
export default function InteractiveEntryArtwork({
  src,
  alt,
  width = 280,
  height = 280,
}: InteractiveEntryArtworkProps) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState(
    "perspective(520px) rotateX(0deg) rotateY(0deg) scale(1)"
  );

  const onMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    const max = 7;
    const rx = (-py * max).toFixed(2);
    const ry = (px * max).toFixed(2);
    setTransform(
      `perspective(520px) rotateX(${rx}deg) rotateY(${ry}deg) scale(1.02)`
    );
  }, []);

  const onLeave = useCallback(() => {
    setTransform("perspective(520px) rotateX(0deg) rotateY(0deg) scale(1)");
  }, []);

  return (
    <div
      ref={wrapRef}
      className={styles.wrap}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={styles.img}
        style={{ transform }}
        draggable={false}
      />
    </div>
  );
}
