# weblens

Web要素を選択してClaude Codeに改修依頼を送信できるChrome拡張機能とWebサーバーのシステム。

## 必要条件

- Node.js 20.x 以上
- npm 9.x 以上
- Claude Code CLI（`claude`コマンド）がインストール済みであること

## セットアップ

```bash
# 依存関係のインストール
npm install

# サーバーの起動（開発モード）
npm run dev:server

# 拡張機能のビルド（開発モード - 別ターミナルで）
npm run dev:extension
```

## 拡張機能のインストール

1. Chrome で `chrome://extensions` を開く
2. 「デベロッパーモード」を有効化（右上のトグル）
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `packages/extension/dist` フォルダを選択

## 使い方

1. サーバーを起動した状態で、任意のWebページを開く
2. 右クリックメニューから「weblensで開く」を選択
3. Side Panelが開いたら「要素を選択」ボタンをクリック
4. ページ上の要素をクリックして選択（複数選択可）
5. Escキーで選択モードを終了
6. メッセージを入力して送信

## プロジェクト構成

```
weblens/
├── packages/
│   ├── server/          # Webサーバー（Fastify + WebSocket）
│   └── extension/       # Chrome拡張機能（Preact）
├── package.json         # ルートパッケージ（npm workspaces）
└── README.md
```

## 本番ビルド

```bash
# 全パッケージビルド
npm run build

# 拡張機能のみ
npm run build:extension

# サーバーのみ
npm run build:server
```

## 技術スタック

- **サーバー**: Node.js, Fastify, WebSocket (ws)
- **拡張機能**: Chrome Manifest V3, Preact, TypeScript
- **ビルドツール**: Vite, npm workspaces
