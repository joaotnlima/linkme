import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/auth";

// Supabase OAuth (GitHub) lands here with ?code=...; exchange it for a session cookie.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await supabaseServer();
    await supabase.auth.exchangeCodeForSession(code);
  }
  return NextResponse.redirect(new URL("/admin", url.origin));
}
