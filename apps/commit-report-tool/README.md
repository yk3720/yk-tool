# コミットレポートツール

GitHubのコミットをAIで分析し、図解レポートをSlackに自動投稿するツールです。愛称は「コミネコ」。

このツールは GitHub のコミット履歴を分析してレポートを生成します。**Git でコミットする運用が前提**で、Google ドライブやローカル保存など他の方法では使えません。

```
┌──────────────────────────────────────────────────────────────┐
│  📊 昨日の開発レポート                     2026-01-15        │
│                                                              │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐              │
│  │  5 commits │ │ 2 branches │ │ 3 members  │              │
│  └────────────┘ └────────────┘ └────────────┘              │
│                                                              │
│  ⭐ ハイライト                                               │
│  • ログインページのデザインを刷新                              │
│  • 検索機能の応答速度が向上                                    │
│                                                              │
│  🐱 コミネコ で自動生成                                       │
└──────────────────────────────────────────────────────────────┘
```

Slackにはこのような図解レポートの画像が毎朝届きます。

---

## 全体像

セットアップに入る前に、全体の構成を把握してください。

```
あなたの GitHub アカウント
├── commit-report-tool   ← このツール本体（GitHub Actions が毎朝動く）
└── your-project         ← 監視対象（あなたが開発しているリポジトリ）
```

この2つのリポジトリと、3つの外部サービスを組み合わせて動きます。

```
commit-report-tool（GitHub Actions）
    │
    ├→ GitHub API で your-project のコミットを取得
    ├→ Claude API（Anthropic）でコミットを分析・図解生成
    └→ Slack API で図解レポートの画像を投稿
```

セットアップでは「ツール本体を GitHub に置く → 監視対象を設定する → 3つのAPIキーを登録する → 実行」の順に進めます。

---

## 料金について

このツールで使う外部サービスの料金です。

| サービス | 用途 | 料金 |
|---|---|---|
| GitHub Actions | 定期実行（トリガー） | 毎月 2,000 分無料 |
| GitHub API | コミットデータ取得 | 無料（5,000 リクエスト/時） |
| Claude API | AIによる分析・図解生成 | 事前チャージ制・従量課金（1回あたり約 $0.05〜0.20、$5 で約25〜100回分） |
| Slack | レポート画像の通知先 | 無料ワークスペースで可 |

---

## このツールの4パーツ

第3回講義で学んだ「4パーツ」が、このツールではどのファイルに対応しているかを示します。

```
┌─────────────┐
│  トリガー     │  .github/workflows/daily-report.yml
│  （いつ動く） │  → 手動実行（定期実行はカスタマイズで有効化）
└──────┬──────┘
       ▼
┌─────────────┐
│  ソース元    │  .claude/skills/github-api/scripts/
│  （データ）  │  → GitHub API からコミットを取得
└──────┬──────┘
       ▼
┌─────────────┐  .claude/skills/code-analyzer/      ← ビジネス視点で分析
│  処理する場所 │  .claude/skills/diagram-guidelines/ ← HTML図解を生成
│  （加工）    │  .claude/skills/screenshot-capture/ ← 画像に変換
└──────┬──────┘
       ▼
┌─────────────┐
│  届ける先    │  .claude/skills/slack-formatting/scripts/
│  （配信）    │  → Slack に画像付きで投稿
└─────────────┘
```

---

## ファイル構成

```
.claude/
├── prompts/
│   └── daily-report.md              # メイン処理フロー
└── skills/
    ├── code-analyzer/               # ビジネス視点での分析ルール
    ├── config-reader/               # 設定ファイルの読み方
    ├── diagram-guidelines/          # HTML図解のデザイン
    │   └── examples/                # お手本HTML（5種類）
    ├── github-api/                  # GitHub API 操作
    │   └── scripts/                 # コミット取得スクリプト
    ├── screenshot-capture/          # スクリーンショット撮影
    │   └── scripts/                 # Playwright スクリプト
    └── slack-formatting/            # Slack投稿
        └── scripts/                 # 画像まとめ投稿スクリプト

configs/
├── repos/your-repo.yml             # リポジトリ構造定義
└── projects/your-project.yml       # プロジェクト設定

.github/workflows/
├── daily-report.yml                # GitHub Actions 定義
└── report-job.yml                  # 再利用ワークフロー
```

