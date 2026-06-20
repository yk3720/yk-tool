"use client";

import {
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Trash2,
} from "lucide-react";
import { useCallback, useRef, type KeyboardEvent } from "react";

import {
  formatDeviceSelectLabel,
  type Device,
  type FlowModule,
  type FlowUnit,
} from "@/lib/flowchart/moduleHierarchy";
import { cn } from "@/lib/utils";

import {
  fcBtnDangerOutline,
  fcNavAside,
  fcNavAsideCollapsed,
  fcBorderB,
  fcNavChevron,
  fcNavCollapseBtn,
  fcNavDeleteBtn,
  fcNavHeader,
  fcNavIconBtn,
  fcNavLabel,
  fcNavModuleBtn,
  fcNavModuleBtnState,
  fcNavSelect,
  fcNavTitle,
  fcNavUnitToggle,
} from "./flowchartUiClasses";

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
  onRequestDeleteUnit?: (unitId: string) => void;
  onRequestDeleteModule?: (moduleId: string) => void;
  onRequestDeleteDevice?: () => void;
};

function getNavFocusables(nav: HTMLElement | null): HTMLElement[] {
  if (!nav) return [];
  return Array.from(
    nav.querySelectorAll<HTMLElement>(
      'button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
  );
}

function ModuleButton({
  module,
  selected,
  onSelect,
  showDelete,
  onRequestDelete,
}: {
  module: FlowModule;
  selected: boolean;
  onSelect: () => void;
  showDelete: boolean;
  onRequestDelete?: () => void;
}) {
  return (
    <div className="flex items-center gap-0.5">
      <button
        type="button"
        onClick={onSelect}
        aria-current={selected ? "page" : undefined}
        className={cn(fcNavModuleBtn, fcNavModuleBtnState(selected))}
      >
        <span className="truncate">{module.label}</span>
      </button>
      {showDelete && onRequestDelete ? (
        <button
          type="button"
          onClick={onRequestDelete}
          data-testid={`delete-module-${module.id}`}
          className={fcNavDeleteBtn}
          title={`${module.label} を削除`}
          aria-label={`${module.label} を削除`}
        >
          <Trash2 className="size-3.5" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

function UnitSection({
  unit,
  expanded,
  selectedModuleId,
  onToggleUnit,
  onSelectModule,
  showDelete,
  onRequestDelete,
  onRequestDeleteModule,
}: {
  unit: FlowUnit;
  expanded: boolean;
  selectedModuleId: string | null;
  onToggleUnit: () => void;
  onSelectModule: (moduleId: string) => void;
  showDelete: boolean;
  onRequestDelete?: () => void;
  onRequestDeleteModule?: (moduleId: string) => void;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center gap-0.5">
        <button
          type="button"
          onClick={onToggleUnit}
          aria-expanded={expanded}
          data-unit-toggle
          data-unit-id={unit.id}
          className={fcNavUnitToggle}
        >
          {expanded ? (
            <ChevronDown className={fcNavChevron} aria-hidden />
          ) : (
            <ChevronRight className={fcNavChevron} aria-hidden />
          )}
          <span className="truncate">{unit.label}</span>
        </button>
        {showDelete && onRequestDelete ? (
          <button
            type="button"
            onClick={onRequestDelete}
            data-testid={`delete-unit-${unit.id}`}
            className={fcNavDeleteBtn}
            title={`${unit.label} を削除`}
            aria-label={`${unit.label} を削除`}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        ) : null}
      </div>
      {expanded ? (
        <div className="flex flex-col gap-0.5 pl-5">
          {unit.modules.map((mod) => (
            <ModuleButton
              key={mod.id}
              module={mod}
              selected={selectedModuleId === mod.id}
              onSelect={() => onSelectModule(mod.id)}
              showDelete={mod.canDelete === true}
              onRequestDelete={
                onRequestDeleteModule
                  ? () => onRequestDeleteModule(mod.id)
                  : undefined
              }
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
  onRequestDeleteUnit,
  onRequestDeleteModule,
  onRequestDeleteDevice,
}: ModuleNavPaneProps) {
  const navRef = useRef<HTMLElement>(null);

  const handleNavKeyDown = useCallback(
    (e: KeyboardEvent<HTMLElement>) => {
      const focusables = getNavFocusables(navRef.current);
      const current = document.activeElement as HTMLElement;
      const currentIndex = focusables.indexOf(current);
      const unitToggle = current.closest<HTMLElement>("[data-unit-toggle]");

      if (unitToggle && (e.key === "ArrowRight" || e.key === "ArrowLeft")) {
        const unitId = unitToggle.getAttribute("data-unit-id");
        const expanded = unitToggle.getAttribute("aria-expanded") === "true";
        if (unitId) {
          if (e.key === "ArrowRight" && !expanded) {
            e.preventDefault();
            onToggleUnit(unitId);
            return;
          }
          if (e.key === "ArrowLeft" && expanded) {
            e.preventDefault();
            onToggleUnit(unitId);
            return;
          }
        }
      }

      switch (e.key) {
        case "ArrowDown":
          e.preventDefault();
          if (currentIndex < 0) {
            focusables[0]?.focus();
          } else {
            focusables[(currentIndex + 1) % focusables.length]?.focus();
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          if (currentIndex < 0) {
            focusables[focusables.length - 1]?.focus();
          } else {
            focusables[
              (currentIndex - 1 + focusables.length) % focusables.length
            ]?.focus();
          }
          break;
        case "Home":
          e.preventDefault();
          focusables[0]?.focus();
          break;
        case "End":
          e.preventDefault();
          focusables[focusables.length - 1]?.focus();
          break;
        default:
          break;
      }
    },
    [onToggleUnit]
  );

  if (collapsed) {
    return (
      <aside className={fcNavAsideCollapsed}>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={fcNavCollapseBtn}
          title="ナビを開く"
          aria-label="ナビを開く"
        >
          <PanelLeftOpen className="size-5" />
        </button>
      </aside>
    );
  }

  return (
    <aside className={fcNavAside}>
      <div className={fcNavHeader}>
        <h2 className={fcNavTitle}>フロー</h2>
        <button
          type="button"
          onClick={onToggleCollapsed}
          className={fcNavIconBtn}
          title="ナビを閉じる"
          aria-label="ナビを閉じる"
        >
          <PanelLeftClose className="size-4" />
        </button>
      </div>

      <div className={cn("space-y-2", fcBorderB, "px-3 py-2")}>
        <label className="flex flex-col gap-1">
          <span className={fcNavLabel}>装置</span>
          <select
            value={selectedDeviceId}
            onChange={(e) => onSelectDevice(e.target.value)}
            className={fcNavSelect}
            aria-label="装置を選択"
          >
            {devices.map((d) => (
              <option key={d.id} value={d.id}>
                {formatDeviceSelectLabel(d)}
              </option>
            ))}
          </select>
        </label>
        {device.canDelete && onRequestDeleteDevice ? (
          <button
            type="button"
            onClick={onRequestDeleteDevice}
            data-testid="delete-device-request"
            className={cn(
              fcBtnDangerOutline,
              "flex w-full items-center justify-center gap-1.5"
            )}
          >
            <Trash2 className="size-3.5" aria-hidden />
            装置を削除…
          </button>
        ) : null}
      </div>

      <nav
        ref={navRef}
        className="flex flex-1 flex-col gap-1 overflow-y-auto p-2"
        aria-label="ユニットと動作"
        onKeyDown={handleNavKeyDown}
      >
        {device.units.map((unit) => (
          <UnitSection
            key={unit.id}
            unit={unit}
            expanded={expandedUnitIds.has(unit.id)}
            selectedModuleId={selectedModuleId}
            onToggleUnit={() => onToggleUnit(unit.id)}
            onSelectModule={onSelectModule}
            showDelete={unit.canDelete === true}
            onRequestDelete={
              onRequestDeleteUnit
                ? () => onRequestDeleteUnit(unit.id)
                : undefined
            }
            onRequestDeleteModule={onRequestDeleteModule}
          />
        ))}
      </nav>
    </aside>
  );
}
