"use client";

import { useCallback, useEffect, useState } from "react";
import { createPostcard } from "@/app/actions/postcard";
import styles from "./postcard-composer.module.css";

interface PostcardComposerProps {
  entryId: string;
  artistName: string;
  albumName: string;
  artworkUrl: string | null;
  authenticated: boolean;
}

export default function PostcardComposer({
  entryId,
  artistName,
  albumName,
  artworkUrl,
  authenticated,
}: PostcardComposerProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const reset = useCallback(() => {
    setNote("");
    setError(null);
    setShareUrl(null);
    setCopied(false);
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    reset();
  }, [reset]);

  const submit = useCallback(async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await createPostcard(entryId, note);
      if (!result.success) {
        setError(result.error);
        return;
      }
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      setShareUrl(`${origin}/postcard/${result.postcardId}`);
    } finally {
      setBusy(false);
    }
  }, [entryId, note]);

  const copy = useCallback(async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Could not copy — select the link manually.");
    }
  }, [shareUrl]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  if (!authenticated) return null;

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setOpen(true)}
      >
        This made me think of you
      </button>

      {open && (
        <div className={styles.overlay} role="presentation">
          <button
            type="button"
            className={styles.backdrop}
            aria-label="Close postcard composer"
            onClick={close}
          />
          <div
            className={styles.dialog}
            role="dialog"
            aria-modal="true"
            aria-labelledby="postcard-dialog-title"
          >
            <h2 className={styles.title} id="postcard-dialog-title">
              Postcard
            </h2>
            <p className={styles.subtitle}>
              {artistName} — {albumName}
            </p>

            {artworkUrl ? (
              <div className={styles.artWrap}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={artworkUrl}
                  alt=""
                  className={styles.art}
                />
              </div>
            ) : null}

            {!shareUrl ? (
              <>
                <label className={styles.label} htmlFor="postcard-note">
                  A few words for them
                </label>
                <textarea
                  id="postcard-note"
                  className={styles.textarea}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Why this album, right now?"
                  rows={5}
                  disabled={busy}
                />
                {error && <p className={styles.error}>{error}</p>}
                <div className={styles.actions}>
                  <button
                    type="button"
                    className={styles.secondary}
                    onClick={close}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() => void submit()}
                    disabled={busy || note.trim().length === 0}
                  >
                    {busy ? "Creating…" : "Create link"}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className={styles.hint}>
                  Send this link — they don&apos;t need an account.
                </p>
                <div className={styles.urlRow}>
                  <input
                    type="text"
                    readOnly
                    className={styles.urlInput}
                    value={shareUrl}
                  />
                  <button
                    type="button"
                    className={styles.primary}
                    onClick={() => void copy()}
                  >
                    {copied ? "Copied" : "Copy"}
                  </button>
                </div>
                {error && <p className={styles.error}>{error}</p>}
                <button
                  type="button"
                  className={styles.secondary}
                  onClick={close}
                >
                  Done
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
