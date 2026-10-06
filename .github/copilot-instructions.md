# プロジェクト全体指示（ECカート料金計算）
- 言語: TypeScript（型必須・any 禁止）
- 料金計算は src/pricing.ts の純粋関数に置く（外部I/Oに依存しない）
- 金額は整数（円）。端数は Math.floor で切り捨てる
- 異常系は PricingError を throw する（null / -1 で表現しない）
- テストは Vitest（テストファースト・src/pricing.test.ts）
