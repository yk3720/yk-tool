# Playwright 使い方ガイド

作成日：2026-05-02

---

## Playwright とは？

**ブラウザを自動で操縦できるツール。**  
クリック・文字入力・スクリーンショット・テストを、コマンド1つで自動実行できる。

```
あなた
  │
  │  npm run ○○  ← コマンド1つ打つだけ
  ▼
Playwright（ブラウザリモコン）
  │
  │  自動でブラウザを起動して操作する
  ▼
Chrome（画面なし・高速）
  │
  ├─ ページを開く
  ├─ 要素の存在を確認する（テスト）
  ├─ 文字を入力する
  └─ スクリーンショットを撮る
```

### このガイドで登場する略語

| 略語 | 正式名称 | 意味 |
|---|---|---|
| GAS | Google Apps Script | Googleが提供するサーバー側スクリプト。今回はレポートを自動生成するのに使っている |
| `.spec.ts` | specification TypeScript | テストを記述するファイル。「仕様（spec）を確認するコード」という意味 |
| npm | Node Package Manager | Node.js のパッケージ管理ツール。`npm run ○○` でコマンドを実行できる |

---

## 前提条件（使い始める前に確認）

以下がPCに入っていることを確認する。

| 必要なもの | 確認コマンド | 正常な例 |
|---|---|---|
| Node.js | `node --version` | `v24.0.0` など |
| npm | `npm --version` | `11.0.0` など |

### 初回のみ：依存パッケージとブラウザをインストール

このプロジェクトをはじめて使うときだけ実行する。

```powershell
cd c:\yk-tool\playwright-test

# パッケージをインストール
npm install

# Playwright用のブラウザ（Chromium）をダウンロード（約180MB）
npx playwright install chromium
```

完了したら以下のコマンドが使えるようになる。

---

## フォルダ構成

```
c:\yk-tool\playwright-test\
│
├── auth\
│   ├── setup.js        ← Googleログイン保存（初回だけ実行）
│   └── session.json    ← 保存済みログイン状態（自動生成）⚠️要注意
│
├── tests\
│   ├── gas-report.spec.ts    ← GASレポートのテスト（7本）
│   ├── screenshot.spec.ts    ← スクリーンショット自動保存
│   ├── spreadsheet.spec.ts   ← スプレッドシート自動入力
│   └── screenshots\
│       └── 2026-05-02\       ← 実行した日付のフォルダが自動生成される
│           ├── report-pc.png
│           ├── report-mobile.png
│           └── report-tablet.png
│
├── package.json         ← コマンド定義（npm run ○○ の中身はここに書いてある）
├── playwright.config.ts ← Playwright設定
└── tsconfig.json        ← TypeScript設定
```

### npm run ○○ の仕組み

```
あなたが打つコマンド         package.json の中身
─────────────────────────────────────────────────
npm run screenshot   →   playwright test tests/screenshot.spec.ts
npm test             →   playwright test
npm run spreadsheet  →   playwright test tests/spreadsheet.spec.ts
```

`package.json` を開くと `"scripts"` の欄に対応が書いてある。

---

## コマンド一覧

すべて `c:\yk-tool\playwright-test` フォルダで実行する。

```powershell
cd c:\yk-tool\playwright-test
```

| コマンド | 何をするか | 実行場所 |
|---|---|---|
| `npm test` | GASレポートの品質テスト（7項目） | Cursorターミナル可 |
| `npm run screenshot` | スクリーンショットを日付フォルダに保存 | Cursorターミナル可 |
| `node auth/setup.js` | Googleログイン状態を保存（初回のみ） | **PowerShell（別窓）で実行** |
| `npm run spreadsheet` | スプレッドシートに自動入力 | Cursorターミナル可 |

> **「Cursorのターミナル」と「別窓のPowerShell」を使い分ける理由**  
> `node auth/setup.js` はブラウザを画面ありで起動してユーザーの入力を待つ処理が必要。  
> Cursorのサンドボックス環境ではブラウザが起動できないため、通常のPowerShellで実行する。

---

## 使い方 1：スクリーンショットを自動保存する

### 目的
GASのHTMLレポートをPC・スマホ・タブレットの3サイズで自動撮影・保存する。  
GASのコードを修正したとき、見た目が変わっていないか記録するためにも使える。

