"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { AppAuthBar } from "@/components/auth/AppAuthBar";
import { canEditFlowchart } from "@/lib/auth/roles";

import type { ProfileRole } from "@/lib/auth/types";
import { deleteEquipmentByInternalCode } from "@/lib/flowchart/actions/deleteEquipment";
import { deleteUnitById } from "@/lib/flowchart/actions/deleteUnit";
import { resetFlowContentByModuleId } from "@/lib/flowchart/actions/resetFlowContent";
import { importEquipmentBundle } from "@/lib/flowchart/actions/importEquipmentBundle";
import {
  statusBannerClassName,
  statusBannerTone,
} from "@/lib/flowchart/statusBanner";
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
import { getStarterFlowSnapshot } from "@/lib/flowchart/starterFlowSnapshot";

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
  /** モジュール読込の世代 — 古い loadModule 完了を無視する */
  const loadGenerationRef = useRef(0);
  /** ユーザーがサンプル等で上書きしたら true — 遅延 loadModule の適用を拒否 */
  const userContentOverrideRef = useRef(false);
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
  const [cloudSaveBanner, setCloudSaveBanner] = useState("");
  const [selectDeviceAfterImport, setSelectDeviceAfterImport] = useState<
    string | null
  >(null);
  const [unitDeleteTargetId, setUnitDeleteTargetId] = useState<string | null>(
    null
  );
  const [unitDeletePending, setUnitDeletePending] = useState(false);
  const unitDeleteInFlightRef = useRef(false);
  const [deviceDeleteConfirmOpen, setDeviceDeleteConfirmOpen] = useState(false);
  const [deviceDeletePending, setDeviceDeletePending] = useState(false);
  const deviceDeleteInFlightRef = useRef(false);
  const [flowResetConfirmOpen, setFlowResetConfirmOpen] = useState(false);
  const [flowResetPending, setFlowResetPending] = useState(false);
  const flowResetInFlightRef = useRef(false);

  const isEditor = canEditFlowchart(role);
  const isOffline = typeof navigator !== "undefined" && !navigator.onLine;

  const activeDeviceId = useMemo(() => {
    if (devices.some((d) => d.id === selectedDeviceId)) {
      return selectedDeviceId;
    }
    return devices[0]?.id ?? "";
  }, [devices, selectedDeviceId]);

  const device = findDevice(devices, activeDeviceId) ?? devices[0];

  const moduleInfo =
    selectedModuleId && device ? findModule(device, selectedModuleId) : null;

  const persistCurrentModule = useCallback(() => {
    if (!moduleInfo || !editorRef.current || !device) return;
    const snapshot = editorRef.current.getSnapshot();
    void persistModuleDraft(moduleInfo.module, device, snapshot, {
      saveToCloud: isEditor,
    }).then((result) => {
      if (result.cloudError) {
        setCloudSaveBanner(`クラウド保存に失敗: ${result.cloudError}`);
      }
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

  const isModuleLoadStale = useCallback((generation: number) => {
    return generation !== loadGenerationRef.current;
  }, []);

  const invalidatePendingModuleLoad = useCallback(() => {
    userContentOverrideRef.current = true;
    loadGenerationRef.current += 1;
    setLoadingModule(false);
    setInitialSnapshot(null);
  }, []);

  const loadModule = useCallback(
    async (targetDevice: Device, moduleId: string) => {
      const found = findModule(targetDevice, moduleId);
      if (!found) return;

      const generation = ++loadGenerationRef.current;
      setLoadingModule(true);
      try {
        const result = await loadModuleDraft(found.module, targetDevice, {
          isCancelled: () => isModuleLoadStale(generation),
        });
        if (isModuleLoadStale(generation) || userContentOverrideRef.current) {
          return;
        }

        const storageKey = moduleStorageKey(found.module.id);
        const cache = await getOfflineModuleCache(storageKey);
        if (isModuleLoadStale(generation) || userContentOverrideRef.current) {
          return;
        }

        setInitialSnapshot(result.snapshot);
        setLoadSource(result.source);
        setOfflineCachedAt(result.offlineCachedAt ?? null);
        setPinned(cache?.pinned ?? false);
        setLoadKey((k) => k + 1);
      } finally {
        if (!isModuleLoadStale(generation)) {
          setLoadingModule(false);
        }
      }
    },
    [isModuleLoadStale]
  );

  const resetModuleLoadState = useCallback(() => {
    userContentOverrideRef.current = false;
    loadGenerationRef.current += 1;
    setInitialSnapshot(null);
    setLoadSource("");
    setOfflineCachedAt(null);
    setPinned(false);
    setLoadKey((k) => k + 1);
  }, []);

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      persistCurrentModule();
      resetModuleLoadState();
      setSelectedModuleId(moduleId);
      const found = device ? findModule(device, moduleId) : null;
      if (found) {
        setExpandedUnitIds((prev) => new Set(prev).add(found.unit.id));
      }
      if (device) {
        void loadModule(device, moduleId);
      }
    },
    [persistCurrentModule, resetModuleLoadState, loadModule, device]
  );

  const handleSelectDevice = useCallback(
    (deviceId: string) => {
      if (deviceId === selectedDeviceId) return;
      persistCurrentModule();
      userContentOverrideRef.current = false;
      loadGenerationRef.current += 1;
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

  const unitDeleteTarget = unitDeleteTargetId
    ? (device?.units.find((u) => u.id === unitDeleteTargetId) ?? null)
    : null;

  useEffect(() => {
    if (!importBanner) return;
    if (statusBannerTone(importBanner) !== "success") return;
    const timer = window.setTimeout(() => setImportBanner(""), 5000);
    return () => window.clearTimeout(timer);
  }, [importBanner]);

  const handleConfirmDeleteUnit = useCallback(async () => {
    if (!unitDeleteTargetId || unitDeleteInFlightRef.current) return;
    unitDeleteInFlightRef.current = true;
    setUnitDeletePending(true);
    try {
      const result = await deleteUnitById(unitDeleteTargetId);
      if (!result.ok) {
        setImportBanner(`削除失敗: ${result.error}`);
        return;
      }
      if (selectedModuleId) {
        const deletedUnit = device?.units.find(
          (u) => u.id === unitDeleteTargetId
        );
        if (deletedUnit?.modules.some((m) => m.id === selectedModuleId)) {
          setSelectedModuleId(null);
          setInitialSnapshot(null);
        }
      }
      setUnitDeleteTargetId(null);
      setImportBanner("ユニットを削除しました");
      router.refresh();
    } finally {
      unitDeleteInFlightRef.current = false;
      setUnitDeletePending(false);
    }
  }, [unitDeleteTargetId, selectedModuleId, device?.units, router]);

  const handleConfirmDeleteDevice = useCallback(async () => {
    const code = device?.internalCode?.trim();
    if (!code || deviceDeleteInFlightRef.current) return;
    deviceDeleteInFlightRef.current = true;
    setDeviceDeletePending(true);
    try {
      const result = await deleteEquipmentByInternalCode(code);
      if (!result.ok) {
        setImportBanner(`削除失敗: ${result.error}`);
        return;
      }
      setDeviceDeleteConfirmOpen(false);
      setSelectedModuleId(null);
      setInitialSnapshot(null);
      setImportBanner("装置を削除しました");
      router.refresh();
    } finally {
      deviceDeleteInFlightRef.current = false;
      setDeviceDeletePending(false);
    }
  }, [device?.internalCode, router]);

  const handleConfirmResetFlow = useCallback(async () => {
    if (!selectedModuleId || flowResetInFlightRef.current) return;
    flowResetInFlightRef.current = true;
    setFlowResetPending(true);
    try {
      const result = await resetFlowContentByModuleId(selectedModuleId);
      if (!result.ok) {
        setImportBanner(`リセット失敗: ${result.error}`);
        return;
      }
      const starter = getStarterFlowSnapshot();
      userContentOverrideRef.current = false;
      setFlowResetConfirmOpen(false);
      setInitialSnapshot(starter);
      setLoadSource("cloud");
      setLoadKey((k) => k + 1);
      if (moduleInfo && device) {
        await persistModuleDraft(moduleInfo.module, device, starter, {
          saveToCloud: false,
        });
      }
      setImportBanner("フローを雛形にリセットしました");
      router.refresh();
    } finally {
      flowResetInFlightRef.current = false;
      setFlowResetPending(false);
    }
  }, [selectedModuleId, moduleInfo, device, router]);

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

  let statusBanner = importBanner || cloudSaveBanner;
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
        <p
          role={statusBannerTone(statusBanner) === "error" ? "alert" : "status"}
          className={`px-3 py-1.5 text-xs ${statusBannerClassName(statusBannerTone(statusBanner))}`}
        >
          {statusBanner}
        </p>
      ) : null}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <ModuleNavPane
          devices={devices}
          selectedDeviceId={activeDeviceId}
          device={device}
          selectedModuleId={selectedModuleId}
          expandedUnitIds={expandedUnitIds}
          collapsed={navCollapsed}
          onToggleCollapsed={() => setNavCollapsed((v) => !v)}
          onSelectDevice={handleSelectDevice}
          onToggleUnit={handleToggleUnit}
          onSelectModule={handleSelectModule}
          onRequestDeleteUnit={setUnitDeleteTargetId}
          onRequestDeleteDevice={
            device.canDelete && device.internalCode
              ? () => setDeviceDeleteConfirmOpen(true)
              : undefined
          }
        />
        <FlowchartEditor
          key={
            selectedModuleId
              ? `${selectedModuleId}-${loadKey}`
              : `${activeDeviceId}:__none__`
          }
          ref={editorRef}
          contextLabel={contextLabel}
          moduleId={selectedModuleId}
          initialSnapshot={initialSnapshot}
          workspaceMode
          readOnly={!isEditor}
          onSnapshotPersist={persistCurrentModule}
          onInvalidatePendingModuleLoad={invalidatePendingModuleLoad}
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
          resetFlow={
            isEditor && moduleInfo?.module.canReset
              ? { onRequestReset: () => setFlowResetConfirmOpen(true) }
              : undefined
          }
        />
      </div>

      {deviceDeleteConfirmOpen && device ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !deviceDeletePending) {
              setDeviceDeleteConfirmOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-device-title"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-device-title"
              className="text-base font-semibold text-slate-900"
            >
              装置を削除しますか？
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{device.name}</strong>
              {device.internalCode ? (
                <>
                  {" "}
                  （社内番号 <strong>{device.internalCode}</strong>）
                </>
              ) : null}
              と配下のユニット・動作・フロー表をすべて削除します。取り消せません。
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                autoFocus
                disabled={deviceDeletePending}
                onClick={() => setDeviceDeleteConfirmOpen(false)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={deviceDeletePending}
                onClick={() => void handleConfirmDeleteDevice()}
                data-testid="delete-device-confirm"
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {unitDeleteTarget ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !unitDeletePending) {
              setUnitDeleteTargetId(null);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-unit-title"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="delete-unit-title"
              className="text-base font-semibold text-slate-900"
            >
              ユニットを削除しますか？
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{unitDeleteTarget.label}</strong>
              と配下の動作・フロー表をすべて削除します。取り消せません。
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                autoFocus
                disabled={unitDeletePending}
                onClick={() => setUnitDeleteTargetId(null)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={unitDeletePending}
                onClick={() => void handleConfirmDeleteUnit()}
                data-testid="delete-unit-confirm"
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {flowResetConfirmOpen && moduleInfo ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="presentation"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget && !flowResetPending) {
              setFlowResetConfirmOpen(false);
            }
          }}
        >
          <div
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="reset-flow-title"
            className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-5 shadow-xl"
          >
            <h2
              id="reset-flow-title"
              className="text-base font-semibold text-slate-900"
            >
              フローを雛形にリセットしますか？
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              <strong>{moduleInfo.module.label}</strong>
              の表・図を「雛形:
              はじめから」に戻します。クラウド上の保存内容も上書きされます。取り消せません。
            </p>
            <div className="mt-5 flex flex-wrap justify-end gap-2">
              <button
                type="button"
                autoFocus
                disabled={flowResetPending}
                onClick={() => setFlowResetConfirmOpen(false)}
                className="rounded border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                type="button"
                disabled={flowResetPending}
                onClick={() => void handleConfirmResetFlow()}
                data-testid="reset-flow-confirm"
                className="rounded bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                リセットする
              </button>
            </div>
          </div>
        </div>
      ) : null}
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
