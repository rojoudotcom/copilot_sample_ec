# copilot_sample_ec

GitHub Copilot 活用研修（Day3）の演習用リポジトリです。EC サイトのカート料金計算を、外部入出力に依存しない純粋関数として実装しています。

## 使い方

```bash
npm ci
```

```bash
npm test
```

> **テストが1件失敗しますが、正常です。** デバッグ演習で使うため、意図的に1件だけ仕込んであります。当日の演習で原因を調査して修正します。

買い物かごの画面で計算を確かめる場合は、次のコマンドを実行し、表示された `http://localhost:5173/` をブラウザで開きます。終了は `Ctrl+C` です。

```bash
npm run dev
```

型チェックだけを実行する場合は次のコマンドを使います。

```bash
npm run typecheck
```

## ディレクトリ構成

| パス | 内容 |
|------|------|
| `src/pricing.ts` | 料金計算の純粋関数（小計・会員割引・クーポン・送料・合計） |
| `src/pricing.test.ts` | Vitest のテスト |
| `src/points.ts` | 購入ポイントの計算（プロンプトのコツのデモで使う。テストはまだ無い） |
| `web/` | 買い物かごの画面（HTML・CSS・TypeScript）。計算は `src/pricing.ts` の `calculateCharge` を呼ぶ |
| `docs/minutes.md` | 料金計算機能の要件ヒアリング議事録 |
| `docs/design.md` | 現行の設計書（受け入れ条件つき） |
| `docs/points.md` | 購入ポイントの仕様 |
| `docs/templates/requirements_template.md` | 要件定義書のテンプレート |
| `docs/templates/adr_template.md` | ADR（設計判断の記録）のテンプレート |
| `docs/templates/testing.instructions.md` | 単体テストの規則のテンプレート（`.github/instructions/` に置いて使う） |
| `.github/prompts/` | prompt file（`/requirements-from-minutes`・`/design-from-requirements`） |
| `.github/skills/` | Agent Skills（要件定義書レビュー） |

## 仕様の概要

| 項目 | 内容 |
|------|------|
| 小計 | 単価 × 数量 の合計 |
| 会員割引 | 会員は10%引き。セール品は対象外。端数は切り捨て |
| クーポン | `SAVE500` で500円引き。会員割引との併用は不可 |
| 送料 | 割引後の金額が5,000円以上で無料、未満は一律500円 |
| 金額 | すべて整数（円） |
| 異常系 | 数量0以下・単価マイナス・無効なクーポン・割引の併用は `PricingError` |

