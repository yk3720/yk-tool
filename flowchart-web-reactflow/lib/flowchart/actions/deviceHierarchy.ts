"use server";

import type { Device } from "@/lib/flowchart/moduleHierarchy";
import { isAuthDisabled } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { requireViewerOrEditor } from "./flowDocumentsAuth";

export type DeviceHierarchyResult =
  | { ok: true; devices: Device[] }
  | { ok: false; error: string };

type DbFlowDocumentRow = {
  created_by: string | null;
};

type DbModuleRow = {
  id: string;
  label: string;
  sort_order: number;
  legacy_key: string | null;
  flow_documents: DbFlowDocumentRow[] | DbFlowDocumentRow | null;
};

type DbUnitRow = {
  id: string;
  label: string;
  sort_order: number;
  created_by: string | null;
  modules: DbModuleRow[] | null;
};

type DbDeviceRow = {
  id: string;
  internal_code: string;
  display_name: string;
  sort_order: number;
  created_by: string | null;
  units: DbUnitRow[] | null;
};

function mapDbDevices(rows: DbDeviceRow[]): Device[] {
  return [...rows]
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((d) => ({
      id: d.id,
      internalCode: d.internal_code,
      name: d.display_name,
      ...(d.created_by ? { createdBy: d.created_by } : {}),
      units: [...(d.units ?? [])]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((u) => ({
          id: u.id,
          label: u.label,
          ...(u.created_by ? { createdBy: u.created_by } : {}),
          modules: [...(u.modules ?? [])]
            .sort((a, b) => a.sort_order - b.sort_order)
            .map((m) => {
              const flowRows = Array.isArray(m.flow_documents)
                ? m.flow_documents
                : m.flow_documents
                  ? [m.flow_documents]
                  : [];
              const flowRow = flowRows[0];
              return {
                id: m.id,
                label: m.label,
                legacyKey: m.legacy_key ?? undefined,
                ...(flowRow
                  ? {
                      hasFlow: true as const,
                      flowCreatedBy: flowRow.created_by ?? undefined,
                    }
                  : { hasFlow: false as const }),
              };
            }),
        })),
    }));
}

export async function fetchDeviceHierarchy(): Promise<DeviceHierarchyResult> {
  if (isAuthDisabled()) {
    return { ok: false, error: "auth_disabled" };
  }

  try {
    await requireViewerOrEditor();
    const supabase = await createSupabaseServerClient();
    const { data, error } = await supabase
      .from("devices")
      .select(
        `
        id,
        internal_code,
        display_name,
        sort_order,
        created_by,
        units (
          id,
          label,
          sort_order,
          created_by,
          modules (
            id,
            label,
            sort_order,
            legacy_key,
            flow_documents (
              created_by
            )
          )
        )
      `
      )
      .order("sort_order");

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data?.length) {
      return { ok: false, error: "no_devices" };
    }

    return { ok: true, devices: mapDbDevices(data as DbDeviceRow[]) };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
