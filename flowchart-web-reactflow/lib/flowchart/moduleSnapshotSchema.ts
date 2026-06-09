import { z } from "zod";

/** クラウド保存用 — ModuleSnapshot の緩い検証（旧 themeId / layoutPreset は読込時に破棄） */
export const moduleSnapshotSchema = z
  .object({
    jsonText: z.string(),
    committedJson: z.string(),
    nodes: z.array(z.record(z.unknown())),
    edges: z.array(z.record(z.unknown())),
    themeId: z.string().optional(),
    layoutPreset: z.string().optional(),
  })
  .transform(
    ({ themeId: _themeId, layoutPreset: _layoutPreset, ...snap }) => snap
  );

export type ModuleSnapshotPayload = z.infer<typeof moduleSnapshotSchema>;
