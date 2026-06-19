# ローカル開発 — ブラウザの開き方

**目的:** `localhost` 確認時に Cursor **内部ブラウザ**で PC が重くなる事象を避ける。

**Playwright / Vitest / build には影響しません**（Playwright は独自 Chromium を起動）。

---

## 1. Cursor 設定（一度だけ · 推奨）

1. **Cursor Settings** → **Tools & MCP**
2. **Show Localhost Links in Browser** → **OFF**
3. （任意）**Browser Automation** → **Browser Tab 以外**（表示名 Chrome = 既定の外部ブラウザ）
4. **Cursor を再起動**
5. ターミナルで `http://localhost:3000/login` を Ctrl+Click → **Chrome / Edge** で開くか確認

> `workbench.externalBrowser` だけでは localhost に効かないことがあります（[Cursor Forum](https://forum.cursor.com/t/how-to-restore-follow-link-functionality-with-external-browser/144525)）。

---

## 2. アプリの開き方（毎回）

| 方法            | 手順                                                                                   |
| --------------- | -------------------------------------------------------------------------------------- |
| **bat（推奨）** | `フローチャートを開く.bat` — OS 既定ブラウザで `/login` を開く                         |
| **手動**        | `npm run dev` または `npm run start` 後、**Chrome / Edge のアドレスバー**に URL を貼る |

```text
http://localhost:3000/login
http://localhost:3000/dev/style   # スタイルガイド見本（開発のみ · 本番 404）
```

| やらない                                         | 理由                             |
| ------------------------------------------------ | -------------------------------- |
| Cursor チャットの **localhost リンクをクリック** | 内部 Browser Tab になりやすい    |
| Cursor **内部ブラウザ**で重いアプリを長時間開く  | Renderer メモリ増 · 固まりやすい |

---

## 3. 起動コマンド

| コマンド                             | 用途                                                        |
| ------------------------------------ | ----------------------------------------------------------- |
| `npm run dev`                        | 日常開発（Turbopack · 初回は重め）                          |
| `npm run build` → `npm run start`    | 本番同等 · **PC が重いとき / 久しぶりの確認**               |
| `npm run build` → `npm run test:e2e` | Playwright 全件（`:3001` · `AUTH_DISABLED=1` · 品質ゲート） |

**Supabase なしの日常 dev:** `.env.local` に `AUTH_DISABLED=1` を設定（URL 未設定だけでは認証バイパスになりません）。
| `npm run test:e2e:labels` | Yes ラベルと縦線の重なりだけ（`e2e/edge-label-placement.spec.ts`） |
| `npx playwright test e2e/import-bundle.spec.ts` | import.json 取込 UI（`IMPORT_E2E_STUB=1` · DB 不要） |

**import.json E2E:** Playwright 起動時のみ `IMPORT_E2E_STUB=1` で Server Action が RPC をスキップします。本番・通常 dev には影響しません。dev Supabase への実取込確認は手動（Runbook §4）。

初回 or コード変更後は **`npm run build`** を挟んでから E2E を実行する（`playwright.config` は `next start` を使う）。

**Yes/No ラベルが線の上の白 pill のまま見えるとき:** dev を再起動 → **Ctrl+Shift+R** → 左ナビでモジュールを開き直す（保存 edges の再生成が走る）。詳細は `c:/yk-skill/rule/35_reactflow/REACTFLOW_RULES.md` §5.6-4。

---

## 4. 固まりそうなとき

1. ブラウザタブを閉じる
2. ターミナルで **Ctrl+C**（サーバー停止）
3. 次回は `npm run start` を試す

---

## 参照

- [README.md §起動](../README.md)
- 企画 [AGENTS.md](c:/yk-memo/00.ai-driven-school/個人テーマ_フローチャートアプリ/AGENTS.md) — ローカル確認
- [design-system.md](./design-system.md) — スタイルガイド索引
