#!/bin/bash
# block-provider-redeclaration — PreToolUse(Edit|Write). BLOQUEIA (exit 2) quando um
# módulo de domínio re-declara um singleton STATEFUL do AuthModule (CLAUDE.md §3.1).
# Re-declarar cria instância paralela com cache próprio → invalidação furada.
#
# FONTE DA LISTA: exports de src/auth/auth.module.ts. Se um repo stateless passar a
# usar CacheService, promova-o ao AuthModule (providers + exports) e adicione aqui.
# Repos stateless (OrganizationRepository, PlanRepository...) são re-declarados
# legitimamente e NÃO entram nesta lista.
set -u

SHARED_SINGLETONS=("UserRepository" "SecurityHashService" "CacheService" "LoggerService")

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

# Só módulos de domínio: src/modules/**/*.module.ts (auth/ é o dono dos singletons)
case "$FILE_PATH" in
  *src/modules/*.module.ts) ;;
  *) exit 0 ;;
esac

# Extrai os blocos "providers: [...]" (multilinha) e procura os singletons neles,
# ignorando linhas de comentário. Node faz o parse estrutural (regex por bloco).
VIOLATION=$(printf '%s' "$CONTENT" | node -e '
let d = "";
process.stdin.on("data", c => (d += c));
process.stdin.on("end", () => {
  const singletons = process.argv.slice(1);
  const blocks = [...d.matchAll(/providers\s*:\s*\[([^\]]*)\]/gs)].map(m => m[1]);
  for (const block of blocks) {
    const code = block.split("\n").filter(l => !l.trim().startsWith("//")).join("\n");
    for (const s of singletons) {
      if (new RegExp("\\b" + s + "\\b").test(code)) { process.stdout.write(s); return; }
    }
  }
});' "${SHARED_SINGLETONS[@]}" 2>/dev/null || echo "")

if [ -n "$VIOLATION" ]; then
  logfile="${CLAUDE_PROJECT_DIR:-.}/.claude/hooks/.log"
  echo "$(date '+%Y-%m-%d %H:%M:%S') BLOCK [provider-redeclaration:$VIOLATION] $FILE_PATH" >> "$logfile" 2>/dev/null || true
  echo "❌ $VIOLATION é singleton compartilhado do AuthModule — NÃO re-declare em providers. Importe o AuthModule (imports: [AuthModule]). Re-declarar cria instância paralela com cache próprio e a invalidação não a atinge (bugs de token/cache stale). Veja CLAUDE.md §3.1." >&2
  exit 2
fi

exit 0
