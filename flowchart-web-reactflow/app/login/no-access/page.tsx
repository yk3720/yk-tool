import Link from "next/link";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { isAuthDisabled } from "@/lib/supabase/env";

export default async function NoAccessPage() {
  if (isAuthDisabled()) {
    return null;
  }

  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-4 px-4">
      <h1 className="text-xl font-semibold text-slate-900">
        アクセス権がありません
      </h1>
      <p className="text-sm text-slate-600">
        {user?.email ? (
          <>
            <strong>{user.email}</strong> はまだ Flowchart Web
            の利用許可がありません。管理者にアクセス許可の付与を依頼してください。
          </>
        ) : (
          <>ログイン情報を確認できませんでした。</>
        )}
      </p>
      <form action="/auth/signout" method="post">
        <button
          type="submit"
          className="text-sm text-slate-700 underline hover:text-slate-900"
        >
          別のアカウントでログイン
        </button>
      </form>
      <Link
        href="/login"
        className="text-sm text-slate-500 hover:text-slate-700"
      >
        ログイン画面へ
      </Link>
    </div>
  );
}
