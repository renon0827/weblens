# コードスタイルと規約

## TypeScript設定 (tsconfig.base.json)

- **Target**: ES2022
- **Module**: ESNext
- **Strict mode**: 有効
- **noUnusedLocals**: 有効
- **noUnusedParameters**: 有効
- **noUncheckedIndexedAccess**: 有効

## ESLint規約 (.eslintrc.js)

- `@typescript-eslint/no-unused-vars`: エラー（`_`で始まる引数は除外）
- `@typescript-eslint/no-explicit-any`: 警告
- `no-console`: 警告（`console.warn`, `console.error` は許可）

## Prettier設定 (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100,
  "bracketSpacing": true,
  "arrowParens": "always",
  "endOfLine": "lf"
}
```

## 命名規則

- **ファイル名**: camelCase (例: `elementInfo.ts`, `useWebSocket.ts`)
- **コンポーネント**: PascalCase (例: `ElementCard.tsx`, `ChatView.tsx`)
- **変数/関数**: camelCase
- **型/インターフェース**: PascalCase
- **定数**: UPPER_SNAKE_CASE

## プロジェクト固有パターン

### Chrome拡張機能
- Content Script: DOM操作とメッセージング
- Background Script (Service Worker): メッセージ中継、コンテキストメニュー
- Side Panel: Preactを使用したUI

### サーバー
- Fastify: REST APIルーティング
- ws: WebSocket処理
- child_process (spawn): Claude CLI実行
