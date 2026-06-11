"use server";

import type { ModuleSnapshot } from "@/lib/flowchart/moduleDraftRepository";
import { moduleSnapshotSchema } from "@/lib/flowchart/moduleSnapshotSchema";
import { isModuleUuid } from "@/lib/flowchart/moduleUuid";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireEditor, requireViewerOrEditor } from "./flowDocumentsAuth";

export type FlowDocumentResult =
  | { ok: true; snapshot: ModuleSnapshot }
  | { ok: false; error: string };

export type SaveFlowResult = { ok: true } | { ok: false; error: string };

export async function loadFlowDocument(
  moduleUuid: string
): Promise<FlowDocumentResult> {
  if (!isModuleUuid(moduleUuid)) {
    return { ok: false, error: "invalid_module_id" };
  }
  if (isAuthDisabled()) {
    return { ok: false, error: "クラウド未設定" };
  }

  try {
    await requireViewerOrEditor();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("flow_documents")
      .select("payload")
      .eq("module_id", moduleUuid)
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
  moduleUuid: string,
  snapshot: ModuleSnapshot
): Promise<SaveFlowResult> {
  if (!isModuleUuid(moduleUuid)) {
    return { ok: false, error: "invalid_module_id" };
  }
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
        module_id: moduleUuid,
        title,
        payload: parsed.data,
        updated_at: new Date().toISOString(),
        updated_by: ctx.userId,
      },
      { onConflict: "module_id" }
    );

    if (error) {
      return { ok: false, error: error.message };
    }

    // フロー保存のたびに revalidate しない（サンプル読込後の遅延 refresh で UI が巻き戻るのを防ぐ）
    return { ok: true };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
