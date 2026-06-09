import type { FlowchartDocument } from "./types";
import type { ImportBundle, RpcImportBundle } from "./importBundleSchema";
import { snapshotFromFlowchartDocument } from "./snapshotFromDocument";

export type PrepareImportResult =
  | { ok: true; bundle: RpcImportBundle }
  | { ok: false; errors: string[] };

export function prepareImportBundleForRpc(
  bundle: ImportBundle
): PrepareImportResult {
  const errors: string[] = [];
  const flows: RpcImportBundle["flows"] = [];

  for (const flow of bundle.flows) {
    const doc = flow.payload as FlowchartDocument;
    const converted = snapshotFromFlowchartDocument(doc);
    if (!converted.ok) {
      errors.push(
        `${flow.unit_label} · ${flow.module_label}: ${converted.errors.join(" / ")}`
      );
      continue;
    }
    flows.push({
      unit_label: flow.unit_label,
      module_label: flow.module_label,
      title: flow.title,
      payload: converted.snapshot,
    });
  }

  if (errors.length > 0) {
    return { ok: false, errors };
  }

  return {
    ok: true,
    bundle: {
      internal_code: bundle.internal_code,
      display_name: bundle.display_name,
      units: bundle.units,
      flows,
    },
  };
}
