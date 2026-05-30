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
  DEMO_DEVICES,
  findDevice,
  findModule,
  moduleDraftKey,
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

function expandedUnitsForDevice(deviceId: string): Set<string> {
  const device = findDevice(DEMO_DEVICES, deviceId);
  return new Set(device?.units.map((u) => u.id) ?? []);
}

export function FlowchartWorkspace({ role, email, authDisabled }: Props) {
  const editorRef = useRef<FlowchartEditorHandle>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    DEMO_DEVICES[0]?.id ?? "",
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(() =>
    expandedUnitsForDevice(DEMO_DEVICES[0]?.id ?? ""),
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

  const device =
    findDevice(DEMO_DEVICES, selectedDeviceId) ?? DEMO_DEVICES[0];

  const persistCurrentModule = useCallback(() => {
    if (!selectedModuleId || !editorRef.current || !device) return;
    const snapshot = editorRef.current.getSnapshot();
    void persistModuleDraft(selectedDeviceId, selectedModuleId, snapshot, {
      saveToCloud: isEditor,
    });
  }, [selectedModuleId, selectedDeviceId, device, isEditor]);

  const handleToggleUnit = useCallback((unitId: string) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }, []);

  const loadModule = useCallback(
    async (deviceId: string, moduleId: string) => {
      setLoadingModule(true);
      try {
        const result = await loadModuleDraft(deviceId, moduleId);
        setInitialSnapshot(result.snapshot);
        setLoadSource(result.source);
        setOfflineCachedAt(result.offlineCachedAt ?? null);
        const storageKey = moduleDraftKey(deviceId, moduleId);
        const cache = await getOfflineModuleCache(storageKey);
        setPinned(cache?.pinned ?? false);
        setLoadKey((k) => k + 1);
      } finally {
        setLoadingModule(false);
      }
    },
    [],
  );

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      persistCurrentModule();
      setSelectedModuleId(moduleId);
      const found = findModule(device, moduleId);
      if (found) {
        setExpandedUnitIds((prev) => new Set(prev).add(found.unit.id));
      }
      void loadModule(selectedDeviceId, moduleId);
    },
    [persistCurrentModule, loadModule, device, selectedDeviceId],
  );

  const handleSelectDevice = useCallback(
    (deviceId: string) => {
      if (deviceId === selectedDeviceId) return;
      persistCurrentModule();
      setSelectedDeviceId(deviceId);
      setSelectedModuleId(null);
      setInitialSnapshot(null);
      setLoadSource("");
      setOfflineCachedAt(null);
      setPinned(false);
      setExpandedUnitIds(expandedUnitsForDevice(deviceId));
      setLoadKey((k) => k + 1);
    },
    [persistCurrentModule, selectedDeviceId],
  );

  const handleTogglePin = useCallback(async () => {
    if (!selectedModuleId) return;
    const storageKey = moduleDraftKey(selectedDeviceId, selectedModuleId);
    const next = !pinned;
    await setOfflineModulePinned(storageKey, next);
    setPinned(next);
    if (editorRef.current) {
      await putOfflineFromEditor(storageKey, editorRef, next);
    }
  }, [selectedModuleId, selectedDeviceId, pinned]);

  const moduleInfo = selectedModuleId
    ? findModule(device, selectedModuleId)
    : null;

  const contextLabel = moduleInfo
    ? `${moduleInfo.unit.label} · ${moduleInfo.module.label}`
    : undefined;

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
          devices={DEMO_DEVICES}
          selectedDeviceId={selectedDeviceId}
          device={device}
          selectedModuleId={selectedModuleId}
          expandedUnitIds={expandedUnitIds}
          collapsed={navCollapsed}
          onToggleCollapsed={() => setNavCollapsed((v) => !v)}
          onSelectDevice={handleSelectDevice}
          onToggleUnit={handleToggleUnit}
          onSelectModule={handleSelectModule}
        />
        <FlowchartEditor
          key={
            selectedModuleId
              ? `${selectedDeviceId}:${selectedModuleId}-${loadKey}`
              : `${selectedDeviceId}:__none__`
          }
          ref={editorRef}
          contextLabel={contextLabel}
          moduleId={selectedModuleId}
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
  storageKey: string,
  editorRef: React.RefObject<FlowchartEditorHandle | null>,
  pinned: boolean,
) {
  if (!editorRef.current) return;
  const { putOfflineModuleCache } = await import(
    "@/lib/flowchart/offlineFlowCache"
  );
  await putOfflineModuleCache(storageKey, editorRef.current.getSnapshot(), {
    pinned,
  });
}
