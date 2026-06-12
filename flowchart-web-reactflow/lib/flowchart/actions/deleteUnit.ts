"use server";

import { revalidatePath } from "next/cache";

import { canEditFlowchart } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/session";
import { canDeleteUnit } from "@/lib/flowchart/unitDeletePermissions";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteUnitResult =
  | { ok: true; unitId: string }
  | { ok: false; error: string };

type UnitRow = {
  id: string;
  label: string;
  created_by: string | null;
  devices: {
    id: string;
    created_by: string | null;
  };
};

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "ログインが必要です";
  }
  if (message.includes("editor_required")) {
    return "編集権限がありません";
  }
  if (message.includes("delete_unit_forbidden")) {
    return "このユニットを削除する権限がありません";
  }
  if (message.includes("unit_not_found")) {
    return "ユニットが見つかりません";
  }
  if (message.includes("unit_id required")) {
    return "ユニットが指定されていません";
  }
  return message;
}

export async function deleteUnitById(
  unitId: string
): Promise<DeleteUnitResult> {
  const trimmed = unitId.trim();
  if (!trimmed) {
    return { ok: false, error: "ユニットが指定されていません" };
  }

  if (isAuthDisabled()) {
    return { ok: false, error: "クラウド未設定（AUTH_DISABLED）" };
  }

  const state = await getAuthState();
  if (state.kind !== "allowed") {
    return { ok: false, error: "ログインが必要です" };
  }

  if (!canEditFlowchart(state.context.role)) {
    return { ok: false, error: "このユニットを削除する権限がありません" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: fetchError } = await supabase
    .from("units")
    .select(
      `
      id,
      label,
      created_by,
      devices!inner (
        id,
        created_by
      )
    `
    )
    .eq("id", trimmed)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  const row = data as UnitRow | null;
  if (!row) {
    return { ok: false, error: "ユニットが見つかりません" };
  }

  const targetDevice = {
    id: row.devices.id,
    createdBy: row.devices.created_by ?? undefined,
  };
  const targetUnit = {
    id: row.id,
    label: row.label,
    createdBy: row.created_by ?? undefined,
  };

  if (
    !canDeleteUnit(
      state.context.role,
      state.context.userId,
      targetDevice,
      targetUnit
    )
  ) {
    return { ok: false, error: "このユニットを削除する権限がありません" };
  }

  try {
    const { error } = await supabase.rpc("rpc_delete_unit", {
      p_unit_id: trimmed,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    revalidatePath("/", "layout");

    return { ok: true, unitId: trimmed };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "削除に失敗しました",
    };
  }
}
