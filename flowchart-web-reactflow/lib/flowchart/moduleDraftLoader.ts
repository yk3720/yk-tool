"use client";

import { loadFlowDocument } from "@/lib/flowchart/actions/flowDocuments";
import type { Device, FlowModule } from "@/lib/flowchart/moduleHierarchy";
import {
  moduleStorageKey,
  resolveModuleDraftKeys,
} from "@/lib/flowchart/moduleHierarchy";
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

export type ModuleLoadOptions = {
  /** true のとき結果を適用しない（進行中読込の無効化） */
  isCancelled?: () => boolean;
};

async function loadFromCloud(
  moduleUuid: string,
  primaryKey: string,
  isCancelled?: () => boolean
): Promise<ModuleLoadResult | null> {
  if (
    isAuthDisabled() ||
    typeof navigator === "undefined" ||
    !navigator.onLine
  ) {
    return null;
  }

  const cloud = await loadFlowDocument(moduleUuid);
  if (isCancelled?.()) return null;
  if (cloud.ok) {
    if (!isCancelled?.()) {
      await putOfflineModuleCache(primaryKey, cloud.snapshot);
    }
    return { snapshot: cloud.snapshot, source: "cloud" };
  }
  if (cloud.error !== "not_found" && cloud.error !== "invalid_module_id") {
    const offline = await getOfflineModuleCache(primaryKey);
    if (offline) {
      return {
        snapshot: offline.snapshot,
        source: "offline",
        offlineCachedAt: offline.cachedAt,
      };
    }
  }

  return null;
}

export async function loadModuleDraft(
  module: FlowModule,
  device: Device,
  options?: ModuleLoadOptions
): Promise<ModuleLoadResult> {
  const isCancelled = options?.isCancelled;
  const storageKeys = resolveModuleDraftKeys(module, device);
  const primaryKey = moduleStorageKey(module.id);

  const fromCloud = await loadFromCloud(module.id, primaryKey, isCancelled);
  if (fromCloud) {
    if (isCancelled?.()) {
      return { snapshot: null, source: "none" };
    }
    return fromCloud;
  }

  for (const key of storageKeys) {
    const offline = await getOfflineModuleCache(key);
    if (isCancelled?.()) {
      return { snapshot: null, source: "none" };
    }
    if (offline) {
      if (key !== primaryKey) {
        await putOfflineModuleCache(primaryKey, offline.snapshot, {
          pinned: offline.pinned,
        });
      }
      return {
        snapshot: offline.snapshot,
        source: "offline",
        offlineCachedAt: offline.cachedAt,
      };
    }
  }

  for (const key of storageKeys) {
    if (isCancelled?.()) {
      return { snapshot: null, source: "none" };
    }
    const local = moduleDraftRepository.get(key);
    if (local) {
      if (key !== primaryKey) {
        moduleDraftRepository.set(primaryKey, local);
      }
      return { snapshot: local, source: "local" };
    }
  }

  return { snapshot: null, source: "none" };
}

export type PersistModuleDraftResult = {
  cloudSaved: boolean;
  cloudError?: string;
};

export async function persistModuleDraft(
  module: FlowModule,
  _device: Device,
  snapshot: ModuleSnapshot,
  options: { saveToCloud: boolean }
): Promise<PersistModuleDraftResult> {
  const primaryKey = moduleStorageKey(module.id);
  moduleDraftRepository.set(primaryKey, snapshot);
  await putOfflineModuleCache(primaryKey, snapshot);

  if (options.saveToCloud && !isAuthDisabled() && navigator.onLine) {
    const { saveFlowDocument } =
      await import("@/lib/flowchart/actions/flowDocuments");
    const result = await saveFlowDocument(module.id, snapshot);
    if (!result.ok) {
      return { cloudSaved: false, cloudError: result.error };
    }
    return { cloudSaved: true };
  }

  return { cloudSaved: false };
}
