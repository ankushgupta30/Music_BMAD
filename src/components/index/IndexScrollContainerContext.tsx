"use client";

import { createContext, useContext, type RefObject } from "react";

/** Ref to `.indexScroll` — used for scroll-linked cover proximity. */
export const IndexScrollContainerContext =
  createContext<RefObject<HTMLDivElement | null> | null>(null);

export function useIndexScrollContainer(): RefObject<HTMLDivElement | null> | null {
  return useContext(IndexScrollContainerContext);
}
