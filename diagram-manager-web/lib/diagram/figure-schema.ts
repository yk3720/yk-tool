import { z } from "zod";

import { CATEGORIES } from "@/data/figures";
import { TOPICS } from "@/data/topics";

const categoryIds = CATEGORIES.map((c) => c.id) as [string, ...string[]];
const topicIds = TOPICS.map((t) => t.id) as [string, ...string[]];

export const categoryIdSchema = z.enum(categoryIds);
export const topicIdSchema = z.enum(topicIds);

export const figureSchema = z.object({
  id: z.string().min(1),
  categoryId: categoryIdSchema,
  topicId: topicIdSchema,
  title: z.string().min(1),
  url: z.url(),
  tags: z.array(z.string()),
  memo: z.string(),
  publishedAt: z.string().min(1),
  seriesId: z.string().min(1).optional(),
  audience: z.enum(["technical", "general"]).optional(),
});

export type FigureInput = z.infer<typeof figureSchema>;
