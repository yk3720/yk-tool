export const diagramFeatures = {
  cardDelete: false,
  memoEdit: true,
  surgeCommands: true,
  surgeCommandsCollapsedDefault: true,
  seriesRelatedPane: true,
} as const;

export type DiagramFeatures = typeof diagramFeatures;
