"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const SCALE_TIERS = ["large", "medium", "small"] as const;

interface AddEntryInput {
  spotify_id: string;
  artist_name: string;
  album_name: string;
  song_name?: string;
  release_year?: number;
  artwork_url: string;
}

export async function addEntry(input: AddEntryInput) {
  try {
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return { success: false as const, error: "Not authenticated." };
    }

    const scaleTier = SCALE_TIERS[Math.floor(Math.random() * SCALE_TIERS.length)];
    const hoverColorIndex = Math.floor(Math.random() * 8);

    const { data, error } = await supabase
      .from("entries")
      .upsert(
        {
          spotify_id: input.spotify_id,
          artist_name: input.artist_name,
          album_name: input.album_name,
          song_name: input.song_name ?? input.album_name,
          release_year: input.release_year ?? 0,
          artwork_url: input.artwork_url,
          scale_tier: scaleTier,
          hover_color_index: hoverColorIndex,
        },
        { onConflict: "spotify_id", ignoreDuplicates: true }
      )
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return { success: true as const, data: null };
      }
      return { success: false as const, error: error.message };
    }

    revalidatePath("/");
    return { success: true as const, data };
  } catch (e) {
    return {
      success: false as const,
      error: e instanceof Error ? e.message : "Failed to add entry.",
    };
  }
}
