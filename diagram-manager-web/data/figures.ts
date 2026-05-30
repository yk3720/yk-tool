import type { TopicId } from "@/data/topics";

/**
 * 図解管理 UI 用シードデータ。
 *
 * - **公開メタ（タイトル・URL・公開日・種別）の SSOT:** `c:/yk-skill/metadata/surge-published-list.md`
 * - **本ファイルが追加で持つもの:** `topicId` · `tags` · `memo` · `seriesId` · `audience`（台帳に無い）
 *
 * surge デプロイ後: 台帳を先に更新 → 本ファイルの `url` · `title` · `publishedAt` · `categoryId` を揃える。
 * 配列順は台帳 #1〜15 と同順（2026-05-23 照合済み · 15件）。
 */

export const CATEGORIES = [
  {
    id: "techmap",
    label: "Techmap",
    description: "理系エンジニア向け技術解説（creating-diagram-techmap）",
  },
  {
    id: "curiositymap",
    label: "CuriosityMap",
    description: "文系・一般向け図解（creating-curiosity-map）",
  },
  {
    id: "visual-explainer",
    label: "Visual Explainer",
    description: "汎用図解（creating-visual-explainers・diagram-*.surge.sh）",
  },
  {
    id: "tool",
    label: "ツール",
    description: "ダッシュボード・業務アプリ（surge 公開のツール本体）",
  },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
export type Category = (typeof CATEGORIES)[number];

export type Audience = "technical" | "general";

export type Figure = {
  id: string;
  categoryId: CategoryId;
  topicId: TopicId;
  title: string;
  url: string;
  tags: string[];
  memo: string;
  publishedAt: string;
  seriesId?: string;
  audience?: Audience;
};

export const FIGURES: Figure[] = [
  {
    id: "d1",
    categoryId: "techmap",
    topicId: "cursor",
    title: "Cursorで使えるAIモデル完全ガイド（2026年3月）",
    url: "https://techmap-cursor-ai-models.surge.sh",
    tags: ["AI", "Cursor", "モデル"],
    memo: "Cursorで利用可能なAIモデルの全容を解説。各モデルの特徴・用途・料金を網羅した技術解説図解。",
    publishedAt: "2026-03-28",
  },
  {
    id: "d2",
    categoryId: "techmap",
    topicId: "excel",
    title: "Excel テックマップ — 実務エンジニアのための技術図解",
    url: "https://techmap-excel.surge.sh",
    tags: ["Excel", "実務", "自動化"],
    memo: "Excelの実務テクニックを技術観点で体系化。VBA・関数・データ整形の全体像を図解。",
    publishedAt: "2026-03-28",
  },
  {
    id: "d3",
    categoryId: "techmap",
    topicId: "nodejs",
    title: "Node.js 入門",
    url: "https://techmap-nodejs.surge.sh",
    tags: ["Node.js", "JavaScript", "バックエンド"],
    memo: "Node.jsの基礎から非同期処理・モジュールシステムまでをビジュアルで解説。",
    publishedAt: "2026-03-28",
  },
  {
    id: "d4",
    categoryId: "techmap",
    topicId: "agriculture",
    title: "自然農 — 不耕起・無農薬・無化学肥料で土を育てる農法",
    url: "https://techmap-shizen-no.surge.sh",
    tags: ["農業", "自然農", "土壌"],
    memo: "自然農の哲学と実践を体系的に図解。不耕起・無農薬の原理と土の微生物との関係を可視化。",
    publishedAt: "2026-03-28",
  },
  {
    id: "d5",
    categoryId: "techmap",
    topicId: "concepts",
    title: "シンタックスとセマンティクス — 形式と意味を分けて考える",
    url: "https://techmap-syntax-semantics.surge.sh",
    tags: ["言語学", "プログラミング理論", "概念"],
    memo: "形式（シンタックス）と意味（セマンティクス）の違いを、プログラミングと自然言語を横断して図解。",
    publishedAt: "2026-03-28",
  },
  {
    id: "d13",
    categoryId: "curiositymap",
    topicId: "curimap-astrology",
    title: "ヘレニスティック占星術",
    url: "https://curimap-hellenistic-astrology.surge.sh",
    tags: ["占星術", "歴史", "ギリシャ"],
    memo: "古代ギリシャ・ローマ時代の占星術をゼロから理解できるよう平易に図解。",
    publishedAt: "2026-04-08",
  },
  {
    id: "d6",
    categoryId: "techmap",
    topicId: "astrology",
    title: "インド占星術（ジョーティシュ）",
    url: "https://techmap-jyotish.surge.sh",
    tags: ["占星術", "ジョーティシュ", "インド"],
    memo: "インド占星術の体系をテックマップ形式で解説。ラーシ・バーヴァ・グラハの関係を図解。",
    publishedAt: "2026-04-10",
  },
  {
    id: "d7",
    categoryId: "techmap",
    topicId: "design",
    title: "UIデザインの変遷とデザイン4原則の相関分析（2000–2026）",
    url: "https://techmap-ui-design-crap.surge.sh",
    tags: ["UIデザイン", "デザイン原則", "歴史"],
    memo: "2000年〜2026年のUIデザイントレンドをCRAP原則（Contrast/Repetition/Alignment/Proximity）と紐付けて分析。",
    publishedAt: "2026-04-10",
  },
  {
    id: "d8",
    categoryId: "techmap",
    topicId: "ai",
    title: "コンテキストエンジニアリング — AIエージェントのための情報設計技術",
    url: "https://techmap-context-engineering.surge.sh",
    tags: ["AI", "コンテキスト", "エージェント"],
    memo: "AIエージェントに渡す情報をどう設計するかを体系化。プロンプト・メモリ・RAGの関係を図解。",
    publishedAt: "2026-04-21",
  },
  {
    id: "d9",
    categoryId: "techmap",
    topicId: "automation",
    title: "進捗報告自動化ツール — GAS × Spreadsheet × LINE API（Techmap）",
    url: "https://techmap-progress-report-tool.surge.sh",
    tags: ["GAS", "LINE", "自動化"],
    memo: "GASとLINE APIを組み合わせた進捗報告自動化ツールの技術構成を図解。",
    publishedAt: "2026-04-21",
  },
  {
    id: "d15",
    categoryId: "tool",
    topicId: "tool-dashboard",
    title: "装置進捗報告 自動化ツール（ダッシュボード）",
    url: "https://progress-report-tool.surge.sh",
    tags: ["ダッシュボード", "自動化", "進捗管理"],
    memo: "装置の進捗状況を可視化するリアルタイムダッシュボード。GAS連携で自動更新。",
    publishedAt: "2026-04-21",
  },
  {
    id: "d10",
    categoryId: "techmap",
    topicId: "ai",
    title: "Claude Agent Skills ベストプラクティス完全ガイド",
    url: "https://techmap-claude-agent-skills.surge.sh",
    tags: ["Claude", "AI", "スキル設計"],
    memo: "ClaudeのAgentスキルを効果的に設計するためのベストプラクティスを網羅。",
    publishedAt: "2026-04-21",
  },
  {
    id: "d11",
    categoryId: "techmap",
    topicId: "ai",
    title: "Anthropic Skills 作成ベストプラクティス",
    url: "https://techmap-skill-authoring.surge.sh",
    tags: ["Claude", "スキル設計", "ベストプラクティス"],
    memo: "Anthropicのスキル執筆ルールをもとに、再利用性の高いスキルMD作成の要点を図解。",
    publishedAt: "2026-05-02",
  },
  {
    id: "d12",
    categoryId: "techmap",
    topicId: "ai",
    title: "AIの3つの壁 — アテンション・コンテキスト・オートリグレッション（技術者向け）",
    url: "https://techmap-ai-three-walls.surge.sh",
    tags: ["AI", "アーキテクチャ", "LLM"],
    memo: "LLMが越えられない3つの技術的限界（アテンション・コンテキスト・自己回帰）を技術者向けに図解。",
    publishedAt: "2026-05-17",
    seriesId: "ai-three-walls",
    audience: "technical",
  },
  {
    id: "d14",
    categoryId: "curiositymap",
    topicId: "curimap-ai",
    title: "AIの3つの越えられない壁 — ChatGPTはなぜ嘘をつくのか（一般向け）",
    url: "https://curimap-ai-three-walls.surge.sh",
    tags: ["AI", "ChatGPT", "初心者向け"],
    memo: "AIが嘘をつく理由を、難しい用語なしに文系・一般向けで分かりやすく図解。",
    publishedAt: "2026-05-17",
    seriesId: "ai-three-walls",
    audience: "general",
  },
  {
    id: "d17",
    categoryId: "techmap",
    topicId: "cursor",
    title: "Cursor Agents Window — エージェント中心開発の実践ガイド",
    url: "https://techmap-cursor-agents-window.surge.sh",
    tags: ["Cursor", "AI", "エージェント", "並列実行"],
    memo: "Cursor 3で登場したAgents Windowの全機能を解説。Local/Cloud Agent・worktree・/multitaskの使い分けとベストプラクティスを図解。",
    publishedAt: "2026-05-28",
    seriesId: "cursor-agents-window",
    audience: "technical",
  },
  {
    id: "d18",
    categoryId: "curiositymap",
    topicId: "curimap-cursor",
    title: "AI が自動でコードを書く時代 — Cursor Agents Window とは",
    url: "https://curimap-cursor-agents-window.surge.sh",
    tags: ["Cursor", "AI", "エージェント", "初心者向け"],
    memo: "複数のAIアシスタントに同時に仕事を頼める「Agents Window」を、日常のたとえ話でわかりやすく図解。非エンジニアにも伝わる一般向け解説。",
    publishedAt: "2026-05-28",
    seriesId: "cursor-agents-window",
    audience: "general",
  },
];
