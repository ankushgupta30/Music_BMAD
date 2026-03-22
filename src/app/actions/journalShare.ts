"use server";

import { randomUUID } from "crypto";
import { createClient } from "@/lib/supabase/server";
import { requireAdminClient } from "@/lib/supabase/admin";

export async function getOrCreateJournalShareToken() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false as const, error: "Sign in to share your journal." };
    }

    const admin = requireAdminClient();

    const { data: existing } = await admin
      .from("journal_shares")
      .select("token")
      .eq("owner_id", user.id)
      .maybeSingle();

    if (existing?.token) {
      return { success: true as const, token: existing.token as string };
    }

    const token = randomUUID();

    const { error } = await admin.from("journal_shares").insert({
      owner_id: user.id,
      token,
    });

    if (error) {
      if (error.code === "23505") {
        const { data: row } = await admin
          .from("journal_shares")
          .select("token")
          .eq("owner_id", user.id)
          .maybeSingle();
        if (row?.token) {
          return { success: true as const, token: row.token as string };
        }
      }
      return { success: false as const, error: error.message };
    }

    return { success: true as const, token };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Could not create share link.",
    };
  }
}

export async function rotateJournalShareToken() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false as const, error: "Sign in first." };
    }

    const admin = requireAdminClient();
    const token = randomUUID();

    const { error } = await admin
      .from("journal_shares")
      .upsert(
        { owner_id: user.id, token },
        { onConflict: "owner_id" }
      );

    if (error) {
      return { success: false as const, error: error.message };
    }

    return { success: true as const, token };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Could not rotate link.",
    };
  }
}
