#!/bin/bash
# warn-raw-cache-keys — PreToolUse(Edit|Write). AVISA (exit 0 + systemMessage), nunca bloqueia:
# cacheService.get/set/del com string literal como chave em vez dos helpers
# itemKey/listKey/lookupKey/prefix (CLAUDE.md §7). Heurística assumidamente imperfeita
# (por isso WARN) — projeto-filho pode remover este hook do settings.json se gerar ruído.
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

# cacheService.get|set|del( seguido de aspas ou backtick = chave crua
if printf '%s' "$CONTENT" | grep -qE 'cacheService\.(get|set|del)\(\s*["'"'"'`]'; then
  printf '{"systemMessage": "⚠️ Chave de cache crua detectada. Nunca strings diretas — use cacheService.itemKey/listKey/lookupKey/prefix com CacheNamespace, CacheSubtype e CacheTTL de cache.constants.ts. Toda mutation invalida item + list + lookups (capture o valor ANTIGO antes de update/delete). CLAUDE.md §7."}\n'
fi

exit 0
