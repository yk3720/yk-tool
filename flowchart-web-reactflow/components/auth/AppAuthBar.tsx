"use client";

import type { ProfileRole } from "@/lib/auth/types";

type Props = {
  email: string;
  role: ProfileRole;
  showDevBanner?: boolean;
};

export function AppAuthBar({ email, role, showDevBanner }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-600">
      {showDevBanner ? (
        <span className="rounded bg-amber-100 px-2 py-0.5 font-medium text-amber-900">
          認証オフ（ローカル）
        </span>
      ) : null}
      <span>
        {email}
        <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 font-medium text-slate-800">
          {role === "editor" ? "編集者" : "閲覧者"}
        </span>
      </span>
      <form action="/auth/signout" method="post" className="ml-auto">
        <button
          type="submit"
          className="rounded border border-slate-300 px-2 py-1 hover:bg-white"
        >
          ログアウト
        </button>
      </form>
    </div>
  );
}
