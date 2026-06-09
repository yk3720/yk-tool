"use client";

import { useState } from "react";

import { signInWithPasswordAction } from "@/lib/auth/signInPassword";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  nextPath: string;
  authError?: boolean;
};

export function LoginForm({ nextPath, authError }: Props) {
  const [loading, setLoading] = useState<
    "google" | "azure" | "email" | "password" | null
  >(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState<string | null>(
    authError ? "ログインに失敗しました。もう一度お試しください。" : null
  );

  const signIn = async (provider: "google" | "azure") => {
    setLoading(provider);
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider,
        options: { redirectTo },
      });
      if (signInError) {
        setError(signInError.message);
        setLoading(null);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setLoading(null);
    }
  };

  const signInWithPassword = async () => {
    if (!email.trim() || !password) return;
    setLoading("password");
    setError(null);
    try {
      const result = await signInWithPasswordAction(email, password);
      if (!result.ok) {
        setError(result.error);
      } else {
        // Server Action で Cookie 設定後 — フルリロードで middleware / RSC がセッションを読む
        window.location.assign(nextPath);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  };

  const signInWithEmail = async () => {
    if (!email.trim()) return;
    setLoading("email");
    setError(null);
    try {
      const supabase = createSupabaseBrowserClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`;
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: email.trim(),
        options: { emailRedirectTo: redirectTo },
      });
      if (signInError) {
        setError(signInError.message);
      } else {
        setMagicLinkSent(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Flowchart Web</h1>
        <p className="mt-2 text-sm text-slate-600">
          社内アカウントでログインしてください。初回は管理者が許可リストにメールを登録した後に利用できます。
        </p>
      </div>
      {error ? (
        <p
          className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800"
          role="alert"
        >
          {error}
        </p>
      ) : null}
      {magicLinkSent ? (
        <p className="rounded-md bg-green-50 px-3 py-2 text-sm text-green-800">
          メールを送信しました。受信ボックスのリンクをクリックしてログインしてください。
        </p>
      ) : (
        <div className="flex flex-col gap-3">
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void signIn("google")}
            className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
          >
            {loading === "google" ? "リダイレクト中…" : "Google でログイン"}
          </button>
          <button
            type="button"
            disabled={loading !== null}
            onClick={() => void signIn("azure")}
            className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
          >
            {loading === "azure" ? "リダイレクト中…" : "Microsoft でログイン"}
          </button>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            または
            <div className="h-px flex-1 bg-slate-200" />
          </div>
          <div className="flex flex-col gap-2">
            <input
              type="email"
              placeholder="メールアドレス"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void signInWithPassword();
              }}
              disabled={loading !== null}
              autoComplete="email"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:opacity-50"
            />
            <input
              type="password"
              placeholder="パスワード"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void signInWithPassword();
              }}
              disabled={loading !== null}
              autoComplete="current-password"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-slate-500 disabled:opacity-50"
            />
            <button
              type="button"
              disabled={loading !== null || !email.trim() || !password}
              onClick={() => void signInWithPassword()}
              className="rounded-md bg-slate-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-50"
            >
              {loading === "password" ? "ログイン中…" : "パスワードでログイン"}
            </button>
            <button
              type="button"
              disabled={loading !== null || !email.trim()}
              onClick={() => void signInWithEmail()}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-800 hover:bg-slate-50 disabled:opacity-50"
            >
              {loading === "email"
                ? "送信中…"
                : "メールでログイン（Magic Link）"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
