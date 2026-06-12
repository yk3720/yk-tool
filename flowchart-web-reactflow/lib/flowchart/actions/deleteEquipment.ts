"use server";

import { revalidatePath } from "next/cache";

import { canEditFlowchart } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/session";
import { canDeleteDevice } from "@/lib/flowchart/deviceDeletePermissions";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteEquipmentResult =
  | { ok: true; internal_code: string }
  | { ok: false; error: string };

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "ログインが必要です";
  }
  if (message.includes("editor_required")) {
    return "編集権限がありません";
  }
  if (message.includes("delete_equipment_forbidden")) {
    return "この装置を削除する権限がありません";
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

  const state = await getAuthState();
  if (state.kind !== "allowed") {
    return { ok: false, error: "ログインが必要です" };
  }

  if (!canEditFlowchart(state.context.role)) {
    return { ok: false, error: "この装置を削除する権限がありません" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchError } = await supabase
    .from("devices")
    .select("internal_code, created_by")
    .eq("internal_code", code)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!row) {
    return { ok: false, error: "社内番号に該当する装置が見つかりません" };
  }

  if (
    !canDeleteDevice(state.context.role, state.context.userId, {
      createdBy: row.created_by ?? undefined,
    })
  ) {
    return { ok: false, error: "この装置を削除する権限がありません" };
  }

  try {
    const { error } = await supabase.rpc("rpc_delete_equipment", {
      p_internal_code: code,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    revalidatePath("/", "layout");
    revalidatePath("/admin");

    return { ok: true, internal_code: code };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "削除に失敗しました",
    };
  }
}
