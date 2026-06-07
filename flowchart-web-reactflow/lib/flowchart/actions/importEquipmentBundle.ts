"use server";

import { revalidatePath } from "next/cache";

import {
  parseImportBundleJson,
} from "@/lib/flowchart/importBundleSchema";
import { prepareImportBundleForRpc } from "@/lib/flowchart/prepareImportBundle";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireEditor } from "./flowDocumentsAuth";

export type ImportEquipmentResult =
  | {
      ok: true;
      internal_code: string;
      modules_upserted: number;
      flows_upserted: number;
    }
  | { ok: false; error: string };

function mapRpcError(message: string): string {
  if (message.includes("not_authenticated")) {
    return "ログインが必要です";
  }
  if (message.includes("editor_required")) {
    return "編集権限がありません";
  }
  if (message.includes("module not found")) {
    return `構成とフローの整合性エラー: ${message}`;
  }
  return message;
}

export async function importEquipmentBundle(
  jsonText: string,
): Promise<ImportEquipmentResult> {
  if (isAuthDisabled()) {
    return { ok: false, error: "クラウド未設定（AUTH_DISABLED）" };
  }

  const parsed = parseImportBundleJson(jsonText);
  if (!parsed.ok) {
    return { ok: false, error: parsed.error };
  }

  const prepared = prepareImportBundleForRpc(parsed.bundle);
  if (!prepared.ok) {
    return { ok: false, error: prepared.errors.join("\n") };
  }

  try {
    await requireEditor();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase.rpc("import_equipment_bundle", {
      p_bundle: prepared.bundle,
    });

    if (error) {
      return { ok: false, error: mapRpcError(error.message) };
    }

    const row = data as {
      ok?: boolean;
      internal_code?: string;
      modules_upserted?: number;
      flows_upserted?: number;
    };

    revalidatePath("/");

    return {
      ok: true,
      internal_code: row.internal_code ?? prepared.bundle.internal_code,
      modules_upserted: row.modules_upserted ?? 0,
      flows_upserted: row.flows_upserted ?? 0,
    };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
