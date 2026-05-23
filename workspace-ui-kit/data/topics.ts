import type { CategoryId } from "@/data/figures";

export const TOPICS = [
  // Techmap
  { id: "cursor", categoryId: "techmap", label: "Cursor" },
  { id: "excel", categoryId: "techmap", label: "Excel" },
  { id: "nodejs", categoryId: "techmap", label: "Node.js" },
  { id: "ai", categoryId: "techmap", label: "AI" },
  { id: "automation", categoryId: "techmap", label: "自動化・GAS" },
  { id: "agriculture", categoryId: "techmap", label: "農業・自然" },
  { id: "astrology", categoryId: "techmap", label: "占星術" },
  { id: "design", categoryId: "techmap", label: "UI・デザイン" },
  { id: "concepts", categoryId: "techmap", label: "概念・理論" },
  // CuriosityMap
  { id: "curimap-astrology", categoryId: "curiositymap", label: "占星術" },
  { id: "curimap-ai", categoryId: "curiositymap", label: "AI" },
  // Visual Explainer（公開図解が増えたら topic を追加）
  // ツール
  { id: "tool-dashboard", categoryId: "tool", label: "ダッシュボード" },
] as const;

export type TopicId = (typeof TOPICS)[number]["id"];
export type Topic = (typeof TOPICS)[number];

export function getTopicsForCategory(categoryId: CategoryId): Topic[] {
  return TOPICS.filter((t) => t.categoryId === categoryId);
}

export function getTopicById(topicId: TopicId): Topic | undefined {
  return TOPICS.find((t) => t.id === topicId);
}
