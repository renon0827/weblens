# weblens - プロジェクト概要

## 目的
Webアプリケーションの画面要素を視覚的に選択し、Claude Code CLIを通じてAIに改修依頼を送信できるシステム。

## ユースケース
1. 開発者がローカルでWebアプリケーションを開発中
2. 画面上の特定要素を選択し「このボタンの色を青に変更して」等の依頼
3. AIが該当コードを特定し、自動で修正を実施

## システム構成
- **Chrome拡張機能** (`packages/extension/`): ユーザーインターフェースと要素選択機能を提供
- **Webサーバー** (`packages/server/`): 拡張機能とClaude Code CLI間の中継を担当
- **データ** (`packages/data/`): 会話データの永続化

## 技術スタック

### 共通
- **言語**: TypeScript 5.x
- **ビルドツール**: Vite 5.x
- **パッケージ管理**: npm workspaces (モノレポ)
- **コード品質**: ESLint + Prettier

### Chrome拡張機能
- **マニフェスト**: Manifest V3
- **UIフレームワーク**: Preact 10.x
- **スタイリング**: CSS Modules
- **状態管理**: Preact Signals

### Webサーバー
- **ランタイム**: Node.js 20.x LTS
- **HTTPサーバー**: Fastify 4.x
- **WebSocket**: ws 8.x
- **プロセス実行**: Node.js child_process (spawn)

## ディレクトリ構成

```
weblens/
├── packages/
│   ├── extension/        # Chrome拡張機能
│   │   └── src/
│   │       ├── background/     # Service Worker
│   │       ├── content/        # Content Script (要素選択)
│   │       ├── sidepanel/      # Side Panel UI (Preact)
│   │       ├── shared/         # 共通型定義
│   │       └── utils/          # ユーティリティ
│   ├── server/           # Webサーバー
│   │   └── src/
│   │       ├── api/            # REST APIルート
│   │       ├── ws/             # WebSocketハンドラ
│   │       ├── claude/         # Claude CLI連携
│   │       ├── storage/        # ファイル永続化
│   │       └── utils/          # ユーティリティ
│   └── data/             # 永続化データ
│       └── conversations/      # 会話JSONファイル
├── package.json          # ルートpackage.json (npm workspaces)
├── tsconfig.base.json    # 共通TypeScript設定
├── .eslintrc.js
├── .prettierrc
└── spec.md               # 詳細仕様書
```

## サーバー設定
- **ホスト**: localhost
- **HTTPポート**: 3456
- **WebSocketパス**: /ws
