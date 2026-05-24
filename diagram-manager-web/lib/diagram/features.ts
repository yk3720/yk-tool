export const diagramFeatures = {
  cardDelete: false,
  memoEdit: false,
  surgeCommands: true,
  surgeCommandsCollapsedDefault: true,
  seriesRelatedPane: true,
} as const;

export type DiagramFeatures = typeof diagramFeatures;
