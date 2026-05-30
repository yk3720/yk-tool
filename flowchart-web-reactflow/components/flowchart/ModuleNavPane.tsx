"use client";

import { ChevronDown, ChevronRight, PanelLeftClose, PanelLeftOpen } from "lucide-react";

import type { Device, FlowModule, FlowUnit } from "@/lib/flowchart/moduleHierarchy";
import { cn } from "@/lib/utils";

type ModuleNavPaneProps = {
  devices: readonly Device[];
  selectedDeviceId: string;
  device: Device;
  selectedModuleId: string | null;
  expandedUnitIds: ReadonlySet<string>;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  onSelectDevice: (deviceId: string) => void;
  onToggleUnit: (unitId: string) => void;
  onSelectModule: (moduleId: string) => void;
};

function ModuleButton({
  module,
  selected,
  onSelect,
}: {
  module: FlowModule;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-current={selected ? "page" : undefined}
      className={cn(
        "w-full rounded-md px-3 py-1.5 text-left text-sm transition-colors",
        selected
          ? "bg-blue-100 font-medium text-blue-900"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      {module.label}
    </button>
  );
}

function UnitSection({
  unit,
  expanded,
  selectedModuleId,
  onToggleUnit,
  onSelectModule,
}: {
  unit: FlowUnit;
  expanded: boolean;
  selectedModuleId: string | null;
  onToggleUnit: () => void;
  onSelectModule: (moduleId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <button
        type="button"
        onClick={onToggleUnit}
        aria-expanded={expanded}
        className="flex w-full items-center gap-1.5 rounded-md px-2 py-1.5 text-left text-sm font-medium text-slate-800 hover:bg-slate-100"
      >
        {expanded ? (
          <ChevronDown className="size-4 shrink-0 text-slate-500" aria-hidden />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-slate-500" aria-hidden />
        )}
        <span className="truncate">{unit.label}</span>
      </button>
      {expanded ? (
        <div className="flex flex-col gap-0.5 pl-5">
          {unit.modules.map((mod) => (
            <ModuleButton
              key={mod.id}
              module={mod}
              selected={selectedModuleId === mod.id}
              onSelect={() => onSelectModule(mod.id)}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function ModuleNavPane({
  devices,
  selectedDeviceId,
  device,
  selectedModuleId,
  expandedUnitIds,
  collapsed,
  onToggleCollapsed,
  onSelectDevice,
  onToggleUnit,
  onSelectModule,
}: ModuleNavPaneProps) {
  if (collapsed) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center border-r border-slate-200 bg-slate-50 py-3">
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-md p-2 text-slate-600 hover:bg-slate-200"
          title="ナビを開く"
          aria-label="ナビを開く"
        >
          <PanelLeftOpen className="size-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-full shrink-0 flex-col border-r border-slate-200 bg-slate-50 lg:w-[min(20%,240px)] lg:min-w-[180px]">
      <div className="flex items-center justify-between gap-2 border-b border-slate-200 px-3 py-2">
        <h2 className="truncate text-sm font-semibold text-slate-800">フロー</h2>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className="rounded-md p-1.5 text-slate-500 hover:bg-slate-200 lg:hidden"
          title="ナビを閉じる"
          aria-label="ナビを閉じる"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className="border-b border-slate-200 px-3 py-2">
        <label className="flex flex-col gap-1">
          <span className="text-xs font-medium text-slate-500">装置</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm text-slate-800"
            aria-label="装置を選択"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <nav
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
        aria-label="ユニットと動作"
      >
        {device.units.map((unit) => (
          <UnitSection
            key={unit.id}
            unit={unit}
            expanded={expandedUnitIds.has(unit.id)}
            selectedModuleId={selectedModuleId}
            onToggleUnit={() => onToggleUnit(unit.id)}
            onSelectModule={onSelectModule}
          />
        ))}
      </nav>
    </aside>
  );
}
