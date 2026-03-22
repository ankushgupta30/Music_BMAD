"use client";

import { useCallback, useEffect, useState } from "react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import SpotifyIcon from "./SpotifyIcon";
import SpotifyConnectPanel from "./SpotifyConnectPanel";

/** Any Supabase session counts as “connected” — Rewind only uses Spotify OAuth today. */
function hasSessionUser(user: { id?: string } | null | undefined): boolean {
  return !!user?.id;
}

export default function SpotifySidebarSlot() {
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
      // ignore
    }

    return () => subscription?.unsubscribe();
  }, [syncSession]);

  // After OAuth redirect, session is on the client — refresh when panel opens
  useEffect(() => {
    if (panelOpen) void syncSession();
  }, [panelOpen, syncSession]);

  return (
    <>
      <SpotifyIcon onClick={() => setPanelOpen(true)} connected={connected} />
      <SpotifyConnectPanel
        open={panelOpen}
        onClose={() => setPanelOpen(false)}
        connected={connected}
      />
    </>
  );
}