### 手順

```
1. ターミナルを開く（Ctrl + ` または メニュー → Terminal → New Terminal）
      │
      ▼
2. フォルダに移動
   cd c:\yk-tool\playwright-test
      │
      ▼
3. コマンドを実行
   npm run screenshot
      │
      ▼
4. 完了（約25秒）
   tests/screenshots/【今日の日付】/  ← 実行した日付のフォルダが自動で作られる
     ├── report-pc.png      （PC: 1280×800）
     ├── report-mobile.png  （スマホ: 390×844）
     └── report-tablet.png  （タブレット: 768×1024）
```

> 📅 フォルダ名は**実行した日の日付**になる。毎日実行すれば日々の記録が溜まっていく。  
> 例：5月3日に実行 → `screenshots/2026-05-03/` フォルダに保存される。

### 実行結果の例
```
✅ PC版:          tests\screenshots\2026-05-02\report-pc.png
✅ スマホ版:      tests\screenshots\2026-05-02\report-mobile.png
✅ タブレット版:  tests\screenshots\2026-05-02\report-tablet.png
```

---

## 使い方 2：GASレポートのテストを実行する

### 目的
GASのHTMLレポートが正しく表示されているか、7項目を自動でチェックする。  
GASのコードを修正した後に「壊れていないか」確認するのに使う。

### チェック項目（7本）

```
テスト1：ページタイトルが「進捗報告」を含むか
テスト2：サマリーカードの5つの数値が表示されているか
テスト3：ガントチャートが1行以上表示されているか
テスト4：定期作業テーブルが1行以上表示されているか
テスト5：不具合テーブルが1行以上表示されているか
テスト6：装置フィルターボタンのクリックが動くか
テスト7：PC・スマホのスクリーンショットが保存できるか
```

### 手順

```powershell
npm test
```

### 成功時の例
```
✅ レポートタイトル: 【進捗報告】成形加工装置 / ﾚｰｻﾞ加工装置
✅ #sumDone = "0" / #sumTotal = "12" / #sumProg = "12"
✅ ガントチャート行数: 12
✅ 定期作業テーブル 行数: 13
✅ 不具合テーブル 行数: 9
✅ 成形加工装置フィルターが機能しました

7 passed (13.4s)  ← 全テスト合格
```

### 失敗時の例
```
x テスト3: ガントチャートが存在する  ← ✗ がついたテストだけ壊れている
  Expected: visible
  Error: element(s) not found   ← ガントチャートが画面に見つからなかった
```

---

## 使い方 3：スプレッドシートに自動入力する

### 初回セットアップ（1回だけ）

Googleアカウントのログイン状態を保存する必要がある。  
**Cursorのターミナルではなく、Windowsの別のPowerShellウィンドウで実行すること。**

```
【初回だけ】Googleログイン状態を保存する手順

1. Windowsスタートメニューから「PowerShell」を検索して起動
      │  ※ Cursor のターミナルは不可
      ▼
2. フォルダに移動
   cd c:\yk-tool\playwright-test
      │
      ▼
3. セットアップ実行
   node auth/setup.js
      │
      ▼
4. Chromeが自動で開いてスプレッドシートが表示される
   → Googleアカウントにログインする
   → スプレッドシートの「セルの表（格子）」が表示されるまで待つ
      │
      │  ⚠️ 格子が見えてからEnter！ログイン途中でEnterを押すと失敗する
      ▼
5. PowerShellに戻って Enter キーを押す

      ▼
6. 完了メッセージを確認
   ✅ セッションを保存しました: auth/session.json
```

### 2回目以降（自動入力を実行）

```powershell
npm run spreadsheet
```

### セッションが切れた場合

```
症状：npm run spreadsheet を実行するとログイン画面が出る
対処：node auth/setup.js を再実行してログインし直す
周期：数週間〜数ヶ月で期限切れになる
```

### ⚠️ session.json の取り扱い注意

`auth/session.json` にはGoogleのログイン状態（クッキー）が保存されている。

```
❌ やってはいけないこと
   - GitHubなどに公開リポジトリとしてアップロードする
   - 他人に渡す・共有PCで使う
   → Googleアカウントに不正アクセスされる可能性がある

