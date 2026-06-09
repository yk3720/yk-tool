"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { AppAuthBar } from "@/components/auth/AppAuthBar";
import type { ProfileRole } from "@/lib/auth/types";
import { importEquipmentBundle } from "@/lib/flowchart/actions/importEquipmentBundle";
import {
  loadModuleDraft,
  persistModuleDraft,
} from "@/lib/flowchart/moduleDraftLoader";
import type { ModuleSnapshot } from "@/lib/flowchart/moduleDraftRepository";
import type { Device } from "@/lib/flowchart/moduleHierarchy";
import {
  findDevice,
  findModule,
  moduleStorageKey,
} from "@/lib/flowchart/moduleHierarchy";
import {
  getOfflineModuleCache,
  setOfflineModulePinned,
} from "@/lib/flowchart/offlineFlowCache";

import { FlowchartEditor, type FlowchartEditorHandle } from "./FlowchartEditor";
import { ModuleNavPane } from "./ModuleNavPane";

type Props = {
  role: ProfileRole;
  email: string;
  authDisabled?: boolean;
  devices: readonly Device[];
};

function expandedUnitsForDevice(
  devices: readonly Device[],
  deviceId: string
): Set<string> {
  const device = findDevice(devices, deviceId);
  return new Set(device?.units.map((u) => u.id) ?? []);
}

export function FlowchartWorkspace({
  role,
  email,
  authDisabled,
  devices,
}: Props) {
  const router = useRouter();
  const editorRef = useRef<FlowchartEditorHandle>(null);
  const [selectedDeviceId, setSelectedDeviceId] = useState(
    devices[0]?.id ?? ""
  );
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(() =>
    expandedUnitsForDevice(devices, devices[0]?.id ?? "")
  );
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [initialSnapshot, setInitialSnapshot] = useState<ModuleSnapshot | null>(
    null
  );
  const [loadSource, setLoadSource] = useState<string>("");
  const [offlineCachedAt, setOfflineCachedAt] = useState<string | null>(null);
  const [loadingModule, setLoadingModule] = useState(false);
  const [loadKey, setLoadKey] = useState(0);
  const [pinned, setPinned] = useState(false);
  const [importBanner, setImportBanner] = useState("");
  const [selectDeviceAfterImport, setSelectDeviceAfterImport] = useState<
    string | null
  >(null);

  const isEditor = role === "editor";
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const device = findDevice(devices, selectedDeviceId) ?? devices[0];

  const moduleInfo =
    selectedModuleId && device ? findModule(device, selectedModuleId) : null;

  const persistCurrentModule = useCallback(() => {
    if (!moduleInfo || !editorRef.current || !device) return;
    const snapshot = editorRef.current.getSnapshot();
    void persistModuleDraft(moduleInfo.module, device, snapshot, {
      saveToCloud: isEditor,
    });
  }, [moduleInfo, device, isEditor]);

  const handleToggleUnit = useCallback((unitId: string) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }, []);

  const loadModule = useCallback(
    async (targetDevice: Device, moduleId: string) => {
      const found = findModule(targetDevice, moduleId);
      if (!found) return;

      setLoadingModule(true);
      try {
        const result = await loadModuleDraft(found.module, targetDevice);
        setInitialSnapshot(result.snapshot);
        setLoadSource(result.source);
        setOfflineCachedAt(result.offlineCachedAt ?? null);
        const storageKey = moduleStorageKey(found.module.id);
        const cache = await getOfflineModuleCache(storageKey);
        setPinned(cache?.pinned ?? false);
        setLoadKey((k) => k + 1);
      } finally {
        setLoadingModule(false);
      }
    },
    []
  );

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      persistCurrentModule();
      setSelectedModuleId(moduleId);
      const found = device ? findModule(device, moduleId) : null;
      if (found) {
        setExpandedUnitIds((prev) => new Set(prev).add(found.unit.id));
      }
      if (device) {
        void loadModule(device, moduleId);
      }
    },
    [persistCurrentModule, loadModule, device]
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
      setExpandedUnitIds(expandedUnitsForDevice(devices, deviceId));
      setLoadKey((k) => k + 1);
    },
    [persistCurrentModule, selectedDeviceId, devices]
  );

  useEffect(() => {
    if (!selectDeviceAfterImport) return;
    const imported = devices.find(
      (d) => d.internalCode === selectDeviceAfterImport
    );
    if (imported) {
      // 取込後に devices が更新されてから選択する（import ハンドラと非同期に連携）
      // eslint-disable-next-line react-hooks/set-state-in-effect -- devices 反映待ちの意図的パターン
      handleSelectDevice(imported.id);
      setSelectDeviceAfterImport(null);
    }
  }, [devices, selectDeviceAfterImport, handleSelectDevice]);

  const handleImportBundleFile = useCallback(
    async (file: File) => {
      setImportBanner("import.json を取込中…");
      try {
        const text = await file.text();
        const result = await importEquipmentBundle(text);
        if (!result.ok) {
          setImportBanner(`取込失敗: ${result.error}`);
          return;
        }
        setImportBanner(
          `取込完了: ${result.internal_code}（フロー ${result.flows_upserted} 件）`
        );
        setSelectDeviceAfterImport(result.internal_code);
        router.refresh();
      } catch (e) {
        setImportBanner(
          `取込失敗: ${e instanceof Error ? e.message : String(e)}`
        );
      }
    },
    [router]
  );

  const handleTogglePin = useCallback(async () => {
    if (!moduleInfo) return;
    const storageKey = moduleStorageKey(moduleInfo.module.id);
    const next = !pinned;
    await setOfflineModulePinned(storageKey, next);
    setPinned(next);
    if (editorRef.current) {
      await putOfflineFromEditor(storageKey, editorRef, next);
    }
  }, [moduleInfo, pinned]);

  const contextLabel = moduleInfo
    ? `${moduleInfo.unit.label} · ${moduleInfo.module.label}`
    : undefined;

  let statusBanner = importBanner;
  if (!statusBanner && loadingModule) {
    statusBanner = "モジュールを読み込み中…";
  } else if (!statusBanner && isOffline) {
    statusBanner = offlineCachedAt
      ? `オフライン — ${formatCachedAt(offlineCachedAt)} 時点のコピー`
      : "オフライン — キャッシュがありません";
  } else if (!statusBanner && loadSource === "offline") {
    statusBanner = offlineCachedAt
      ? `オフライン用キャッシュ（${formatCachedAt(offlineCachedAt)}）`
      : "オフライン用キャッシュ";
  } else if (!statusBanner && loadSource === "cloud") {
    statusBanner = "クラウドから読み込み";
  }

  if (!device) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white text-slate-700">
        装置データがありません
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
      <AppAuthBar email={email} role={role} showDevBanner={authDisabled} />
      {statusBanner ? (
        <p className="border-b border-amber-100 bg-amber-50 px-3 py-1.5 text-xs text-amber-900">
          {statusBanner}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ModuleNavPane
          devices={devices}
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
              ? `${selectedModuleId}-${loadKey}`
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
          importBundle={
            isEditor
              ? {
                  disabled: Boolean(authDisabled),
                  disabledTitle: authDisabled
                    ? "クラウド未設定のため取込できません"
                    : undefined,
                  onSelectFile: (file) => void handleImportBundleFile(file),
                }
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
  pinned: boolean
) {
  if (!editorRef.current) return;
  const { putOfflineModuleCache } =
    await import("@/lib/flowchart/offlineFlowCache");
  await putOfflineModuleCache(storageKey, editorRef.current.getSnapshot(), {
    pinned,
  });
}
