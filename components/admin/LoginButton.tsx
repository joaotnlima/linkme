"use client";

import { createBrowserClient } from "@supabase/ssr";

export function LoginButton() {
  async function signIn() {
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    });
  }
  return (
    <button type="button" onClick={signIn} className="h-12 rounded-xl bg-ink text-bg font-semibold cursor-pointer">
      Continue with GitHub
    </button>
  );
}
