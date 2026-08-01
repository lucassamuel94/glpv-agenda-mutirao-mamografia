#!/bin/bash
# warn-ui-edits — PreToolUse(Edit|Write). AVISA (exit 0 + systemMessage), nunca bloqueia:
#   1. edição em src/components/ui/ (shadcn é read-only por convenção; upgrade legítimo existe)
#   2. <Layout usado em view/module sem <PageHeader (CLAUDE.md §2.1 — Portal pattern)
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

warn() { printf '{"systemMessage": "⚠️ %s"}\n' "$1"; exit 0; }

# Regra 1: tocar em ui/
case "$FILE_PATH" in
  *src/components/ui/*)
    warn "Você está editando src/components/ui/ (shadcn, somente leitura — CLAUDE.md §1). Alteração aqui propaga para TODOS os componentes pai que a encapsulam. Só prossiga com confirmação humana explícita, registrando o motivo em comentário no arquivo; caso contrário, mova a mudança para o componente pai em src/components/."
    ;;
esac

# Regra 2: <Layout em view sem <PageHeader
case "$FILE_PATH" in
  *src/views/*|*src/modules/*)
    if printf '%s' "$CONTENT" | grep -q '<Layout' && ! printf '%s' "$CONTENT" | grep -q '<PageHeader'; then
      warn "View usando <Layout> direto. O padrão é <PageHeader> via Portal (Layout fica só no (protected)/layout.tsx) — CLAUDE.md §2.1."
    fi
    ;;
esac

exit 0