✅ 安全な運用
   - このPCのこのフォルダにだけ保管する
   - 不要になったら削除する（再度 setup.js を実行すれば再生成できる）
```

---

## カスタマイズ：URLやセルを変えたいとき

### テスト対象のGASレポートURLを変更する

`tests/gas-report.spec.ts` と `tests/screenshot.spec.ts` の先頭にある定数を変更する。

```typescript
// この URL を自分のGASのURLに変える
const REPORT_URL =
  'https://script.google.com/macros/s/【ここを変更】/exec';
```

### スプレッドシートのURLや入力セルを変更する

`tests/spreadsheet.spec.ts` の先頭と入力部分を変更する。

```typescript
// スプレッドシートのURL
const SPREADSHEET_URL =
  'https://docs.google.com/spreadsheets/d/【ここを変更】/edit';

// 入力先のセル番地（例：E2 → F3 に変えたい場合）
await page.keyboard.type('F3');  // ← ここを変える
```

---

## トラブルシューティング

### ❌ `Test timeout of 30000ms exceeded`（タイムアウト）

**原因：** Googleスプレッドシートは常時通信しているため `networkidle`（通信が止まる状態）にならない

**修正箇所：** `tests/spreadsheet.spec.ts` 内の `waitUntil` を変更
```javascript
// ❌ スプレッドシートでは使えない
await page.goto(URL, { waitUntil: 'networkidle' });

// ✅ これを使う
await page.goto(URL, { waitUntil: 'load' });
```

---

### ❌ Googleログインで「安全でない可能性があります」が出る

**原因：** PlaywrightのChromiumは「自動化ツール」と判定されてGoogleにブロックされる  
（Googleはセキュリティ上、自動化ブラウザからのログインを制限している）

**対処：** `auth/setup.js` に対策済み（変更不要）
```javascript
args: ['--disable-blink-features=AutomationControlled'], // 自動化フラグを隠す
ignoreDefaultArgs: ['--enable-automation'],              // 自動化バナーを非表示
```

---

### ❌ テストで `Sign in` ページが表示されてログインできない

**原因：** `auth/session.json` がログイン完了前に保存されている（未ログイン状態のクッキー）

**対処：** `node auth/setup.js` を再実行し、スプレッドシートの表が表示されてからEnter

---

### ❌ `TypeError: page.keyboard.selectAll is not a function`

**原因：** Playwright に `selectAll()` メソッドは存在しない

**修正箇所：** `tests/spreadsheet.spec.ts`
```javascript
// ❌ 存在しないAPI
await page.keyboard.selectAll();

// ✅ 正しい書き方（Playwright公式ドキュメント準拠）
await page.keyboard.press('Control+a');
```

---

## 技術メモ：GAS レポートの iframe 構造

GASのページはブラウザ内部で3層のiframeになっている。  
テストコードから中身にアクセスするには `frames()[2]` を使う必要がある。

```
ブラウザ（Playwright が操作する画面）
  │
  └── frame[0] : GAS外側ラッパー（script.google.com/…/exec）
        │
        └── frame[1] : userCodeAppPanel（中間ラッパー）
              │
              └── frame[2] : 実際のHTMLコンテンツ ★ここを操作する
                    │
                    ├── #reportTitle         ← レポートタイトル
                    ├── #sumDone, #sumProg   ← サマリーカードの数値
                    ├── .gantt-row           ← ガントチャートの各行
                    ├── .rpt-tbl-planned     ← 定期作業テーブル
                    └── .rpt-tbl-trouble     ← 不具合テーブル
```

```javascript
// テストコードでのアクセス方法
await page.goto(GAS_URL, { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(2000); // iframe の読み込みを待つ

const frame = page.frames()[2]; // 実際のコンテンツはここ
const title = frame.locator('#reportTitle');
await expect(title).toBeVisible();
```

---

## 次のステップ（もっと学びたい場合）

- [Playwright 公式ドキュメント](https://playwright.dev/docs/intro)（英語）
- **`npx playwright codegen [URL]`** を実行すると、ブラウザを手動で操作するだけでテストコードを自動生成してくれる（コード生成機能）
