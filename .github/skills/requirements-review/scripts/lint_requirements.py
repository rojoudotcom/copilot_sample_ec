#!/usr/bin/env python3
"""要件定義書の機械チェック（曖昧語・未記入セクション・プレースホルダの検出）。

使い方:
    python3 .github/skills/requirements-review/scripts/lint_requirements.py docs/requirements.md

標準ライブラリのみで動作する。判断が要る指摘（議事録との整合など）は checklist.md 側の担当。
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path

# 要件そのものが曖昧なときに出る語。どこに書かれていても曖昧。
VAGUE_WORDS = [
    "適切に",
    "なるべく",
    "高品質",
    "柔軟に",
    "しっかり",
    "十分に",
    "できるだけ",
]

# 書かれる場所で意味が変わる語。「対象外」と「確認事項」では、まだ決まっていないこと
# を書くのが正しいので指摘しない。それ以外のセクションに出たら曖昧。
CONTEXTUAL_VAGUE_WORDS = ["など", "等", "検討する", "予定"]
TOLERANT_SECTIONS = ["対象外", "確認事項"]

REQUIRED_SECTIONS = [
    "背景",
    "スコープ",
    "用語定義",
    "機能要件",
    "非機能要件",
    "受け入れ条件",
    "確認事項",
]

PLACEHOLDER = re.compile(r"<[^>\n]{1,40}>")
# `<...>` は Markdown の自動リンク（<https://…>）や HTML タグ（<br>）とも衝突する。
# テンプレートの未置換だけを拾うため、和文を含むものと、日付の書式だけを対象にする。
CJK = re.compile(r"[぀-ヿ一-鿿]")
ASCII_PLACEHOLDER = re.compile(r"^<(YYYY-MM-DD|[A-Z][A-Z0-9_-]{2,})>$")
HEADING = re.compile(r"^#{1,6}\s*(?:[0-9]+\.\s*)?(.+?)\s*$")


def lint(path: Path) -> list[str]:
    findings: list[str] = []
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()

    for section in REQUIRED_SECTIONS:
        if section not in text:
            findings.append(f"[重大] セクションが見つかりません: {section}")

    section = ""
    for number, line in enumerate(lines, start=1):
        heading = HEADING.match(line)
        if heading:
            section = heading.group(1)

        # 未置換のプレースホルダは下で別に指摘する。その中の語まで曖昧語として数えると
        # 同じ1行に2件出て、どちらを直せばよいのか分からなくなる。
        body = PLACEHOLDER.sub("", line)
        words = list(VAGUE_WORDS)
        if not any(tolerant in section for tolerant in TOLERANT_SECTIONS):
            words += CONTEXTUAL_VAGUE_WORDS
        for word in words:
            if word in body:
                findings.append(f"[要確認] {path.name}:{number} 曖昧語「{word}」: {line.strip()}")

        for match in PLACEHOLDER.finditer(line):
            token = match.group(0)
            if CJK.search(token) or ASCII_PLACEHOLDER.match(token):
                findings.append(f"[重大] {path.name}:{number} プレースホルダが未置換: {token}")

    checkboxes = [line for line in lines if line.lstrip().startswith("- [ ]")]
    if not checkboxes:
        findings.append("[重大] 受け入れ条件のチェックボックスが1件もありません")

    return findings


def main() -> int:
    parser = argparse.ArgumentParser(description="要件定義書の機械チェック")
    parser.add_argument("path", nargs="?", default="docs/requirements.md")
    args = parser.parse_args()

    target = Path(args.path)
    if not target.exists():
        print(f"ファイルが見つかりません: {target}", file=sys.stderr)
        return 2

    findings = lint(target)
    if not findings:
        print(f"OK: {target} に機械チェックで検出できる問題はありません")
        return 0

    for finding in findings:
        print(finding)
    print(f"\n{len(findings)} 件の指摘があります")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
