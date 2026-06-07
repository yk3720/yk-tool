import { z } from "zod";

const flowTableCell = z.union([z.string(), z.number(), z.null()]);

export const flowchartDocumentPayloadSchema = z.object({
  version: z.literal(1),
  schema: z.string().optional(),
  title: z.string().optional(),
  table: z.array(z.array(flowTableCell)),
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
  createdAt: z.string().optional(),
});

export const importBundleSchema = z.object({
  internal_code: z.string().min(1),
  display_name: z.string().min(1),
  units: z.array(
    z.object({
      label: z.string().min(1),
      sort_order: z.number().int().nonnegative(),
      modules: z.array(
        z.object({
          label: z.string().min(1),
          sort_order: z.number().int().nonnegative(),
        }),
      ),
    }),
  ),
  flows: z.array(
    z.object({
      unit_label: z.string().min(1),
      module_label: z.string().min(1),
      title: z.string(),
      payload: flowchartDocumentPayloadSchema,
    }),
  ),
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

export function parseImportBundleJson(jsonText: string):
  | { ok: true; bundle: ImportBundle }
  | { ok: false; error: string } {
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
