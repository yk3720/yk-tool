# flowchart-web-mermaid

表データから **Mermaid フローチャート**をプレビューする Web アプリ（**ADR-010 比較用** · `yk-tool` リポジトリ内）。

**兄弟アプリ:** [`flowchart-web-reactflow`](../flowchart-web-reactflow/README.md)（React Flow 描画）

## 図モダリティ（YK 横断）

本アプリは **表 JSON → Mermaid DSL → ブラウザ描画**。レイアウトは **Mermaid エンジン**が担当（React Flow 版の Level/行座標とは異なる見え方になる — 比較の目的）。

| やりたいこと | 選ぶもの | SSOT |
|--------------|----------|------|
| 表 · CSV · Mermaid プレビュー（**比較**） | **本アプリ** | 本 README · `lib/flowchart/toMermaid.ts` |
| 表 · PNG/SVG（**React Flow レイアウト**） | **flowchart-web-reactflow** | [`REACTFLOW_RULES.md`](c:/yk-skill/rule/35_reactflow/REACTFLOW_RULES.md) |
| テキスト版管理 · `.mmd` | **Mermaid DSL** | [`MERMAID_RULES.md`](c:/yk-skill/rule/45_mermaid/MERMAID_RULES.md) §1.5 |

**正本:** Excel / ブラウザ内の **8列表**（ADR-010）  
**下書き:** `localStorage` キー `flowchart-web:draft-v1`（reactflow 版と互換）

## 起動

```bash
npm install
npm run dev      # http://localhost:3001
```

または `フローチャートを開く(Mermaid).bat`（ポート **3001**）

## コマンド

```bash
npm run test     # lib/flowchart（toMermaid 含む）
npm run build
```

## M003 比較手順（ADR-010）

[`flowchart-web-reactflow`](../flowchart-web-reactflow/README.md#m003-比較手順adr-010) と同じ Excel を **Excel ファイル…** で取込み、localhost:3000（RF）と :3001（本アプリ）で再生成して分岐・合流を見比べる。

## ディレクトリ

| パス | 内容 |
|------|------|
| `lib/flowchart/` | ドメイン層（reactflow 版と同型 · `toMermaid` がアダプタ） |
| `components/flowchart/` | 表 UI · Mermaid プレビュー |
| `fixtures/` | サンプル JSON |

## 企画 SSOT

`c:/yk-memo/00.ai-driven-school/個人テーマ_フローチャートアプリ/`

**索引:** [`RULE_INDEX.md`](c:/yk-skill/rule/RULE_INDEX.md) · `catalog.yaml` の `flowchart-web-mermaid`
