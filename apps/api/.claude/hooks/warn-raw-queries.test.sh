#!/bin/bash
# Testes do warn-raw-queries.sh — rodar: bash warn-raw-queries.test.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$DIR/warn-raw-queries.sh"
PASS=0; FAIL=0

run() { # run <desc> <espera_warn: yes|no> <json>
  local desc="$1" want="$2" json="$3"
  local out; out=$(echo "$json" | bash "$HOOK" 2>/dev/null); local got=$?
  local warned="no"; echo "$out" | grep -q "systemMessage" && warned="yes"
  if [ "$got" -eq 0 ] && [ "$warned" = "$want" ]; then PASS=$((PASS+1)); echo "  ok: $desc"
  else FAIL=$((FAIL+1)); echo "  FALHOU: $desc (exit $got, warn=$warned, esperado $want)"; fi
}

echo "warn-raw-queries:"
run "createQueryBuilder em service" yes '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/x/x.service.ts","new_string":"const q = this.repo.createQueryBuilder(\"c\");"}}'
run "getRepository em service" yes '{"tool_name":"Write","tool_input":{"file_path":"src/modules/y/y.service.ts","content":"const r = this.dataSource.getRepository(User);"}}'
run "createQueryBuilder em repository (legítimo)" no '{"tool_name":"Edit","tool_input":{"file_path":"src/repositories/contact.repository.ts","new_string":"this.repo.createQueryBuilder(\"c\")"}}'
run "service sem query bruta" no '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/x/x.service.ts","new_string":"return this.contactRepository.findById(id);"}}'
run "sem file_path" no '{"tool_name":"Edit","tool_input":{}}'
run "stdin não-JSON" no 'not json'

echo "$PASS ok, $FAIL falhas"
[ "$FAIL" -eq 0 ]
