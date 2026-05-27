"use client";

import { loadFlowDocument } from "@/lib/flowchart/actions/flowDocuments";
import {
  getOfflineModuleCache,
  putOfflineModuleCache,
} from "@/lib/flowchart/offlineFlowCache";
import type { ModuleSnapshot } from "@/lib/flowchart/moduleDraftRepository";
import { moduleDraftRepository } from "@/lib/flowchart/moduleDraftRepository";
import { isAuthDisabled } from "@/lib/supabase/env";

export type ModuleLoadSource = "cloud" | "offline" | "local" | "none";

export type ModuleLoadResult = {
  snapshot: ModuleSnapshot | null;
  source: ModuleLoadSource;
  offlineCachedAt?: string;
};

export async function loadModuleDraft(
  moduleId: string,
): Promise<ModuleLoadResult> {
  if (!isAuthDisabled() && typeof navigator !== "undefined" && navigator.onLine) {
    const cloud = await loadFlowDocument(moduleId);
    if (cloud.ok) {
      await putOfflineModuleCache(moduleId, cloud.snapshot);
      return { snapshot: cloud.snapshot, source: "cloud" };
    }
    if (cloud.error !== "not_found") {
      const offline = await getOfflineModuleCache(moduleId);
      if (offline) {
        return {
          snapshot: offline.snapshot,
          source: "offline",
          offlineCachedAt: offline.cachedAt,
        };
      }
    }
  }

  const offline = await getOfflineModuleCache(moduleId);
  if (offline) {
    return {
      snapshot: offline.snapshot,
      source: "offline",
      offlineCachedAt: offline.cachedAt,
    };
  }

  const local = moduleDraftRepository.get(moduleId);
  if (local) {
    return { snapshot: local, source: "local" };
  }

  return { snapshot: null, source: "none" };
}

export async function persistModuleDraft(
  moduleId: string,
  snapshot: ModuleSnapshot,
  options: { saveToCloud: boolean },
): Promise<void> {
  moduleDraftRepository.set(moduleId, snapshot);
  await putOfflineModuleCache(moduleId, snapshot);

  if (options.saveToCloud && !isAuthDisabled() && navigator.onLine) {
    const { saveFlowDocument } = await import(
      "@/lib/flowchart/actions/flowDocuments"
    );
    await saveFlowDocument(moduleId, snapshot);
  }
}
