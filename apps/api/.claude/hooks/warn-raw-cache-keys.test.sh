#!/bin/bash
# Testes do warn-raw-cache-keys.sh — rodar: bash warn-raw-cache-keys.test.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$DIR/warn-raw-cache-keys.sh"
PASS=0; FAIL=0

run() { # run <desc> <espera_warn: yes|no> <json>
  local desc="$1" want="$2" json="$3"
  local out; out=$(echo "$json" | bash "$HOOK" 2>/dev/null); local got=$?
  local warned="no"; echo "$out" | grep -q "systemMessage" && warned="yes"
  if [ "$got" -eq 0 ] && [ "$warned" = "$want" ]; then PASS=$((PASS+1)); echo "  ok: $desc"
  else FAIL=$((FAIL+1)); echo "  FALHOU: $desc (exit $got, warn=$warned, esperado $want)"; fi
}

echo "warn-raw-cache-keys:"
run "get com string crua" yes '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/x/x.service.ts","new_string":"await this.cacheService.get(\"contact:item:\" + id);"}}'
run "set com template literal" yes '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/y/y.service.ts","new_string":"await this.cacheService.set(`user:${id}`, data, 300);"}}'
run "del com string crua" yes '{"tool_name":"Write","tool_input":{"file_path":"src/modules/z/z.service.ts","content":"await this.cacheService.del(\"contact:list:all\");"}}'
run "get com itemKey (correto)" no '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/x/x.service.ts","new_string":"await this.cacheService.get(this.cacheService.itemKey(CacheNamespace.CONTACT, orgId, id));"}}'
run "set com lookupKey (correto)" no '{"tool_name":"Edit","tool_input":{"file_path":"src/auth/auth.service.ts","new_string":"await this.cacheService.set(this.cacheService.lookupKey(CacheNamespace.AUTH, CacheSubtype.SESSION, user.id), s, CacheTTL.AUTH_SESSION);"}}'
run "arquivo sem cacheService" no '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/x/x.service.ts","new_string":"return 1;"}}'
run "stdin não-JSON" no 'not json'

echo "$PASS ok, $FAIL falhas"
[ "$FAIL" -eq 0 ]
