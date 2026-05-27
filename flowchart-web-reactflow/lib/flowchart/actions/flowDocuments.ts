"use server";

import { revalidatePath } from "next/cache";

import { getAuthState } from "@/lib/auth/session";
import type { ModuleSnapshot } from "@/lib/flowchart/moduleDraftRepository";
import { moduleSnapshotSchema } from "@/lib/flowchart/moduleSnapshotSchema";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type FlowDocumentResult =
  | { ok: true; snapshot: ModuleSnapshot }
  | { ok: false; error: string };

export type SaveFlowResult = { ok: true } | { ok: false; error: string };

async function requireEditor() {
  const state = await getAuthState();
  if (state.kind === "disabled") return state.context;
  if (state.kind !== "allowed") {
    throw new Error("認証が必要です");
  }
  if (state.context.role !== "editor") {
    throw new Error("編集権限がありません");
  }
  return state.context;
}

async function requireViewerOrEditor() {
  const state = await getAuthState();
  if (state.kind === "disabled") return state.context;
  if (state.kind !== "allowed") {
    throw new Error("認証が必要です");
  }
  return state.context;
}

export async function loadFlowDocument(
  moduleId: string,
): Promise<FlowDocumentResult> {
  if (isAuthDisabled()) {
    return { ok: false, error: "クラウド未設定" };
  }

  try {
    await requireViewerOrEditor();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("flow_documents")
      .select("payload")
      .eq("module_id", moduleId)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.payload) {
      return { ok: false, error: "not_found" };
    }

    const parsed = moduleSnapshotSchema.safeParse(data.payload);
    if (!parsed.success) {
      return { ok: false, error: "保存データの形式が不正です" };
    }

    return { ok: true, snapshot: parsed.data as ModuleSnapshot };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export async function saveFlowDocument(
  moduleId: string,
  snapshot: ModuleSnapshot,
): Promise<SaveFlowResult> {
  if (isAuthDisabled()) {
    return { ok: false, error: "クラウド未設定" };
  }

  try {
    const ctx = await requireEditor();
    const parsed = moduleSnapshotSchema.safeParse(snapshot);
    if (!parsed.success) {
      return { ok: false, error: "送信データの形式が不正です" };
    }

    let title = "無題";
    try {
      const doc = JSON.parse(parsed.data.jsonText) as { title?: string };
      if (doc.title) title = doc.title;
    } catch {
      /* ignore */
    }

    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.from("flow_documents").upsert(
      {
        module_id: moduleId,
        title,
        payload: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      },
      { onConflict: "module_id" },
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    revalidatePath("/");
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
