"use client";

import { useState } from "react";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";

type Props = {
  nextPath: string;
  authError?: boolean;
};

export function LoginForm({ nextPath, authError }: Props) {
  const [loading, setLoading] = useState<"google" | "azure" | null>(null);
  const [error, setError] = useState<string | null>(
    authError ? "ログインに失敗しました。もう一度お試しください。" : null,
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

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-6 px-4">
      <div>
        <h1 className="text-2xl font-semibold text-slate-900">Flowchart Web</h1>
        <p className="mt-2 text-sm text-slate-600">
          社内アカウントでログインしてください。初回は管理者が許可リストにメールを登録した後に利用できます。
        </p>
      </div>
      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-800" role="alert">
          {error}
        </p>
      ) : null}
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
      </div>
    </div>
  );
}
