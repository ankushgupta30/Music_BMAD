"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { useReducedMotion } from "@/lib/utils/useReducedMotion";

const TRANSITION_MS = 280;

function isEntryDetailPath(path: string): boolean {
  return /\/entry\/[^/]+$/.test(path) || /^\/share\/[^/]+\/entry\/[^/]+$/.test(path);
}

function isIndexPath(path: string): boolean {
  return path === "/" || /^\/share\/[^/]+\/?$/.test(path);
}

function focusAfterRouteChange(pathname: string): void {
  if (isEntryDetailPath(pathname)) {
    const h = document.querySelector("main h1.font-display");
    if (h instanceof HTMLElement) {
      h.tabIndex = -1;
      h.focus({ preventScroll: true });
    }
    return;
  }

  if (isIndexPath(pathname)) {
    const link = document.querySelector<HTMLElement>(
      "main a.indexArtistLink:not([tabindex='-1'])"
    );
    if (link) {
      link.focus({ preventScroll: true });
      return;
    }
    const emptyTitle = document.querySelector("main h2");
    if (emptyTitle instanceof HTMLElement) {
      emptyTitle.tabIndex = -1;
      emptyTitle.focus({ preventScroll: true });
    }
  }
}

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();
  const prevPathRef = useRef<string | null>(null);

  useEffect(() => {
    const prev = prevPathRef.current;
    prevPathRef.current = pathname;
    if (prev === null) return;

    const delay = prefersReducedMotion ? 0 : TRANSITION_MS;
    const id = window.setTimeout(() => {
      focusAfterRouteChange(pathname);
    }, delay);
    return () => window.clearTimeout(id);
  }, [pathname, prefersReducedMotion]);

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  const isDetail = isEntryDetailPath(pathname);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          scale: isDetail ? 1.04 : 0.97,
          y: isDetail ? 12 : -12,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: isDetail ? 0.97 : 1.04,
          y: isDetail ? -12 : 12,
        }}
        transition={{
          duration: 0.28,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
