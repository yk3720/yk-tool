import { z } from "zod";

import {
  IMPORT_BUNDLE_MAX_FLOWS,
  IMPORT_BUNDLE_MAX_LABEL_LEN,
  IMPORT_BUNDLE_MAX_MODULES_PER_UNIT,
  IMPORT_BUNDLE_MAX_TABLE_ROWS,
  IMPORT_BUNDLE_MAX_UNITS,
  IMPORT_BUNDLE_MAX_BYTES,
} from "./importBundleLimits";

const flowTableCell = z.union([
  z.string().max(IMPORT_BUNDLE_MAX_LABEL_LEN),
  z.number(),
  z.null(),
]);

const boundedLabel = z.string().min(1).max(IMPORT_BUNDLE_MAX_LABEL_LEN);

export const flowchartDocumentPayloadSchema = z.object({
  version: z.literal(1),
  schema: z.string().max(IMPORT_BUNDLE_MAX_LABEL_LEN).optional(),
  title: z.string().max(IMPORT_BUNDLE_MAX_LABEL_LEN).optional(),
  table: z
    .array(z.array(flowTableCell).max(10))
    .max(IMPORT_BUNDLE_MAX_TABLE_ROWS),
  layout: z
    .object({
      width: z.number(),
      heightMin: z.number(),
      gapV: z.number(),
      gapH: z.number(),
      baseLeft: z.number(),
      baseTop: z.number(),
    })
    .optional(),
  createdAt: z.string().max(64).optional(),
});

export const importBundleSchema = z.object({
  internal_code: boundedLabel,
  display_name: boundedLabel,
  units: z
    .array(
      z.object({
        label: boundedLabel,
        sort_order: z.number().int().nonnegative(),
        modules: z
          .array(
            z.object({
              label: boundedLabel,
              sort_order: z.number().int().nonnegative(),
            })
          )
          .max(IMPORT_BUNDLE_MAX_MODULES_PER_UNIT),
      })
    )
    .max(IMPORT_BUNDLE_MAX_UNITS),
  flows: z
    .array(
      z.object({
        unit_label: boundedLabel,
        module_label: boundedLabel,
        title: z.string().max(IMPORT_BUNDLE_MAX_LABEL_LEN),
        payload: flowchartDocumentPayloadSchema,
      })
    )
    .max(IMPORT_BUNDLE_MAX_FLOWS),
});

export type ImportBundle = z.infer<typeof importBundleSchema>;

export type RpcImportBundle = {
  internal_code: string;
  display_name: string;
  units: ImportBundle["units"];
  flows: Array<{
    unit_label: string;
    module_label: string;
    title: string;
    payload: {
      jsonText: string;
      committedJson: string;
      nodes: unknown[];
      edges: unknown[];
    };
  }>;
};

export function parseImportBundleJson(
  jsonText: string
): { ok: true; bundle: ImportBundle } | { ok: false; error: string } {
  const byteLength = new TextEncoder().encode(jsonText).byteLength;
  if (byteLength > IMPORT_BUNDLE_MAX_BYTES) {
    return {
      ok: false,
      error: `import.json が大きすぎます（上限 ${IMPORT_BUNDLE_MAX_BYTES / (1024 * 1024)}MB）`,
    };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return { ok: false, error: "JSON の形式が不正です" };
  }

  const result = importBundleSchema.safeParse(parsed);
  if (!result.success) {
    return {
      ok: false,
      error: result.error.issues.map((i) => i.message).join(" · "),
    };
  }
  return { ok: true, bundle: result.data };
}
