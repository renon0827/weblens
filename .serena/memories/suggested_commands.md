# 推奨コマンド

## 開発コマンド

### 依存関係インストール
```bash
npm install
```

### 開発モード
```bash
# サーバー起動（ホットリロード）
npm run dev:server

# 拡張機能ビルド（監視モード）- 別ターミナルで
npm run dev:extension
```

## ビルドコマンド

```bash
# 全パッケージビルド
npm run build

# サーバーのみ
npm run build:server

# 拡張機能のみ
npm run build:extension
```

## コード品質

```bash
# ESLintでチェック
npm run lint

# ESLintで自動修正
npm run lint:fix

# Prettierでフォーマット
npm run format
```

## クリーンアップ

```bash
# dist/, node_modules を削除
npm run clean
```

## Git操作

```bash
# ステータス確認
git status

# 差分確認
git diff

# コミット
git add .
git commit -m "コミットメッセージ"
```

## Chrome拡張機能のインストール

1. Chromeで `chrome://extensions` を開く
2. 「デベロッパーモード」を有効化（右上のトグル）
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. `packages/extension/dist` フォルダを選択
