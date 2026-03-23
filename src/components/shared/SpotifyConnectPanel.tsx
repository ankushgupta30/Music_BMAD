"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import SearchPanel from "@/components/search/SearchPanel";
import JournalShareSection from "@/components/shared/JournalShareSection";
import styles from "./spotify-connect-panel.module.css";

interface SpotifyConnectPanelProps {
  open: boolean;
  onClose: () => void;
  onSignOut?: () => void;
  connected?: boolean;
  layout?: "dock" | "modal";
}

export default function SpotifyConnectPanel({
  open,
  onClose,
  onSignOut,
  connected,
  layout = "modal",
}: SpotifyConnectPanelProps) {
  const panelRootRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  /** Move focus into the panel when it opens (dock + modal); Escape still closes via handler above. */
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => {
      const root = panelRootRef.current;
      if (!root) return;
      const focusable = root.querySelector<HTMLElement>(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
      );
      focusable?.focus();
    }, 50);
    return () => window.clearTimeout(t);
  }, [open]);

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
          scopes: "user-read-email user-library-read",
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

  const signOut = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    setError(null);
    setBusy(true);
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
      onSignOut?.();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Sign out failed.");
    } finally {
      setBusy(false);
    }
  }, [onSignOut]);

  const [needsReauth, setNeedsReauth] = useState(false);

  const syncLiked = useCallback(async () => {
    setError(null);
    setSyncResult(null);
    setNeedsReauth(false);
    setSyncing(true);
    try {
      const res = await fetch("/api/spotify/sync-liked", { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "SCOPE_MISSING") {
          setNeedsReauth(true);
          setError(json.message);
        } else {
          setError(json.error ?? "Sync failed.");
        }
      } else {
        setSyncResult(
          `Synced ${json.albums ?? json.synced} albums from ${json.total} liked songs.`
        );
      }
    } catch {
      setError("Network error during sync.");
    } finally {
      setSyncing(false);
    }
  }, []);

  if (!open) return null;

  const panelClass =
    layout === "dock" ? styles.panelDock : styles.panel;

  const inner = (
    <div
      ref={panelRootRef}
      id="spotify-panel-root"
      className={panelClass}
      role="dialog"
      aria-modal={layout === "modal"}
      aria-labelledby="spotify-panel-title"
    >
      <p className={styles.title} id="spotify-panel-title">
        Spotify
      </p>

      {connected ? (
        <>
          <h2 className={styles.heading}>Search</h2>
          <SearchPanel />

          <div className={styles.syncSection}>
            <button
              type="button"
              className={styles.syncBtn}
              onClick={syncLiked}
              disabled={syncing}
            >
              {syncing ? "Syncing…" : "Sync Liked Songs"}
            </button>
            {syncResult && <p className={styles.syncResult}>{syncResult}</p>}
            {needsReauth && (
              <button
                type="button"
                className={styles.connectBtn}
                onClick={async () => {
                  await signOut();
                  connect();
                }}
              >
                Sign out &amp; reconnect
              </button>
            )}
          </div>

          <JournalShareSection />
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
        {connected && (
          <button
            type="button"
            className={styles.closeBtn}
            onClick={signOut}
            disabled={busy}
          >
            Sign out
          </button>
        )}
        <button type="button" className={styles.closeBtn} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );

  if (layout === "dock") {
    return inner;
  }

  return (
    <>
      <button
        type="button"
        className={styles.backdrop}
        aria-label="Close panel"
        onClick={onClose}
      />
      {inner}
    </>
  );
}
