#!/bin/bash
# Testes do warn-ui-edits.sh — rodar: bash warn-ui-edits.test.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$DIR/warn-ui-edits.sh"
PASS=0; FAIL=0

run() { # run <desc> <espera_warn: yes|no> <json>
  local desc="$1" want="$2" json="$3"
  local out; out=$(echo "$json" | bash "$HOOK" 2>/dev/null); local got=$?
  local warned="no"; echo "$out" | grep -q "systemMessage" && warned="yes"
  if [ "$got" -eq 0 ] && [ "$warned" = "$want" ]; then PASS=$((PASS+1)); echo "  ok: $desc"
  else FAIL=$((FAIL+1)); echo "  FALHOU: $desc (exit $got, warn=$warned, esperado $want)"; fi
}

echo "warn-ui-edits:"
# Regra 1 — edição em ui/: AVISA (mas exit 0)
run "edit em components/ui" yes '{"tool_name":"Edit","tool_input":{"file_path":"src/components/ui/button.tsx","new_string":"x"}}'
run "write em components/ui" yes '{"tool_name":"Write","tool_input":{"file_path":"src/components/ui/novo.tsx","content":"x"}}'
# Regra 2 — <Layout sem <PageHeader em view: AVISA
run "Layout direto em view" yes '{"tool_name":"Edit","tool_input":{"file_path":"src/views/Foo.tsx","new_string":"return (<Layout title=\"x\"><div/></Layout>);"}}'
run "PageHeader em view (correto)" no '{"tool_name":"Edit","tool_input":{"file_path":"src/views/Foo.tsx","new_string":"return (<><PageHeader title=\"x\" /><div/></>);"}}'
# Neutros: silêncio
run "edit fora de ui/" no '{"tool_name":"Edit","tool_input":{"file_path":"src/components/Button.tsx","new_string":"x"}}'
run "stdin não-JSON não explode" no 'not json'

echo "$PASS ok, $FAIL falhas"
[ "$FAIL" -eq 0 ]
