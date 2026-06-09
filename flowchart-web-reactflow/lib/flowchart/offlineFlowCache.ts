import type { ModuleSnapshot } from "./moduleDraftRepository";

const DB_NAME = "flowchart-web-offline-v1";
const STORE = "modules";
const DB_VERSION = 1;

type CacheEntry = {
  moduleId: string;
  snapshot: ModuleSnapshot;
  cachedAt: string;
  pinned: boolean;
};

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => reject(req.error);
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "moduleId" });
      }
    };
  });
}

export async function putOfflineModuleCache(
  moduleId: string,
  snapshot: ModuleSnapshot,
  options?: { pinned?: boolean }
): Promise<void> {
  if (typeof indexedDB === "undefined") return;
  const db = await openDb();
  const entry: CacheEntry = {
    moduleId,
    snapshot,
    cachedAt: new Date().toISOString(),
    pinned: options?.pinned ?? false,
  };
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.objectStore(STORE).put(entry);
  });
  db.close();
}

export async function getOfflineModuleCache(moduleId: string): Promise<{
  snapshot: ModuleSnapshot;
  cachedAt: string;
  pinned: boolean;
} | null> {
  if (typeof indexedDB === "undefined") return null;
  const db = await openDb();
  const entry = await new Promise<CacheEntry | undefined>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(moduleId);
    req.onsuccess = () => resolve(req.result as CacheEntry | undefined);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!entry) return null;
  return {
    snapshot: entry.snapshot,
    cachedAt: entry.cachedAt,
    pinned: entry.pinned,
  };
}

export async function setOfflineModulePinned(
  moduleId: string,
  pinned: boolean
): Promise<void> {
  const existing = await getOfflineModuleCache(moduleId);
  if (!existing) return;
  await putOfflineModuleCache(moduleId, existing.snapshot, { pinned });
}
