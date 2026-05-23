import { CATEGORIES, type CategoryId, type Figure } from "@/data/figures";

export const AUDIENCE_LABELS = {
  technical: "技術者向け",
  general: "一般向け",
} as const;

export function hasSeriesData(figures: readonly Figure[]): boolean {
  return figures.some((f) => f.seriesId !== undefined);
}

export function getSeriesSiblings(
  primaryFigures: readonly Figure[],
  allFigures: readonly Figure[],
): Figure[] {
  const primaryIds = new Set(primaryFigures.map((f) => f.id));
  const seriesIds = new Set(
    primaryFigures
      .map((f) => f.seriesId)
      .filter((id): id is string => id !== undefined),
  );

  if (seriesIds.size === 0) {
    return [];
  }

  const siblings = allFigures.filter(
    (f) =>
      f.seriesId !== undefined &&
      seriesIds.has(f.seriesId) &&
      !primaryIds.has(f.id),
  );

  return sortSeriesFigures(siblings);
}

export function getSeriesMembers(
  seriesId: string,
  allFigures: readonly Figure[],
): Figure[] {
  return sortSeriesFigures(allFigures.filter((f) => f.seriesId === seriesId));
}

function sortSeriesFigures(figures: readonly Figure[]): Figure[] {
  return [...figures].sort(compareSeriesFigures);
}

function compareSeriesFigures(a: Figure, b: Figure): number {
  const dateCmp = b.publishedAt.localeCompare(a.publishedAt);
  if (dateCmp !== 0) {
    return dateCmp;
  }
  return categorySortIndex(a.categoryId) - categorySortIndex(b.categoryId);
}

function categorySortIndex(categoryId: CategoryId): number {
  const index = CATEGORIES.findIndex((c) => c.id === categoryId);
  return index === -1 ? Number.MAX_SAFE_INTEGER : index;
}

export function getCategoryLabel(categoryId: CategoryId): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? categoryId;
}
