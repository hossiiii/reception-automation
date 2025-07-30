# Reception Automation Web Application

タブレット端末で動作する受付自動化WEBアプリケーション。OpenAI Realtime APIを使用した音声対話により、アポイント有無に応じて異なるAIエージェントが対応します。

## 🚀 機能概要

- **2つの入り口**: アポイント有無で選択
- **音声AI対話**: OpenAI Realtime APIによる自然な音声やりとり
- **自動ロール切り替え**: 
  - アポイント有り → 来客対応用ロール（お礼の挨拶と呼び鈴案内）
  - アポイント無し → 営業対策ロール（丁寧かつ明確な断り対応）
- **Slack連携**: 会話履歴の自動送信
- **タブレット最適化**: タッチ操作に最適化されたUI
- **レスポンシブデザイン**: 縦向き・横向き対応

## 📋 必要な環境

- Node.js 18.17 以降
- npm または yarn
- OpenAI API キー（Realtime API有効）
- Slack Incoming Webhook URL
- HTTPS環境（音声機能に必要）

## 🛠 セットアップ

### 1. プロジェクトのクローンと依存関係のインストール

```bash
git clone <repository-url>
cd reception-automation
npm install
```

### 2. 環境変数の設定

`.env.local` ファイルを作成し、以下の内容を設定：

```bash
# OpenAI API設定
OPENAI_API_KEY=sk-your-openai-api-key-here

# Slack Webhook設定
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK

# アプリケーション設定
NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 環境設定
NODE_ENV=development
```

### 3. OpenAI API キーの取得

