import type { Edge, Node } from "@xyflow/react";

import type { FlowNodeData } from "./toReactFlow";

export type ModuleSnapshot = {
  jsonText: string;
  committedJson: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
};

export interface ModuleDraftRepository {
  get(storageKey: string): ModuleSnapshot | null;
  set(storageKey: string, snapshot: ModuleSnapshot): void;
}

const STORAGE_PREFIX = "flowchart-web:module-v1:";

export function normalizeModuleSnapshot(raw: unknown): ModuleSnapshot | null {
  if (!raw || typeof raw !== "object") return null;
  const o = raw as Record<string, unknown>;
  if (typeof o.jsonText !== "string") return null;
  if (typeof o.committedJson !== "string") return null;
  if (!Array.isArray(o.nodes) || !Array.isArray(o.edges)) return null;
  return {
    jsonText: o.jsonText,
    committedJson: o.committedJson,
    nodes: o.nodes as Node<FlowNodeData>[],
    edges: o.edges as Edge[],
  };
}

class LocalStorageModuleDraftRepository implements ModuleDraftRepository {
  get(storageKey: string): ModuleSnapshot | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (!raw) return null;
      return normalizeModuleSnapshot(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  set(storageKey: string, snapshot: ModuleSnapshot): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(
        STORAGE_PREFIX + storageKey,
        JSON.stringify(snapshot)
      );
    } catch {
      /* quota exceeded — ignore */
    }
  }
}

/** mock 実装 — 永続化 API 確定後に差し替え可能 */
export const moduleDraftRepository: ModuleDraftRepository =
  new LocalStorageModuleDraftRepository();
