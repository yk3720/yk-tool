import type { Edge, Node } from "@xyflow/react";

import type { LayoutPresetId } from "./layoutPresets";
import type { ThemeId } from "./themes";
import type { FlowNodeData } from "./toReactFlow";

export type ModuleSnapshot = {
  jsonText: string;
  committedJson: string;
  nodes: Node<FlowNodeData>[];
  edges: Edge[];
  themeId: ThemeId;
  layoutPreset: LayoutPresetId;
};

export interface ModuleDraftRepository {
  get(moduleId: string): ModuleSnapshot | null;
  set(moduleId: string, snapshot: ModuleSnapshot): void;
}

const STORAGE_PREFIX = "flowchart-web:module-v1:";

class LocalStorageModuleDraftRepository implements ModuleDraftRepository {
  get(moduleId: string): ModuleSnapshot | null {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(STORAGE_PREFIX + moduleId);
      if (!raw) return null;
      return JSON.parse(raw) as ModuleSnapshot;
    } catch {
      return null;
    }
  }

  set(moduleId: string, snapshot: ModuleSnapshot): void {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(STORAGE_PREFIX + moduleId, JSON.stringify(snapshot));
    } catch {
      /* quota exceeded — ignore */
    }
  }
}

/** mock 実装 — 永続化 API 確定後に差し替え可能 */
export const moduleDraftRepository: ModuleDraftRepository =
  new LocalStorageModuleDraftRepository();
