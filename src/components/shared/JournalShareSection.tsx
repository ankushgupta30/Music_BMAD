"use client";

import { useCallback, useState } from "react";
import {
  getOrCreateJournalShareToken,
  rotateJournalShareToken,
} from "@/app/actions/journalShare";
import styles from "./journal-share-section.module.css";

export default function JournalShareSection() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const makeLink = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await getOrCreateJournalShareToken();
      if (!result.success) {
        setError(result.error);
        return;
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setUrl(`${origin}/share/${result.token}`);
    } finally {
      setBusy(false);
    }
  }, []);

  const newLink = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await rotateJournalShareToken();
      if (!result.success) {
        setError(result.error);
        return;
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setUrl(`${origin}/share/${result.token}`);
      setCopied(false);
    } finally {
      setBusy(false);
    }
  }, []);

  const copy = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy.");
    }
  }, [url]);

  return (
    <div className={styles.section}>
      <p className={styles.label}>Share journal</p>
      <p className={styles.body}>
        Read-only link to your typographic index. Private notes stay hidden on
        entry pages.
      </p>
      {!url ? (
        <button
          type="button"
          className={styles.btn}
          onClick={() => void makeLink()}
          disabled={busy}
        >
          {busy ? "…" : "Get share link"}
        </button>
      ) : (
        <div className={styles.row}>
          <input type="text" readOnly className={styles.input} value={url} />
          <button
            type="button"
            className={styles.btnPrimary}
            onClick={() => void copy()}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      )}
      {url && (
        <button
          type="button"
          className={styles.linkish}
          onClick={() => void newLink()}
          disabled={busy}
        >
          Generate new link (invalidates old)
        </button>
      )}
      {error && <p className={styles.error}>{error}</p>}
    </div>
  );
}
