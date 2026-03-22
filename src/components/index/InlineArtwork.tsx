"use client";

import Link from "next/link";
import { useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/lib/utils/useReducedMotion";
import styles from "./inline-artwork.module.css";

interface InlineArtworkProps {
  entryId: string;
  artworkUrl: string;
  albumName: string;
  entryHrefBase?: string;
}

const hoverSpring = { type: "spring" as const, stiffness: 420, damping: 24 };
const parallaxSpring = { stiffness: 320, damping: 34 };

export default function InlineArtwork({
  entryId,
  artworkUrl,
  albumName,
  entryHrefBase = "/entry",
}: InlineArtworkProps) {
  const reduceMotion = useReducedMotion();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const parallaxX = useSpring(mx, parallaxSpring);
  const parallaxY = useSpring(my, parallaxSpring);

  const onMouseMove = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>) => {
      if (reduceMotion) return;
      const el = e.currentTarget;
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      mx.set(nx * 10);
      my.set(ny * 10);
    },
    [reduceMotion, mx, my]
  );

  const onMouseLeave = useCallback(() => {
    mx.set(0);
    my.set(0);
  }, [mx, my]);

  const label = `${albumName} album artwork`;

  if (reduceMotion) {
    return (
      <Link
        href={`${entryHrefBase}/${entryId}`}
        ref={linkRef}
        className={`${styles.artLink} no-underline`}
        aria-label={label}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={artworkUrl}
          alt={label}
          className={styles.imgStatic}
        />
      </Link>
    );
  }

  return (
    <Link
      href={`${entryHrefBase}/${entryId}`}
      ref={linkRef}
      className={`${styles.artLink} no-underline`}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      aria-label={label}
    >
      <motion.img
        src={artworkUrl}
        alt={label}
        className={styles.imgMotion}
        style={{
          x: parallaxX,
          y: parallaxY,
        }}
        whileHover={{
          scale: 1.48,
          rotateZ: 2,
          zIndex: 20,
          boxShadow: "0 14px 32px rgba(26, 26, 26, 0.2)",
          filter: "drop-shadow(0 6px 14px rgba(0, 0, 0, 0.14))",
          transition: hoverSpring,
        }}
        whileTap={{ scale: 0.96, transition: hoverSpring }}
      />
    </Link>
  );
}
