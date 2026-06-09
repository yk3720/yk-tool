import { normalizeFlowchartDocument, serializeDocument } from "./document";
import { generateFlowchart } from "./generate";
import type { ModuleSnapshot } from "./moduleDraftRepository";
import { toReactFlow } from "./toReactFlow";
import type { FlowchartDocument } from "./types";

export type SnapshotFromDocumentResult =
  | { ok: true; snapshot: ModuleSnapshot }
  | { ok: false; errors: string[] };

export function snapshotFromFlowchartDocument(
  doc: FlowchartDocument
): SnapshotFromDocumentResult {
  const normalized = normalizeFlowchartDocument(doc);
  const generated = generateFlowchart(normalized.table, normalized.layout);
  if (!generated.ok) {
    return {
      ok: false,
      errors: generated.errors,
    };
  }

  const { nodes, edges } = toReactFlow(generated.placed, generated.edges);
  const jsonText = serializeDocument(normalized);

  return {
    ok: true,
    snapshot: {
      jsonText,
      committedJson: jsonText,
      nodes,
      edges,
    },
  };
}
