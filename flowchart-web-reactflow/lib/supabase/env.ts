export function isAuthDisabled(): boolean {
  if (process.env.AUTH_DISABLED === "1") return true;
  return !process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です",
    );
  }
  return { url, anonKey };
}
