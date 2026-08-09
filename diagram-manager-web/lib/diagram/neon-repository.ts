import "server-only";

import { FIGURES, type Audience, type CategoryId, type Figure } from "@/data/figures";
import type { TopicId } from "@/data/topics";
import { figureSchema } from "@/lib/diagram/figure-schema";
import { getSql, type Sql } from "@/lib/diagram/db";
import type { FigureRepository } from "@/lib/diagram/repository";

type FigureRow = {
  id: string;
  category_id: string;
  topic_id: string;
  title: string;
  url: string;
  tags: string[] | null;
  memo: string;
  published_at: string;
  series_id: string | null;
  audience: string | null;
};

async function ensureSchema(sql: Sql): Promise<void> {
  await sql`
    CREATE TABLE IF NOT EXISTS figures (
      id TEXT PRIMARY KEY,
      category_id TEXT NOT NULL,
      topic_id TEXT NOT NULL,
      title TEXT NOT NULL,
      url TEXT NOT NULL,
      tags TEXT[] NOT NULL DEFAULT '{}',
      memo TEXT NOT NULL DEFAULT '',
      published_at TEXT NOT NULL,
      series_id TEXT,
      audience TEXT
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS figures_category_id_idx ON figures (category_id)`;
  await sql`CREATE INDEX IF NOT EXISTS figures_topic_id_idx ON figures (topic_id)`;
}

function mapRow(row: FigureRow): Figure {
  const parsed = figureSchema.parse({
    id: row.id,
    categoryId: row.category_id,
    topicId: row.topic_id,
    title: row.title,
    url: row.url,
    tags: row.tags ?? [],
    memo: row.memo,
    publishedAt: row.published_at,
    ...(row.series_id ? { seriesId: row.series_id } : {}),
    ...(row.audience ? { audience: row.audience as Audience } : {}),
  });

  return {
    id: parsed.id,
    categoryId: parsed.categoryId as CategoryId,
    topicId: parsed.topicId as TopicId,
    title: parsed.title,
    url: parsed.url,
    tags: parsed.tags,
    memo: parsed.memo,
    publishedAt: parsed.publishedAt,
    ...(parsed.seriesId ? { seriesId: parsed.seriesId } : {}),
    ...(parsed.audience ? { audience: parsed.audience } : {}),
  };
}

async function seedIfEmpty(sql: Sql): Promise<Figure[]> {
  const countRows = await sql`SELECT COUNT(*)::int AS count FROM figures`;
  const count = Number(countRows[0]?.count ?? 0);
  if (count > 0) {
    return [];
  }

  for (const figure of FIGURES) {
    await sql`
      INSERT INTO figures (
        id, category_id, topic_id, title, url, tags, memo, published_at, series_id, audience
      ) VALUES (
        ${figure.id},
        ${figure.categoryId},
        ${figure.topicId},
        ${figure.title},
        ${figure.url},
        ${figure.tags},
        ${figure.memo},
        ${figure.publishedAt},
        ${figure.seriesId ?? null},
        ${figure.audience ?? null}
      )
      ON CONFLICT (id) DO NOTHING
    `;
  }

  return [...FIGURES];
}

async function selectAll(sql: Sql): Promise<Figure[]> {
  const rows = (await sql`
    SELECT
      id,
      category_id,
      topic_id,
      title,
      url,
      tags,
      memo,
      published_at,
      series_id,
      audience
    FROM figures
    ORDER BY published_at ASC, id ASC
  `) as FigureRow[];

  return rows.map(mapRow);
}

export const neonFigureRepository: FigureRepository = {
  async list() {
    const sql = getSql();
    await ensureSchema(sql);
    const seeded = await seedIfEmpty(sql);
    if (seeded.length > 0) {
      return seeded;
    }
    return selectAll(sql);
  },

  async remove(id: string) {
    const sql = getSql();
    await ensureSchema(sql);
    await sql`DELETE FROM figures WHERE id = ${id}`;
  },

  async updateMemo(id: string, memo: string) {
    const sql = getSql();
    await ensureSchema(sql);
    const result = await sql`
      UPDATE figures
      SET memo = ${memo}
      WHERE id = ${id}
      RETURNING id
    `;
    if (result.length === 0) {
      throw new Error(`図解が見つかりません: ${id}`);
    }
  },
};
