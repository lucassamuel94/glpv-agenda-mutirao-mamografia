#!/bin/bash
# warn-raw-queries — PreToolUse(Edit|Write). AVISA (exit 0 + systemMessage), nunca bloqueia:
# query TypeORM bruta (createQueryBuilder/getRepository) dentro de *.service.ts.
# Queries vivem em src/repositories/ (CLAUDE.md §2). WARN e não BLOCK: refactor em
# andamento passa por estados intermediários legítimos.
set -u

INPUT=$(cat)
read -r FILE_PATH_B64 CONTENT_B64 <<EOF_PARSE
$(printf '%s' "$INPUT" | node -e '
let d = "";
process.stdin.on("data", c => (d += c));
process.stdin.on("end", () => {
  let j = {};
  try { j = JSON.parse(d); } catch {}
  const ti = j.tool_input || {};
  process.stdout.write(Buffer.from(ti.file_path || "").toString("base64") + " " + Buffer.from(ti.new_string ?? ti.content ?? "").toString("base64"));
});' 2>/dev/null || echo "")
EOF_PARSE

FILE_PATH=$(printf '%s' "${FILE_PATH_B64:-}" | base64 -d 2>/dev/null || echo "")
[ -z "${FILE_PATH:-}" ] && exit 0
CONTENT=$(printf '%s' "${CONTENT_B64:-}" | base64 -d 2>/dev/null || echo "")

case "$FILE_PATH" in
  *.service.ts)
    if printf '%s' "$CONTENT" | grep -qE 'createQueryBuilder\(|getRepository\('; then
      printf '{"systemMessage": "⚠️ Query TypeORM bruta em service. Queries vivem em src/repositories/ (service usa o repositório; repositório acessa dados) — CLAUDE.md §2. Mova a query para o repository da entidade."}\n'
    fi
    ;;
esac

exit 0
