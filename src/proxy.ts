import type { NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/update-edge-session";

export default async function proxy(request: NextRequest) {
  return updateSupabaseSession(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|fonts/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
