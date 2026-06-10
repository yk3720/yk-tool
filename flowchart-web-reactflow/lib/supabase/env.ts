/** 認証バイパスは AUTH_DISABLED=1 の明示時のみ（URL 未設定では無効化しない） */
export function isAuthDisabled(): boolean {
  return process.env.AUTH_DISABLED === "1";
}

export function getSupabaseEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY が未設定です"
    );
  }
  return { url, anonKey };
}

/** 本番で Supabase 未設定かつ AUTH_DISABLED でない場合は起動を止める */
export function assertProductionSupabaseEnv(): void {
  if (process.env.NODE_ENV !== "production") return;
  if (isAuthDisabled()) return;
  getSupabaseEnv();
}