---

## セットアップ

### 準備するもの

- **GitHub アカウント**
- **Slack ワークスペース**（無料プランで可）
- **Anthropic Console のアカウント + クレジットチャージ済み**（後述の Part D で使います）

Anthropic Console（https://console.anthropic.com/）でアカウントを作成し、Billing（https://console.anthropic.com/settings/billing）で **$5 以上チャージ** しておいてください。チャージしないとツールが動きません。

> このツールは GitHub Actions が全自動で実行します。あなたのPCで `npm install` を実行する必要はありません。

### Part A: ツール本体を GitHub に置く

このツールのコードを、あなたの GitHub アカウントにアップロードします。

#### 手順1: GitHub に新しいリポジトリを作る

1. https://github.com/new にアクセス
2. **Repository name** に `commit-report-tool` と入力
3. **Private** を選択（APIキーの設定を含むため、必ず Private にしてください）
4. 「Add a README file」のチェックは**外したまま**にする
5. 「Create repository」をクリック

#### 手順2: コードを GitHub にアップロードする

Cursor で AI に以下のように依頼してください:

> 「このコードを GitHub にpushして。リポジトリは `あなたのユーザー名/commit-report-tool` です」

AI が `git remote add` と `git push` を実行してくれます。完了したら GitHub のリポジトリページを開いて、ファイルが表示されていることを確認してください。

### Part B: 監視対象のリポジトリを設定する

レポートの対象にしたいリポジトリの情報を設定します。

#### 監視対象のリポジトリがまだない場合

GitHub で新しいリポジトリを作ってください。

1. https://github.com/new にアクセス
2. **Repository name** に好きな名前を入力（例: `my-web-app`）
3. **Private** を選択
4. **「Add a README file」にチェックを入れる** — コミットが1件もないとレポートを生成できないため、最初のコミットを自動で作ります
5. 「Create repository」をクリック

#### 設定ファイルを書き換える

**2行だけ書き換えてください。** 残りはそのままで動きます。

`configs/repos/your-repo.yml` を開いて:

```yaml
repository:
  owner: your-username   # ← ここをあなたのGitHubユーザー名に
  name: your-web-app     # ← ここを監視したいリポジトリ名に
```

GitHubのURL が `https://github.com/yamada-taro/my-app` であれば、`owner` は `yamada-taro`、`name` は `my-app` です。

これだけでリポジトリ全体のコミットがレポート対象になります。
アプリ別の分類が必要な場合は「カスタマイズ」セクションで設定します。

### Part C: Slack App を作成する

1. https://api.slack.com/apps にアクセスし「Create New App」をクリック
2. 「From scratch」を選択し、アプリ名（例: コミネコ）とワークスペースを設定
3. 左メニュー「OAuth & Permissions」→ Bot Token Scopes に以下を追加:
   - `files:write`
   - `chat:write`
4. 「Install to Workspace」→ 許可する
5. 表示される **Bot User OAuth Token**（`xoxb-` で始まる）をコピー
6. レポートを投稿したいチャンネルにボットを追加（チャンネル設定 → インテグレーション → アプリを追加）
7. チャンネルの **チャンネルID** を確認（チャンネル名を右クリック → チャンネル詳細 → 最下部に表示）

### Part D: GitHub Secrets を設定する

4つのシークレットを取得して、GitHub に登録します。各キーは**取得したらすぐメモ帳に貼り付けてください。画面を閉じると二度と表示されないものがあります。**

GitHub Secrets の登録先: リポジトリの Settings → Secrets and variables → Actions → New repository secret

#### Secret 1: `ANTHROPIC_API_KEY`（Claude API キー）

> **注意**: 普段使っている Claude.ai（チャット画面）と Anthropic Console（API管理画面）は別のサービスです。APIキーの取得は console.anthropic.com で行います。Claude.ai の有料プランに加入していても、API利用料は別途チャージが必要です。

