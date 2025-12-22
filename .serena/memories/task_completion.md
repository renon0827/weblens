# タスク完了時のチェックリスト

タスク完了時に以下を実行してください：

## 1. コード品質チェック

```bash
# ESLintでエラーがないか確認
npm run lint

# エラーがあれば自動修正を試みる
npm run lint:fix
```

## 2. フォーマット

```bash
# Prettierでコードをフォーマット
npm run format
```

## 3. ビルド確認

```bash
# 全パッケージビルドが成功するか確認
npm run build
```

## 4. 手動テスト（必要に応じて）

1. `npm run dev:server` でサーバーを起動
2. `npm run dev:extension` で拡張機能をビルド
3. Chromeで拡張機能を再読み込み
4. 機能が正常に動作するか確認

## 注意事項

- TypeScript strict modeが有効なので、型エラーに注意
- `noUnusedLocals` と `noUnusedParameters` が有効
- `console.log` は避ける（`console.warn` または `console.error` を使用）
