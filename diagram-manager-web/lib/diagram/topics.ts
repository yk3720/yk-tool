import type { CategoryId, Figure } from "@/data/figures";
import { getTopicsForCategory, type Topic, type TopicId } from "@/data/topics";

export function countFiguresByTopic(
  figures: readonly Figure[],
  categoryId: CategoryId,
): Record<TopicId, number> {
  const counts = {} as Record<TopicId, number>;
  for (const figure of figures) {
    if (figure.categoryId !== categoryId) continue;
    counts[figure.topicId] = (counts[figure.topicId] ?? 0) + 1;
  }
  return counts;
}

/** 種別内で、図解が1件以上あるトピックだけ（定義順） */
export function listTopicsWithFigures(
  figures: readonly Figure[],
  categoryId: CategoryId,
): Topic[] {
  const counts = countFiguresByTopic(figures, categoryId);
  return getTopicsForCategory(categoryId).filter((topic) => (counts[topic.id] ?? 0) > 0);
}
