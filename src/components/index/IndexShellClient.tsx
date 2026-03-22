"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import SpotifyConnectPanel from "@/components/shared/SpotifyConnectPanel";
import SpotifyIcon from "@/components/shared/SpotifyIcon";
import styles from "./index-shell.module.css";

function hasSessionUser(user: { id?: string } | null | undefined): boolean {
  return !!user?.id;
}

export default function IndexShellClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [panelOpen, setPanelOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  const syncSession = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const supabase = createClient();
      const { data: sessionData } = await supabase.auth.getSession();
      if (sessionData.session?.user) {
        setConnected(hasSessionUser(sessionData.session.user));
        return;
      }
      const { data } = await supabase.auth.getUser();
      setConnected(hasSessionUser(data.user));
    } catch {
      setConnected(false);
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    void syncSession();

    let subscription: { unsubscribe: () => void } | undefined;
    try {
      const supabase = createClient();
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setConnected(hasSessionUser(session?.user ?? null));
      });
      subscription = data.subscription;
    } catch {
      /* ignore */
    }

    return () => subscription?.unsubscribe();
  }, [syncSession]);

  useEffect(() => {
    if (panelOpen) void syncSession();
  }, [panelOpen, syncSession]);

  return (
    <div className={styles.shell}>
      <aside
        className={`${styles.drawer} ${panelOpen ? styles.drawerOpen : ""}`}
        aria-hidden={!panelOpen}
        id="rewind-spotify-drawer"
      >
        <div className={styles.drawerInner}>
          {panelOpen ? (
            <SpotifyConnectPanel
              layout="dock"
              open
              onClose={() => setPanelOpen(false)}
              connected={connected}
            />
          ) : null}
        </div>
      </aside>

      <aside className={styles.sidebar} aria-label="Site">
        <span className={styles.logo}>Rewind</span>
        <SpotifyIcon
          onClick={() => setPanelOpen((o) => !o)}
          connected={connected}
          aria-expanded={panelOpen}
        />
      </aside>

      <div className={styles.main}>{children}</div>
    </div>
  );
}
