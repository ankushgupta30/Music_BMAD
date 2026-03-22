"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import SearchPanel from "@/components/search/SearchPanel";
import styles from "./spotify-connect-panel.module.css";

interface SpotifyConnectPanelProps {
  open: boolean;
  onClose: () => void;
  connected?: boolean;
}

export default function SpotifyConnectPanel({
  open,
  onClose,
  connected,
}: SpotifyConnectPanelProps) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const connect = useCallback(async () => {
    if (!isSupabaseConfigured) {
      setError(
        "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
      );
      return;
    }
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      const origin =
        typeof window !== "undefined" ? window.location.origin : "";
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "spotify",
        options: {
          redirectTo: `${origin}/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
      }
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Could not start Spotify sign-in."
      );
    } finally {
      setBusy(false);
    }
  }, []);

  if (!open) return null;

  return (
    <>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close panel"
        onClick={onClose}
      />
      <div
        className={styles.panel}
        role="dialog"
        aria-modal="true"
        aria-labelledby="spotify-panel-title"
      >
        <p className={styles.title} id="spotify-panel-title">
          Spotify
        </p>

        {connected ? (
          <>
            <h2 className={styles.heading}>Search</h2>
            <SearchPanel />
          </>
        ) : (
          <>
            <h2 className={styles.heading}>Connect your account</h2>
            <p className={styles.body}>
              Sign in with Spotify to search and add albums to your Rewind
              journal.
            </p>
            {!isSupabaseConfigured && (
              <p className={styles.error}>
                Supabase is not configured. Set environment variables to enable
                authentication.
              </p>
            )}
          </>
        )}

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          {!connected && (
            <button
              type="button"
              className={styles.connectBtn}
              onClick={connect}
              disabled={busy || !isSupabaseConfigured}
            >
              {busy ? "Opening…" : "Connect with Spotify"}
            </button>
          )}
          <button type="button" className={styles.closeBtn} onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </>
  );
}
