"use client";

import { useEffect, useState } from "react";
import { isSupabaseConfigured, createClient } from "@/lib/supabase/client";
import SpotifyIcon from "./SpotifyIcon";
import SpotifyConnectPanel from "./SpotifyConnectPanel";

export default function SpotifySidebarSlot() {
  const [panelOpen, setPanelOpen] = useState(false);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!isSupabaseConfigured) return;
    try {
      const supabase = createClient();
      supabase.auth.getUser().then(({ data }) => {
        if (data.user) {
          const isSpotify =
            data.user.app_metadata?.provider === "spotify" ||
            data.user.app_metadata?.providers?.includes("spotify");
          setConnected(!!isSpotify);
        }
      });
    } catch {
      // Supabase not configured — stay disconnected
    }
  }, []);

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
