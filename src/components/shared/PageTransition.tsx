"use client";

import { motion, AnimatePresence } from "motion/react";
import { usePathname } from "next/navigation";
import { useReducedMotion } from "@/lib/utils/useReducedMotion";

interface PageTransitionProps {
  children: React.ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const prefersReducedMotion = useReducedMotion();

  if (prefersReducedMotion) {
    return <>{children}</>;
  }

  const isDetail = pathname.startsWith("/entry/");

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{
          opacity: 0,
          scale: isDetail ? 1.05 : 0.95,
          y: isDetail ? 20 : -20,
        }}
        animate={{
          opacity: 1,
          scale: 1,
          y: 0,
        }}
        exit={{
          opacity: 0,
          scale: isDetail ? 0.95 : 1.05,
          y: isDetail ? -20 : 20,
        }}
        transition={{
          duration: 0.45,
          ease: [0.16, 1, 0.3, 1],
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