1. https://console.anthropic.com/settings/keys にアクセス
2. 「Create Key」をクリック → 名前（例: `komineko`）を入力して作成
3. 表示された `sk-ant-...` で始まるキーを**メモ帳に貼り付けて保存**
4. GitHub Secrets に `ANTHROPIC_API_KEY` として登録

> 「準備するもの」でチャージ済みですか？まだの場合は https://console.anthropic.com/settings/billing で $5 以上チャージしてください。チャージしないとツール実行時にエラーになります。

#### Secret 2: `GH_TOKEN`（GitHub Personal Access Token）

1. https://github.com/settings/tokens/new にアクセス
2. **Note** に `komineko` と入力
3. **Expiration** は `90 days` でOK
4. **Select scopes** で **`repo`** にチェック（リポジトリのスコープ。一番上にあります）
5. 「Generate token」をクリック
6. 表示された `ghp_...` で始まるトークンを**メモ帳に貼り付けて保存**
7. GitHub Secrets に `GH_TOKEN` として登録

#### Secret 3: `SLACK_BOT_TOKEN`

Part C でコピーした Bot User OAuth Token（`xoxb-` で始まる文字列）を GitHub Secrets に `SLACK_BOT_TOKEN` として登録してください。

#### Secret 4: `SLACK_CHANNEL`

Part C で確認したチャンネルID（`C` で始まる文字列）を GitHub Secrets に `SLACK_CHANNEL` として登録してください。

### Part E: ローカル検証（オプション）

GitHub Actions を動かす前に、設定が正しいか確認できます。Part B で設定した `owner` と `name` の値を使ってください。

**macOS / Linux:**
```bash
# Node.js が必要です（AIに「Node.jsをインストールして」と依頼してください）
GH_TOKEN=あなたのトークン node .claude/skills/github-api/scripts/get-commits.js あなたのユーザー名 リポジトリ名
```

**Windows（コマンドプロンプト）:**
```cmd
set GH_TOKEN=あなたのトークン
node .claude/skills/github-api/scripts/get-commits.js あなたのユーザー名 リポジトリ名
```

コミットデータが表示されれば「ソース元」の設定は正しいです。

### Part F: GitHub Actions を実行する

1. リポジトリの「**Actions**」タブを開く
2. **左サイドバー**から「**Daily Commit Report**」（または `.github/workflows/daily-report.yml`）をクリック
3. 画面**右上**の「**Run workflow**」ボタンをクリック → ドロップダウンが開くので、緑の「**Run workflow**」ボタンをクリック
4. 黄色（実行中）の表示が出たら、数分待ってください
5. 緑（成功）になったら Slack にレポートが届きます

> 過去に失敗した実行が赤く表示されていることがありますが、それは古い記録です。新しく「Run workflow」で実行すれば問題ありません。

### チェックポイント

- [ ] Slack チャンネルに図解レポートの画像が届いた
- [ ] レポートに自分のリポジトリのコミット情報が含まれている

---

## アーキテクチャ

このツールは Claude Code の **Skills** 機能を活用しています。各スキルが特定の役割を担い、メインプロンプト（`daily-report.md`）がそれらを順番に呼び出します。

```
daily-report.md（メイン処理フロー）
    │
    ├→ config-reader      設定ファイルを読み込む
    ├→ github-api          コミットデータを取得する
    ├→ code-analyzer       ビジネス視点で要約する
    ├→ diagram-guidelines  HTML図解を生成する
    ├→ screenshot-capture  HTMLをPNG画像に変換する
    └→ slack-formatting    Slackに画像を投稿する
```

### 生成されるレポート（5種類）

| レポート | 内容 |
|---|---|
| **昨日の開発** | 統計情報（コミット数、ブランチ数）とハイライト |
| **ブランチ詳細** | 各ブランチの作業内容（1ブランチ1枚） |
| **アプリ別** | アプリごとにグループ化された変更一覧 |
| **タイムライン** | 時系列での作業履歴 |
| **ワンポイントTIPS** | 変更内容に関連する豆知識（オプション） |

### 設定ファイルの2層構造

