"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

export default function RouteAnnouncer() {
  const pathname = usePathname();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;

    const label = pathname === "/"
      ? "Rewind — Music Index"
      : `Entry detail page`;

    ref.current.textContent = label;
  }, [pathname]);

  return (
    <div
      ref={ref}
      role="status"
      aria-live="polite"
      aria-atomic="true"
      className="sr-only"
    />
  );
}
