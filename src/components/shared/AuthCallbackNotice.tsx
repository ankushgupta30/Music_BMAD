"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import styles from "./auth-callback-notice.module.css";

function decodeDesc(raw: string | null): string {
  if (!raw) return "";
  try {
    return decodeURIComponent(raw.replace(/\+/g, " "));
  } catch {
    return raw;
  }
}

function AuthCallbackNoticeInner() {
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [cleanedUrl, setCleanedUrl] = useState(false);

  useEffect(() => {
    const authError = searchParams.get("auth_error");
    const exchangeFailed =
      authError === "could_not_exchange_code"
        ? "Sign-in could not finish (code exchange failed). This often happens together with Supabase email rate limits — details may appear in the URL fragment."
        : null;

    const h =
      typeof window !== "undefined"
        ? window.location.hash?.replace(/^#/, "")
        : "";
    let hashMessage: string | null = null;
    if (h) {
      const params = new URLSearchParams(h);
      const errorCode = params.get("error_code");
      const errorDesc = params.get("error_description");

      if (errorCode === "over_email_send_rate_limit") {
        hashMessage =
          "Supabase temporarily blocked sign-in (email rate limit). Wait about 1 minute, then try “Connect with Spotify” again. If this keeps happening: Supabase → Authentication → Providers → Email → disable “Confirm email” for testing, or wait longer between attempts.";
      } else if (errorCode || params.get("error")) {
        hashMessage = `${errorCode ?? params.get("error")}: ${decodeDesc(errorDesc)}`.trim();
      }
    }

    const final = hashMessage ?? exchangeFailed;
    if (final) setMessage(final);
  }, [searchParams]);

  useEffect(() => {
    if (!message || cleanedUrl || typeof window === "undefined") return;
    const url = new URL(window.location.href);
    url.hash = "";
    url.searchParams.delete("auth_error");
    const next = url.pathname + (url.search || "");
    window.history.replaceState({}, "", next || "/");
    setCleanedUrl(true);
  }, [message, cleanedUrl]);

  if (!message) return null;

  return (
    <div className={styles.banner} role="alert">
      <p className={styles.text}>{message}</p>
    </div>
  );
}

export default function AuthCallbackNotice() {
  return (
    <Suspense fallback={null}>
      <AuthCallbackNoticeInner />
    </Suspense>
  );
}
