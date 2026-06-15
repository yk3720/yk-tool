"use server";

import { revalidatePath } from "next/cache";

import { canEditFlowchart } from "@/lib/auth/roles";
import { getAuthState } from "@/lib/auth/session";
import { canResetFlowContent } from "@/lib/flowchart/flowResetPermissions";
import { getStarterFlowSnapshot } from "@/lib/flowchart/starterFlowSnapshot";
import { isModuleUuid } from "@/lib/flowchart/moduleUuid";
import { isAuthDisabled } from "@/lib/supabase/env";
import { isPlaywrightActionStubEnabled } from "@/lib/supabase/e2eStub";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type ResetFlowContentResult =
  | { ok: true; moduleId: string }
  | { ok: false; error: string };

function isResetFlowE2eStubEnabled(): boolean {
  return isPlaywrightActionStubEnabled("RESET_FLOW_E2E_STUB");
}

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "ログインが必要です";
  }
  if (message.includes("editor_required")) {
    return "編集権限がありません";
  }
  if (message.includes("reset_flow_forbidden")) {
    return "このフローをリセットする権限がありません";
  }
  if (message.includes("flow_not_found")) {
    return "クラウドに保存されたフローが見つかりません";
  }
  if (message.includes("module_id required")) {
    return "動作が指定されていません";
  }
  if (message.includes("payload required")) {
    return "リセット用データの生成に失敗しました";
  }
  return message;
}

export async function resetFlowContentByModuleId(
  moduleId: string
): Promise<ResetFlowContentResult> {
  const trimmed = moduleId.trim();
  if (!trimmed || !isModuleUuid(trimmed)) {
    return { ok: false, error: "動作が指定されていません" };
  }

  if (isResetFlowE2eStubEnabled()) {
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
    return { ok: false, error: "このフローをリセットする権限がありません" };
  }

  const supabase = await createSupabaseServerClient();
  const { data: row, error: fetchError } = await supabase
    .from("flow_documents")
    .select("module_id, created_by")
    .eq("module_id", trimmed)
    .maybeSingle();

  if (fetchError) {
    return { ok: false, error: fetchError.message };
  }

  if (!row) {
    return { ok: false, error: "クラウドに保存されたフローが見つかりません" };
  }

  if (
    !canResetFlowContent(state.context.role, state.context.userId, {
      hasFlow: true,
      createdBy: row.created_by ?? undefined,
    })
  ) {
    return { ok: false, error: "このフローをリセットする権限がありません" };
  }

  const starter = getStarterFlowSnapshot();

  try {
    const { error } = await supabase.rpc("rpc_reset_flow_content", {
      p_module_id: trimmed,
      p_payload: starter,
      p_title: "雛形: はじめから",
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    revalidatePath("/", "layout");

    return { ok: true, moduleId: trimmed };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "リセットに失敗しました",
    };
  }
}
