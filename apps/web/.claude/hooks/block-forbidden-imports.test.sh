#!/bin/bash
# Testes do block-forbidden-imports.sh — rodar: bash block-forbidden-imports.test.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$DIR/block-forbidden-imports.sh"
PASS=0; FAIL=0

run() { # run <desc> <exit_esperado> <json>
  local desc="$1" want="$2" json="$3"
  local err; err=$(echo "$json" | CLAUDE_PROJECT_DIR="$DIR/../.." bash "$HOOK" 2>&1 >/dev/null); local got=$?
  if [ "$got" -eq "$want" ]; then PASS=$((PASS+1)); echo "  ok: $desc"
  else FAIL=$((FAIL+1)); echo "  FALHOU: $desc (exit $got, esperado $want) [$err]"; fi
}

echo "block-forbidden-imports:"
# Regra 1 — sonner fora da whitelist: BLOQUEIA
run "sonner em view" 2 '{"tool_name":"Edit","tool_input":{"file_path":"src/views/Foo.tsx","new_string":"import { toast } from \"sonner\";"}}'
run "sonner em module (Write/content)" 2 '{"tool_name":"Write","tool_input":{"file_path":"src/modules/x/x-dialog.tsx","content":"import { toast } from \"sonner\""}}'
# Regra 1 — whitelist: PERMITE
run "sonner no wrapper toast.ts" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/lib/toast.ts","new_string":"import { toast as sonnerToast } from \"sonner\";"}}'
run "sonner no layout.tsx" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/app/layout.tsx","new_string":"import { Toaster } from \"sonner\";"}}'
# Regra 2 — ui/ direto em views/modules: BLOQUEIA
run "ui direto em view" 2 '{"tool_name":"Edit","tool_input":{"file_path":"src/views/Bar.tsx","new_string":"import { Button } from \"@/components/ui/button\";"}}'
run "ui direto em module" 2 '{"tool_name":"Write","tool_input":{"file_path":"src/modules/y/y-form.tsx","content":"import { Input } from \"@/components/ui/input\""}}'
run "ui direto em app/ (página)" 2 '{"tool_name":"Edit","tool_input":{"file_path":"src/app/(protected)/foo/page.tsx","new_string":"import { Card } from \"@/components/ui/card\";"}}'
# Regra 2 — ui/ em components/ (wrapper legítimo): PERMITE
run "ui import dentro de components/" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/components/Button.tsx","new_string":"import { Button as UIButton } from \"@/components/ui/button\";"}}'
# Neutro: PERMITE
run "edit qualquer sem violação" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/views/Baz.tsx","new_string":"const x = 1;"}}'
run "tool sem file_path (ex: outro tool)" 0 '{"tool_name":"Edit","tool_input":{}}'
run "stdin não-JSON não explode" 0 'not json'

echo "$PASS ok, $FAIL falhas"
[ "$FAIL" -eq 0 ]
