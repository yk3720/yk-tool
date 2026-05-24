"use client";

import { useCallback, useRef, useState } from "react";

import {
  DEMO_DEVICE,
  findModule,
} from "@/lib/flowchart/moduleHierarchy";
import { moduleDraftRepository } from "@/lib/flowchart/moduleDraftRepository";

import {
  FlowchartEditor,
  type FlowchartEditorHandle,
} from "./FlowchartEditor";
import { ModuleNavPane } from "./ModuleNavPane";

export function FlowchartWorkspace() {
  const editorRef = useRef<FlowchartEditorHandle>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [expandedUnitIds, setExpandedUnitIds] = useState<Set<string>>(
    () => new Set(DEMO_DEVICE.units.map((u) => u.id)),
  );
  const [navCollapsed, setNavCollapsed] = useState(false);

  const persistCurrentModule = useCallback(() => {
    if (!selectedModuleId || !editorRef.current) return;
    moduleDraftRepository.set(selectedModuleId, editorRef.current.getSnapshot());
  }, [selectedModuleId]);

  const handleToggleUnit = useCallback((unitId: string) => {
    setExpandedUnitIds((prev) => {
      const next = new Set(prev);
      if (next.has(unitId)) next.delete(unitId);
      else next.add(unitId);
      return next;
    });
  }, []);

  const handleSelectModule = useCallback(
    (moduleId: string) => {
      persistCurrentModule();
      setSelectedModuleId(moduleId);
      const found = findModule(DEMO_DEVICE, moduleId);
      if (found) {
        setExpandedUnitIds((prev) => new Set(prev).add(found.unit.id));
      }
    },
    [persistCurrentModule],
  );

  const moduleInfo = selectedModuleId
    ? findModule(DEMO_DEVICE, selectedModuleId)
    : null;
  const initialSnapshot = selectedModuleId
    ? moduleDraftRepository.get(selectedModuleId)
    : null;

  return (
    <div className="flex min-h-screen flex-col bg-white text-slate-900">
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
          key={selectedModuleId ?? "__none__"}
          ref={editorRef}
          deviceName={DEMO_DEVICE.name}
          moduleId={selectedModuleId}
          moduleLabel={moduleInfo?.module.label}
          initialSnapshot={initialSnapshot}
          workspaceMode
          onSnapshotPersist={persistCurrentModule}
        />
      </div>
    </div>
  );
}
