"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "motion/react";
import { useReducedMotion } from "@/lib/utils/useReducedMotion";
import { useIndexScrollContainer } from "./IndexScrollContainerContext";
import styles from "./inline-artwork.module.css";

interface InlineArtworkProps {
  entryId: string;
  artworkUrl: string;
  albumName: string;
  entryHrefBase?: string;
  /** Match IndexEntry — only first horizontal copy is tabbable. */
  includeInTabOrder?: boolean;
}

/** ~2× prior hover “pop” (plan): peak scale while pointer/focus engaged. */
const HOVER_PEAK_SCALE = 2.65;
/** Scroll-only boost when cover nears horizontal center of the index viewport. */
const SCROLL_BOOST_MAX = 0.22;
const scaleSpring = { stiffness: 420, damping: 29 };
const parallaxSpring = { stiffness: 320, damping: 34 };

export default function InlineArtwork({
  entryId,
  artworkUrl,
  albumName,
  entryHrefBase = "/entry",
  includeInTabOrder = true,
}: InlineArtworkProps) {
  const reduceMotion = useReducedMotion();
  const scrollContainerRef = useIndexScrollContainer();
  const linkRef = useRef<HTMLAnchorElement>(null);
  const hoveredRef = useRef(false);
  const lastScrollScaleRef = useRef(1);
  const lastProximityRef = useRef(0);
  const rafRef = useRef(0);

  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const parallaxX = useSpring(mx, parallaxSpring);
  const parallaxY = useSpring(my, parallaxSpring);

  const scaleTargetMv = useMotionValue(1);
  const scaleSmoothed = useSpring(scaleTargetMv, scaleSpring);

  /** Pointer or keyboard focus — drives rotate + peak scale. */
  const [engaged, setEngaged] = useState(false);
  /** Lifts stacking / shadow when near viewport center or engaged. */
  const [elevated, setElevated] = useState(false);

  const applyPointerBoost = useCallback(() => {
    scaleTargetMv.set(HOVER_PEAK_SCALE);
  }, [scaleTargetMv]);

  const clearPointerBoost = useCallback(() => {
    scaleTargetMv.set(lastScrollScaleRef.current);
  }, [scaleTargetMv]);

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

  useEffect(() => {
    if (reduceMotion) return;
    const container = scrollContainerRef?.current;
    const link = linkRef.current;
    if (!container || !link) return;

    const update = () => {
      const cr = container.getBoundingClientRect();
      const lr = link.getBoundingClientRect();
      const centerX = cr.left + cr.width / 2;
      const linkCenterX = lr.left + lr.width / 2;
      const halfBand = Math.max(cr.width * 0.4, 72);
      const dist = Math.abs(linkCenterX - centerX);
      const proximity = Math.max(0, Math.min(1, 1 - dist / halfBand));
      lastProximityRef.current = proximity;
      const scrollScale = 1 + proximity * SCROLL_BOOST_MAX;
      lastScrollScaleRef.current = scrollScale;

      if (!hoveredRef.current) {
        scaleTargetMv.set(scrollScale);
      }

      setElevated(proximity > 0.12 || hoveredRef.current);
    };

    const schedule = () => {
      if (rafRef.current) return;
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = 0;
        update();
      });
    };

    update();
    container.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule, { passive: true });
    const ro = new ResizeObserver(schedule);
    ro.observe(container);

    return () => {
      container.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [reduceMotion, scrollContainerRef, scaleTargetMv]);

  const label = `${albumName} album artwork`;

  if (reduceMotion) {
    return (
      <Link
        href={`${entryHrefBase}/${entryId}`}
        prefetch
        ref={linkRef}
        className={`${styles.artLink} no-underline`}
        aria-label={label}
        tabIndex={includeInTabOrder ? undefined : -1}
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
      prefetch
      ref={linkRef}
      className={`${styles.artLink} no-underline ${elevated ? styles.artLinkElevated : ""}`}
      onMouseMove={onMouseMove}
      onMouseLeave={() => {
        hoveredRef.current = false;
        setEngaged(false);
        clearPointerBoost();
        onMouseLeave();
        requestAnimationFrame(() => {
          setElevated(lastProximityRef.current > 0.12);
        });
      }}
      onMouseEnter={() => {
        hoveredRef.current = true;
        setEngaged(true);
        applyPointerBoost();
      }}
      onFocus={() => {
        hoveredRef.current = true;
        setEngaged(true);
        applyPointerBoost();
      }}
      onBlur={() => {
        hoveredRef.current = false;
        setEngaged(false);
        clearPointerBoost();
        requestAnimationFrame(() => {
          setElevated(lastProximityRef.current > 0.12);
        });
      }}
      aria-label={label}
      tabIndex={includeInTabOrder ? undefined : -1}
    >
      <motion.img
        src={artworkUrl}
        alt={label}
        className={styles.imgMotion}
        style={{
          x: parallaxX,
          y: parallaxY,
          scale: scaleSmoothed,
          rotateZ: engaged ? 2 : 0,
          zIndex: elevated ? 25 : 1,
          boxShadow: elevated
            ? "0 18px 40px rgba(26, 26, 26, 0.22)"
            : "0 2px 8px rgba(26, 26, 26, 0.06)",
          filter: elevated
            ? "drop-shadow(0 8px 18px rgba(0, 0, 0, 0.14))"
            : "none",
        }}
      />
    </Link>
  );
}
