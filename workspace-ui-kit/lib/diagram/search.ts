import type { Figure } from "@/data/figures";

export function normalize(text: string): string {
  return text.normalize("NFKC").trim().toLowerCase();
}

export type FigureFilterParams = {
  figures: readonly Figure[];
  query?: string;
  tag?: string | null;
  topicId?: string | null;
};

export function filterFigures({
  figures,
  query = "",
  tag = null,
  topicId = null,
}: FigureFilterParams): Figure[] {
  const normalizedQuery = normalize(query);

  return figures.filter((figure) => {
    const matchesSearch =
      normalizedQuery === "" ||
      normalize(figure.title).includes(normalizedQuery) ||
      normalize(figure.memo).includes(normalizedQuery) ||
      figure.tags.some((t) => normalize(t).includes(normalizedQuery));

    const matchesTag = tag === null || figure.tags.includes(tag);
    const matchesTopic = topicId === null || figure.topicId === topicId;

    return matchesSearch && matchesTag && matchesTopic;
  });
}

export function collectTags(figures: readonly Figure[]): string[] {
  return Array.from(new Set(figures.flatMap((f) => f.tags))).sort();
}
