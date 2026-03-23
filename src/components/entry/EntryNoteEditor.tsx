"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { updateEntryNote } from "@/app/actions/entries";
import styles from "./entry-note-editor.module.css";

const DEBOUNCE_MS = 650;

interface EntryNoteEditorProps {
  entryId: string;
  initialNote: string | null;
  authenticated: boolean;
  /** Borderless, fills journal sheet on entry detail */
  variant?: "default" | "journal";
}

export default function EntryNoteEditor({
  entryId,
  initialNote,
  authenticated,
  variant = "default",
}: EntryNoteEditorProps) {
  const [value, setValue] = useState(initialNote ?? "");
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastSavedRef = useRef(initialNote ?? "");

  useEffect(() => {
    setValue(initialNote ?? "");
    lastSavedRef.current = initialNote ?? "";
  }, [initialNote]);

  const flushSave = useCallback(
    async (text: string) => {
      if (!authenticated) return;
      if (text === lastSavedRef.current) return;

      setStatus("saving");
      setErrorMessage(null);
      const result = await updateEntryNote(entryId, text);
      if (result.success) {
        lastSavedRef.current = text;
        setStatus("saved");
        window.setTimeout(() => setStatus("idle"), 2000);
      } else {
        setStatus("error");
        setErrorMessage(result.error);
      }
    },
    [authenticated, entryId]
  );

  const scheduleSave = useCallback(
    (text: string) => {
      if (!authenticated) return;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        void flushSave(text);
      }, DEBOUNCE_MS);
    },
    [authenticated, flushSave]
  );

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const next = e.target.value;
    setValue(next);
    if (authenticated) scheduleSave(next);
  };

  const onBlur = () => {
    if (!authenticated) return;
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = undefined;
    }
    void flushSave(value);
  };

  const isJournal = variant === "journal";

  return (
    <div
      className={`${styles.wrap} ${isJournal ? styles.wrapJournal : ""}`.trim()}
    >
      {!isJournal && (
        <label className={styles.label} htmlFor={`note-${entryId}`}>
          Journal
        </label>
      )}
      <textarea
        id={`note-${entryId}`}
        className={`${styles.textarea} ${isJournal ? styles.textareaJournal : ""}`.trim()}
        value={value}
        onChange={onChange}
        onBlur={onBlur}
        placeholder={
          authenticated
            ? "What does this album mean to you?"
            : "Sign in with Spotify on the index to save notes here."
        }
        disabled={!authenticated}
        spellCheck
        aria-describedby={authenticated ? `note-meta-${entryId}` : undefined}
      />
      {authenticated ? (
        <p
          id={`note-meta-${entryId}`}
          className={styles.meta}
          aria-live="polite"
        >
          {status === "saving" && <span>Saving…</span>}
          {status === "saved" && <span>Saved</span>}
          {status === "error" && (
            <span className={styles.error}>{errorMessage ?? "Save failed"}</span>
          )}
          {status === "idle" && <span>Autosaves as you type</span>}
        </p>
      ) : (
        <p className={styles.hint}>
          Open the Spotify panel on the index and connect to enable journaling.
        </p>
      )}
    </div>
  );
}
