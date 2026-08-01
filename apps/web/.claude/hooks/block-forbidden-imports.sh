#!/bin/bash
# block-forbidden-imports — PreToolUse(Edit|Write). BLOQUEIA (exit 2):
#   1. import de "sonner" fora da whitelist (CLAUDE.md §3.1 — toasts via @/lib/toast)
#   2. import de "@/components/ui/" dentro de src/views/ ou src/modules/ (CLAUDE.md §1)
# Projetos-filho: adicione exceções em WHITELIST_SONNER abaixo.
set -u

WHITELIST_SONNER=("src/lib/toast.ts" "src/app/layout.tsx")

INPUT=$(cat)
# Parse via node (garantido em projeto frontend; jq não é). Campos: file_path + content/new_string.
read -r FILE_PATH_B64 CONTENT_B64 <<EOF_PARSE
$(printf '%s' "$INPUT" | node -e '
let d = "";
process.stdin.on("data", c => (d += c));
process.stdin.on("end", () => {
  let j = {};
  try { j = JSON.parse(d); } catch {}
  const ti = j.tool_input || {};
  const fp = ti.file_path || "";
  const content = ti.new_string ?? ti.content ?? "";
  process.stdout.write(Buffer.from(fp).toString("base64") + " " + Buffer.from(content).toString("base64"));
});' 2>/dev/null || echo "")
EOF_PARSE

FILE_PATH=$(printf '%s' "${FILE_PATH_B64:-}" | base64 -d 2>/dev/null || echo "")
[ -z "${FILE_PATH:-}" ] && exit 0
CONTENT=$(printf '%s' "${CONTENT_B64:-}" | base64 -d 2>/dev/null || echo "")

log_block() {
  local rule="$1"
  local logfile="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/.log"
  echo "$(date '+%Y-%m-%d %H:%M:%S') BLOCK [$rule] $FILE_PATH" >> "$logfile" 2>/dev/null || true
}

in_whitelist() {
  for w in "${WHITELIST_SONNER[@]}"; do
    case "$FILE_PATH" in *"$w") return 0;; esac
  done
  return 1
}

# Regra 1: sonner fora da whitelist
if printf '%s' "$CONTENT" | grep -q 'from "sonner"'; then
  if ! in_whitelist; then
    log_block "sonner"
    echo "❌ Import de sonner não é permitido. Use: import { toast } from '@/lib/toast'. Veja CLAUDE.md §3.1 — Toasts." >&2
    exit 2
  fi
fi

# Regra 2: ui/ direto em views/modules/app (páginas)
case "$FILE_PATH" in
  *src/views/*|*src/modules/*|*src/app/*)
    if printf '%s' "$CONTENT" | grep -q 'from "@/components/ui/'; then
      log_block "ui-direct"
      echo "❌ Views/módulos não importam de @/components/ui/ direto. Use o barrel @/components (ex: Button, Input). Veja CLAUDE.md §1." >&2
      exit 2
    fi
    ;;
esac

exit 0
