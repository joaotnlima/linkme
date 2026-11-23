import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth-provider";
import { hasSupabase } from "@linkme/core/lib/env";

export async function POST(request: NextRequest) {
  if (hasSupabase) {
    const supabase = await supabaseServer();
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/admin/login", new URL(request.url).origin), { status: 303 });
}
