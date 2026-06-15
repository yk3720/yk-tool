"use server";

import { revalidatePath } from "next/cache";

import { canEditFlowchart } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/session";
import { canDeleteModule } from "@/lib/flowchart/moduleDeletePermissions";
import { isAuthDisabled } from "@/lib/supabase/env";
import { isPlaywrightActionStubEnabled } from "@/lib/supabase/e2eStub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DeleteModuleResult =
  | { ok: true; moduleId: string }
  | { ok: false; error: string };

function isModuleDeleteE2eStubEnabled(): boolean {
  return isPlaywrightActionStubEnabled("MODULE_DELETE_E2E_STUB");
}

type ModuleRow = {
  id: string;
  label: string;
  units: {
    id: string;
    label: string;
    created_by: string | null;
    devices: {
      id: string;
      created_by: string | null;
    };
  };
};

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "ログインが必要です";
  }
  if (message.includes("editor_required")) {
    return "編集権限がありません";
  }
  if (message.includes("delete_module_forbidden")) {
    return "この動作を削除する権限がありません";
  }
  if (message.includes("module_not_found")) {
    return "動作が見つかりません";
  }
  if (message.includes("module_id required")) {
    return "動作が指定されていません";
  }
  return message;
}

export async function deleteModuleById(
  moduleId: string
): Promise<DeleteModuleResult> {
  const trimmed = moduleId.trim();
  if (!trimmed) {
    return { ok: false, error: "動作が指定されていません" };
  }

  if (isModuleDeleteE2eStubEnabled()) {
    return { ok: true, moduleId: trimmed };
  }

  if (isAuthDisabled()) {
    return { ok: false, error: "クラウド未設定（AUTH_DISABLED）" };
  }

  const state = await getAuthState();
  if (state.kind !== "allowed") {
    return { ok: false, error: "ログインが必要です" };
  }

  if (!canEditFlowchart(state.context.role)) {
    return { ok: false, error: "この動作を削除する権限がありません" };
  }

  const supabase = await createSupabaseServerClient();
  const { data, error: fetchError } = await supabase
    .from("modules")
    .select(
      `
      id,
      label,
      units!inner (
        id,
        label,
        created_by,
        devices!inner (
          id,
          created_by
        )
      )
    `
    )
    .eq("id", trimmed)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  const row = data as ModuleRow | null;
  if (!row) {
    return { ok: false, error: "動作が見つかりません" };
  }

  const targetDevice = {
    id: row.units.devices.id,
    createdBy: row.units.devices.created_by ?? undefined,
  };
  const targetUnit = {
    id: row.units.id,
    label: row.units.label,
    createdBy: row.units.created_by ?? undefined,
  };

  if (
    !canDeleteModule(
      state.context.role,
      state.context.userId,
      targetDevice,
      targetUnit
    )
  ) {
    return { ok: false, error: "この動作を削除する権限がありません" };
  }

  try {
    const { error } = await supabase.rpc("rpc_delete_module", {
      p_module_id: trimmed,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    revalidatePath("/", "layout");

    return { ok: true, moduleId: trimmed };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "削除に失敗しました",
    };
  }
}
