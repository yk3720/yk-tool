"use client";

import { useCallback, useRef, useState } from "react";

import { AppAuthBar } from "@/components/auth/AppAuthBar";
import type { ProfileRole } from "@/lib/auth/types";
import {
  loadModuleDraft,
  persistModuleDraft,
} from "@/lib/flowchart/moduleDraftLoader";
import type { ModuleSnapshot } from "@/lib/flowchart/moduleDraftRepository";
import {
  DEMO_DEVICE,
  findModule,
} from "@/lib/flowchart/moduleHierarchy";
import {
  getOfflineModuleCache,
  setOfflineModulePinned,
} from "@/lib/flowchart/offlineFlowCache";

import {
  FlowchartEditor,
  type FlowchartEditorHandle,
} from "./FlowchartEditor";
import { ModuleNavPane } from "./ModuleNavPane";

type Props = {
  role: ProfileRole;
  email: string;
  authDisabled?: boolean;
};

export function FlowchartWorkspace({ role, email, authDisabled }: Props) {
  const editorRef = useRef<FlowchartEditorHandle>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(
    () => new Set(DEMO_DEVICE.units.map((u) => u.id)),
  );
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] =
    useState<ModuleSnapshot | null>(null);
  const [loadSource, setLoadSource] = useState<string>("");
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(null);
  const [loadingModule, setLoadingModule] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [pinned, setPinned] = useState(false);

  const isEditor = role === "editor";
  const isOffline =
    typeof navigator !== "undefined" && !navigator.onLine;

  const persistCurrentModule = useCallback(() => {
    if (!selectedModuleId || !editorRef.current) return;
    const snapshot = editorRef.current.getSnapshot();
    void persistModuleDraft(selectedModuleId, snapshot, {
      saveToCloud: isEditor,
    });
  }, [selectedModuleId, isEditor]);

  const handleToggleUnit = useCallback((unitId: string) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }, []);

  const loadModule = useCallback(async (moduleId: string) => {
    setLoadingModule(true);
    try {
      const result = await loadModuleDraft(moduleId);
      setInitialSnapshot(result.snapshot);
      setLoadSource(result.source);
      setOfflineCachedAt(result.offlineCachedAt ?? null);
      const cache = await getOfflineModuleCache(moduleId);
      setPinned(cache?.pinned ?? false);
      setLoadKey((k) => k + 1);
    } finally {
      setLoadingModule(false);
    }
  }, []);

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      persistCurrentModule();
      setSelectedModuleId(moduleId);
      const found = findModule(DEMO_DEVICE, moduleId);
      if (found) {
        setExpandedUnitIds((prev) => new Set(prev).add(found.unit.id));
      }
      void loadModule(moduleId);
    },
    [persistCurrentModule, loadModule],
  );

  const handleTogglePin = useCallback(async () => {
    if (!selectedModuleId) return;
    const next = !pinned;
    await setOfflineModulePinned(selectedModuleId, next);
    setPinned(next);
    if (editorRef.current) {
      await putOfflineFromEditor(selectedModuleId, editorRef, next);
    }
  }, [selectedModuleId, pinned]);

  const moduleInfo = selectedModuleId
    ? findModule(DEMO_DEVICE, selectedModuleId)
    : null;

  let statusBanner = "";
  if (loadingModule) {
    statusBanner = "モジュールを読み込み中…";
  } else if (isOffline) {
    statusBanner = offlineCachedAt
      ? `オフライン — ${formatCachedAt(offlineCachedAt)} 時点のコピー`
      : "オフライン — キャッシュがありません";
  } else if (loadSource === "offline") {
    statusBanner = offlineCachedAt
      ? `オフライン用キャッシュ（${formatCachedAt(offlineCachedAt)}）`
      : "オフライン用キャッシュ";
  } else if (loadSource === "cloud") {
    statusBanner = "クラウドから読み込み";
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <AppAuthBar
        email={email}
        role={role}
        showDevBanner={authDisabled}
      />
      {statusBanner ? (
        <p className="border-b border-amber-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
          {statusBanner}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ModuleNavPane
          device={DEMO_DEVICE}
          selectedModuleId={selectedModuleId}
          expandedUnitIds={expandedUnitIds}
          collapsed={navCollapsed}
          onToggleCollapsed={() => setNavCollapsed((v) => !v)}
          onToggleUnit={handleToggleUnit}
          onSelectModule={handleSelectModule}
        />
        <FlowchartEditor
          key={
            selectedModuleId
              ? `${selectedModuleId}-${loadKey}`
              : "__none__"
          }
          ref={editorRef}
          deviceName={DEMO_DEVICE.name}
          moduleId={selectedModuleId}
          moduleLabel={moduleInfo?.module.label}
          initialSnapshot={initialSnapshot}
          workspaceMode
          readOnly={!isEditor}
          onSnapshotPersist={persistCurrentModule}
          pinOffline={
            selectedModuleId
              ? { pinned, onToggle: () => void handleTogglePin() }
              : undefined
          }
        />
      </div>
    </div>
  );
}

function formatCachedAt(iso: string): string {
  try {
    return new Date(iso).toLocaleString("ja-JP");
  } catch {
    return iso;
  }
}

async function putOfflineFromEditor(
  moduleId: string,
  editorRef: React.RefObject<FlowchartEditorHandle | null>,
  pinned: boolean,
) {
  if (!editorRef.current) return;
  const { putOfflineModuleCache } = await import(
    "@/lib/flowchart/offlineFlowCache"
  );
  await putOfflineModuleCache(moduleId, editorRef.current.getSnapshot(), {
    pinned,
  });
}
