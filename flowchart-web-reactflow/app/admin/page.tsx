import Link from "next/link";
import { redirect } from "next/navigation";

import { DeleteEquipmentForm } from "@/components/admin/DeleteEquipmentForm";
import { isAdminRole } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/session";
export default async function AdminPage() {
  const state = await getAuthState();

  if (state.kind === "guest") {
    redirect("/login");
  }
  if (state.kind === "pending") {
    redirect("/login/no-access");
  }
  if (state.kind === "disabled") {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <h1 className="text-lg font-semibold text-slate-900">管理（M-3）</h1>
        <p className="mt-4 text-sm text-amber-800">
          認証オフ（AUTH_DISABLED）のため管理機能は利用できません。Supabase
          接続を有効にしてください。
        </p>
        <Link href="/" className="mt-4 inline-block text-sm text-blue-700">
          ← フローチャートへ
        </Link>
      </main>
    );
  }

  if (!isAdminRole(state.context.role)) {
    redirect("/");
  }

  return (
    <main className="mx-auto max-w-2xl p-6">
      <div className="mb-6 flex flex-wrap items-center gap-3 border-b border-slate-200 pb-4">
        <h1 className="text-lg font-semibold text-slate-900">管理（M-3）</h1>
        <span className="rounded bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-800">
          {state.context.email}
        </span>
        <Link
          href="/"
          className="ml-auto text-sm text-blue-700 hover:underline"
        >
          ← フローチャートへ
        </Link>
      </div>

      <section>
        <h2 className="text-base font-medium text-slate-900">
          誤登録装置の削除
        </h2>
        <div className="mt-4">
          <DeleteEquipmentForm />
        </div>
      </section>
    </main>
  );
}