```
configs/repos/your-repo.yml     ← リポジトリ内のアプリを定義（共有）
         ↑ 参照
configs/projects/your-project.yml ← どのアプリを対象にするか（個別）
```

この分離により、1つのリポジトリ定義を複数のプロジェクトから参照できます。

---

## カスタマイズ

### アプリ別の分類を設定する（モノレポ対応）

`configs/repos/your-repo.yml` の `apps` セクションを編集:

```yaml
apps:
  - id: your-app
    path: "src/app/"         # ← このディレクトリのコミットが対象
    name: "あなたのアプリ名"
    short_name: "App"
    icon: "smartphone"       # Lucide アイコン名
    color: "blue"            # Tailwind CSS 色名
    category: "main"
```

不要なアプリ定義は行ごと削除してください。

### 定期実行を有効にする

`.github/workflows/daily-report.yml` の `schedule` ブロック（2行）のコメントを外す:

変更前:
```yaml
  # schedule:
  #   - cron: '0 22 * * *'  # 毎日7:00 JST（有効にするにはコメントを外す）
```

変更後:
```yaml
  schedule:
    - cron: '0 22 * * *'  # 毎日7:00 JST
```

`# ` を削除するとき、**先頭のスペース（インデント）はそのまま残してください**。`schedule:` の前にスペース2つ、`- cron:` の前にスペース4つが必要です。時刻は UTC で指定します（`0 22 * * *` = 日本時間 翌7:00）。

### ワンポイントTIPSを無効にする

`configs/projects/your-project.yml`:

```yaml
tips:
  enabled: false
```

### 図解のデザインを変更する

`.claude/skills/diagram-guidelines/examples/` 内のHTMLを編集すると、Claudeが生成するレポートのデザインが変わります。

---

## セキュリティ

- **リポジトリは Private に**: APIキーが含まれるため、公開リポジトリにしないでください
- **GitHub Secrets**: すべてのAPIキーは GitHub Secrets に保存されます。コードに直接書かないでください
- **Slack Bot Token**: Bot Token Scopes は `files:write` と `chat:write` のみに制限してください
- **GH_TOKEN**: Personal Access Token は `repo` スコープのみ必要です

---

## 困ったとき

1. **まずAIに聞く**: Cursorで「セットアップで〇〇のエラーが出ました」と伝えてください
2. **GitHub Actions のログを確認**: Actions タブ → 失敗したジョブ → ログを読む
3. **よくある問題**:
   - 「**Credit balance is too low**」→ Anthropic Console（https://console.anthropic.com/settings/billing）でクレジットをチャージする。APIキーがあってもチャージしないと動きません
   - 「**404 エラー**で Secrets の設定ページが開けない」→ ツール本体のリポジトリが GitHub に push されていない可能性があります。Part A を確認してください
   - 「**Actions 画面がずっと赤い**」→ 過去の失敗記録が残っているだけです。新しく「Run workflow」で実行してください
   - 「コミットがない」→ 対象日のコミットがないか、リポジトリ名が間違っている
   - 「not_authed」→ SLACK_BOT_TOKEN が間違っているか期限切れ
   - 「Bad credentials」→ GH_TOKEN が間違っているか期限切れ
4. **Slackで相談**: ADS Slackの質問チャンネルに投稿してください

---

## 技術スタック

| 項目 | 選定 | 理由 |
|---|---|---|
| 実行基盤 | GitHub Actions | 無料枠2,000分/月、並列Job対応 |
| AI実行 | Claude Code Action | Skills機能で知識を分離・再利用 |
| 図解生成 | HTML + Tailwind CSS | Claude が生成しやすく、デザイン品質が高い |
| スクリーンショット | Playwright | Headless対応、GitHub Actionsで動作確認済み |
| 通知 | Slack API | 複数画像をまとめて投稿可能 |

---

## 参考

- [Claude Code Skills](https://docs.anthropic.com/en/docs/claude-code/skills)
- [Claude Code Action](https://github.com/anthropics/claude-code-action)
- [Slack API - files.getUploadURLExternal](https://api.slack.com/methods/files.getUploadURLExternal)
