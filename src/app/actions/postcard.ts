"use server";

import { createClient } from "@/lib/supabase/server";
import { requireAdminClient } from "@/lib/supabase/admin";

export async function createPostcard(entryId: string, noteText: string) {
  const trimmed = noteText.trim();
  if (trimmed.length === 0) {
    return { success: false as const, error: "Write a short note for your postcard." };
  }
  if (trimmed.length > 8000) {
    return { success: false as const, error: "Note is too long." };
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false as const, error: "Sign in to create a postcard." };
    }

    const admin = requireAdminClient();

    const { data: entry, error: entryErr } = await admin
      .from("entries")
      .select("id")
      .eq("id", entryId)
      .maybeSingle();

    if (entryErr || !entry) {
      return { success: false as const, error: "Entry not found." };
    }

    const { data, error } = await admin
      .from("postcards")
      .insert({
        entry_id: entryId,
        note_text: trimmed,
      })
      .select("id")
      .single();

    if (error || !data) {
      return {
        success: false as const,
        error: error?.message ?? "Could not create postcard.",
      };
    }

    return { success: true as const, postcardId: data.id as string };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Could not create postcard.",
    };
  }
}
