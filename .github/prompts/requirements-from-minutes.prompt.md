---
agent: 'agent'
description: 議事録から要件定義書（Markdown）を作成し、判断できない項目は確認事項として質問する
---

# 議事録 → 要件定義書

入力の議事録を、要件定義書テンプレートに沿って Markdown へ落とし込んでください。

## 入力

- 議事録: #file:docs/minutes.md
- テンプレート: #file:docs/templates/requirements_template.md

## 手順

1. テンプレート `docs/templates/requirements_template.md` の各セクションを埋める
2. 議事録に書かれていることだけを記載する（推測で補完しない）
3. 埋められない項目・曖昧な項目は「確認事項」として列挙し、私に質問する
4. 出力は `docs/requirements.md`（正本＝md）。xlsx は作らない

## 制約

- 受け入れ条件は、正常系・境界値・異常系に分けて、確認できる形で書く
- 議事録で「今回はやらないこと」とされた内容は、機能要件ではなく「対象外」に書く
- 議事録の雑談・議事メモは要件に含めない
