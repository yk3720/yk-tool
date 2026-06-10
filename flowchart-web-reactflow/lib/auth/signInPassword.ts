"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";

export type SignInPasswordResult = { ok: true } | { ok: false; error: string };

/** パスワードログイン — セッションを Server 側 Cookie に書く（SSR 向け） */
export async function signInWithPasswordAction(
  email: string,
  password: string
): Promise<SignInPasswordResult> {
  const trimmed = email.trim();
  if (!trimmed || !password) {
    return {
      ok: false,
      error: "メールアドレスとパスワードを入力してください。",
    };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: trimmed,
    password,
  });

  if (error) {
    return {
      ok: false,
      error: "メールアドレスまたはパスワードが正しくありません。",
    };
  }

  return { ok: true };
}
