import { z } from "zod";

/** クラウド保存用 — ModuleSnapshot の緩い検証 */
export const moduleSnapshotSchema = z.object({
  jsonText: z.string(),
  committedJson: z.string(),
  nodes: z.array(z.record(z.unknown())),
  edges: z.array(z.record(z.unknown())),
  themeId: z.string(),
  layoutPreset: z.string(),
});

export type ModuleSnapshotPayload = z.infer<typeof moduleSnapshotSchema>;
