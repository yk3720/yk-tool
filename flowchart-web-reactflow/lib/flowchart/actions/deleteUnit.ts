"use server";

import { revalidatePath } from "next/cache";

import { getAuthState } from "@/lib/auth/session";
import { canDeleteUnit } from "@/lib/flowchart/unitDeletePermissions";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { fetchDeviceHierarchy } from "./deviceHierarchy";

export type DeleteUnitResult =
  | { ok: true; unitId: string }
  | { ok: false; error: string };

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "ログインが必要です";
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

  const hierarchy = await fetchDeviceHierarchy();
  if (!hierarchy.ok) {
    return { ok: false, error: "装置一覧の取得に失敗しました" };
  }

  let targetDevice;
  let targetUnit;
  for (const device of hierarchy.devices) {
    const unit = device.units.find((u) => u.id === trimmed);
    if (unit) {
      targetDevice = device;
      targetUnit = unit;
      break;
    }
  }

  if (!targetDevice || !targetUnit) {
    return { ok: false, error: "ユニットが見つかりません" };
  }

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
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.rpc("rpc_delete_unit", {
      p_unit_id: trimmed,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    revalidatePath("/");

    return { ok: true, unitId: trimmed };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "削除に失敗しました",
    };
  }
}
