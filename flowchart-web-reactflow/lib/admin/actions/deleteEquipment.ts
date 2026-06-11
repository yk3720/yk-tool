"use server";

import { revalidatePath } from "next/cache";

import { requireAdmin } from "@/lib/auth/adminAuth";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteEquipmentResult =
  | { ok: true; internal_code: string }
  | { ok: false; error: string };

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "ログインが必要です";
  }
  if (message.includes("admin_required")) {
    return "管理者権限がありません";
  }
  if (message.includes("device not found")) {
    return "社内番号に該当する装置が見つかりません";
  }
  if (message.includes("internal_code required")) {
    return "社内番号を入力してください";
  }
  return message;
}

export async function deleteEquipmentByInternalCode(
  internalCode: string
): Promise<DeleteEquipmentResult> {
  const code = internalCode.trim();
  if (!code) {
    return { ok: false, error: "社内番号を入力してください" };
  }

  if (isAuthDisabled()) {
    return { ok: false, error: "クラウド未設定（AUTH_DISABLED）" };
  }

  try {
    await requireAdmin();

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("rpc_admin_delete_equipment", {
      p_internal_code: code,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    revalidatePath("/");
    revalidatePath("/admin");

    return { ok: true, internal_code: code };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "削除に失敗しました",
    };
  }
}
