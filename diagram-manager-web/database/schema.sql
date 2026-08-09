-- 図解管理 — Neon（Postgres）用スキーマ
-- アプリ初回 list() でも同等の CREATE を実行する（本ファイルは正本・手動適用用）

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
);

CREATE INDEX IF NOT EXISTS figures_category_id_idx ON figures (category_id);
CREATE INDEX IF NOT EXISTS figures_topic_id_idx ON figures (topic_id);
