"use client";

import { loadFlowDocument } from "@/lib/flowchart/actions/flowDocuments";
import {
  resolveModuleDraftKey,
  moduleDraftKey,
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

async function loadFromCloud(
  storageKeys: string[],
  primaryKey: string,
): Promise<ModuleLoadResult | null> {
  if (isAuthDisabled() || typeof navigator === "undefined" || !navigator.onLine) {
    return null;
  }

  for (const key of storageKeys) {
    const cloud = await loadFlowDocument(key);
    if (cloud.ok) {
      await putOfflineModuleCache(primaryKey, cloud.snapshot);
      return { snapshot: cloud.snapshot, source: "cloud" };
    }
    if (cloud.error !== "not_found") {
      const offline = await getOfflineModuleCache(primaryKey);
      if (offline) {
        return {
          snapshot: offline.snapshot,
          source: "offline",
          offlineCachedAt: offline.cachedAt,
        };
      }
    }
  }
  return null;
}

export async function loadModuleDraft(
  deviceId: string,
  moduleId: string,
): Promise<ModuleLoadResult> {
  const storageKeys = resolveModuleDraftKey(deviceId, moduleId);
  const primaryKey = moduleDraftKey(deviceId, moduleId);

  const fromCloud = await loadFromCloud(storageKeys, primaryKey);
  if (fromCloud) return fromCloud;

  for (const key of storageKeys) {
    const offline = await getOfflineModuleCache(key);
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

export async function persistModuleDraft(
  deviceId: string,
  moduleId: string,
  snapshot: ModuleSnapshot,
  options: { saveToCloud: boolean },
): Promise<void> {
  const primaryKey = moduleDraftKey(deviceId, moduleId);
  moduleDraftRepository.set(primaryKey, snapshot);
  await putOfflineModuleCache(primaryKey, snapshot);

  if (options.saveToCloud && !isAuthDisabled() && navigator.onLine) {
    const { saveFlowDocument } = await import(
      "@/lib/flowchart/actions/flowDocuments"
    );
    await saveFlowDocument(primaryKey, snapshot);
  }
}