1. [OpenAI Platform](https://platform.openai.com/) にアクセス
2. API Keys セクションで新しいキーを作成
3. Realtime API へのアクセスが有効であることを確認

### 4. Slack Webhook URLの設定

1. Slack アプリを作成
2. Incoming Webhooks を有効化
3. 通知を送信したいチャンネルを選択
4. Webhook URL をコピー

### 5. 開発サーバーの起動

```bash
npm run dev
```

アプリケーションは http://localhost:3000 で起動します。

## 🏗 プロジェクト構造

```
reception-automation/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── realtime/      # OpenAI Realtime API接続
│   │   │   └── slack/         # Slack Webhook
│   │   ├── session/[sessionId]/ # セッション画面
│   │   ├── layout.tsx         # ルートレイアウト
│   │   ├── page.tsx          # ホーム画面
│   │   └── globals.css       # グローバルスタイル
│   ├── components/            # Reactコンポーネント
│   │   ├── ErrorBoundary.tsx # エラー境界
│   │   ├── LoadingSpinner.tsx # ローディング表示
│   │   └── SessionScreen.tsx # 音声対話画面
│   ├── hooks/                # カスタムフック
│   │   └── useRealtimeSession.ts # Realtime API管理
│   ├── lib/                  # ユーティリティ
│   │   ├── openai.ts        # OpenAI設定
│   │   └── prompts.ts       # システムプロンプト
│   └── types/               # TypeScript型定義
│       └── session.ts       # セッション関連型
├── public/                  # 静的ファイル
├── tailwind.config.js      # Tailwind CSS設定
├── next.config.js         # Next.js設定
└── tsconfig.json         # TypeScript設定
```

## 🔧 主要な設定ファイル

### Tailwind CSS設定 (`tailwind.config.js`)

タブレット向けに最適化された設定：
- タッチターゲットサイズ（最小44px）
- タブレット専用ブレークポイント
- グラスモーフィズム・ニューモーフィズム対応

### Next.js設定 (`next.config.js`)

- セキュリティヘッダー
- パフォーマンス最適化
- 本番環境対応

## 🚀 デプロイ

### Vercelへのデプロイ（推奨）

1. [Vercel](https://vercel.com) にプロジェクトをインポート
2. 環境変数を設定：
   - `OPENAI_API_KEY`
   - `SLACK_WEBHOOK_URL`
   - `NEXT_PUBLIC_BASE_URL` (デプロイ後のURL)
3. デプロイ実行

### 他のプラットフォーム

Node.js をサポートする任意のプラットフォームでデプロイ可能：
- Netlify
- Railway
- Render
- AWS Amplify

**重要**: 音声機能にはHTTPS環境が必要です。

## 🧪 テスト

### 基本テスト

```bash
# TypeScriptタイプチェック
npx tsc --noEmit

# ESLint
npm run lint

# ビルドテスト
npm run build
```

### API エンドポイントテスト

```bash
# セッション作成テスト
curl -X POST http://localhost:3000/api/realtime \
  -H "Content-Type: application/json" \
  -d '{"role": "visitor", "sessionId": "test-123"}'

# Slack Webhook テスト
curl -X POST http://localhost:3000/api/slack \
  -H "Content-Type: application/json" \
  -d '{"text": "Test message"}'
```

## 🔒 セキュリティ考慮事項

- API キーは環境変数で管理
- クライアントサイドでの機密情報露出を防止
- Slack Webhook URLの適切な管理
- HTTPS必須（音声API制約）
- レート制限遵守（Slack: 1msg/秒/チャンネル）

## 🎯 使用方法

### タブレット設定

1. タブレットを横向きまたは縦向きに設置
2. ブラウザでアプリケーションURLを開く
3. フルスクリーンモードに設定（推奨）
4. マイクアクセスを許可

### 日常運用

1. **来訪者対応**:
   - 来訪者が「アポイントお取りの方」をタッチ
   - AI が感謝の挨拶と呼び鈴案内を実行
   - 会話終了後、履歴がSlackに送信

2. **営業対策**:
   - 営業訪問者が「お取りでない方」をタッチ  
   - AI が丁寧かつ明確に断り対応
   - 適切な断り文で再訪問を抑制

## 🛠 カスタマイズ

### プロンプトの変更

`src/lib/prompts.ts` でAIの応答を調整可能：

```typescript
// 来客対応プロンプト
const VISITOR_PROMPT = `あなたは企業の受付AIアシスタントです...`

// 営業対策プロンプト  
const SALES_REJECTION_PROMPT = `アポイントのない営業訪問に対して...`
```

### UI のカスタマイズ

- `src/app/globals.css`: 全体のスタイル
- `tailwind.config.js`: カラーパレット、サイズ設定
- コンポーネント個別での調整

### 音声設定の変更

`src/lib/openai.ts` で音声パラメータを調整：

```typescript
export const DEFAULT_REALTIME_CONFIG = {
  voice: 'alloy', // 音声の種類
  turn_detection: {
    threshold: 0.5, // 音声検出の感度
    // ...
  }
}
```

## 🐛 トラブルシューティング

### よくある問題

**音声が認識されない**
- HTTPS環境で実行しているか確認
- マイクアクセス許可を確認
- ブラウザの音声設定を確認

**OpenAI API エラー**
- API キーの有効性を確認
- Realtime API へのアクセス権限を確認
- 利用制限・課金設定を確認

**Slack通知が届かない**
- Webhook URLの正確性を確認
- レート制限（1msg/秒）を確認
- Slackアプリの権限設定を確認

### ログの確認

開発環境：
```bash
# コンソールログの確認
npm run dev
# ブラウザの開発者ツールでネットワーク・コンソールタブを確認
```

本番環境：
- Vercelのファンクションログを確認
- ブラウザの開発者ツールでエラーを確認

## 📈 監視とメンテナンス

### 定期的な確認項目

- OpenAI API の使用量・課金状況
- Slack Webhook の動作状況
- セッション履歴の蓄積状況
- アプリケーションのパフォーマンス

### アップデート

依存関係の更新：
```bash
npm update
npm audit fix
```

## 📄 ライセンス

このプロジェクトのライセンス情報については、LICENSEファイルを参照してください。

## 🤝 サポート

- 技術的な問題: GitHub Issues
- 機能要求: GitHub Discussions
- セキュリティ報告: メールまたはプライベートレポート

---

**注意**: このアプリケーションは音声データを処理しますが、OpenAI の利用規約に従い、適切にデータが処理されることを確認してください。