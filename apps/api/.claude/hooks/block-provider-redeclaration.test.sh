#!/bin/bash
# Testes do block-provider-redeclaration.sh — rodar: bash block-provider-redeclaration.test.sh
set -u
DIR="$(cd "$(dirname "$0")" && pwd)"
HOOK="$DIR/block-provider-redeclaration.sh"
PASS=0; FAIL=0

run() { # run <desc> <exit_esperado> <json>
  local desc="$1" want="$2" json="$3"
  local err; err=$(echo "$json" | CLAUDE_PROJECT_DIR="$DIR/../.." bash "$HOOK" 2>&1 >/dev/null); local got=$?
  if [ "$got" -eq "$want" ]; then PASS=$((PASS+1)); echo "  ok: $desc"
  else FAIL=$((FAIL+1)); echo "  FALHOU: $desc (exit $got, esperado $want) [$err]"; fi
}

echo "block-provider-redeclaration:"
# BLOQUEIA: singleton stateful em providers de módulo de domínio (array inline)
run "UserRepository inline em module" 2 '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/invoices/invoices.module.ts","new_string":"@Module({ providers: [InvoicesService, UserRepository] })"}}'
# BLOQUEIA: array multilinha
run "CacheService multilinha" 2 '{"tool_name":"Write","tool_input":{"file_path":"src/modules/x/x.module.ts","content":"@Module({\n  providers: [\n    XService,\n    CacheService,\n  ],\n})"}}'
run "LoggerService multilinha" 2 '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/y/y.module.ts","new_string":"providers: [\n  YService,\n  LoggerService\n]"}}'
run "SecurityHashService" 2 '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/z/z.module.ts","new_string":"providers: [SecurityHashService]"}}'
# PERMITE: auth module (é o dono dos singletons)
run "UserRepository no auth.module" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/auth/auth.module.ts","new_string":"providers: [AuthService, UserRepository, CacheService]"}}'
# PERMITE: repo stateless re-declarado (convenção viva)
run "OrganizationRepository (stateless) permitido" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/users/users.module.ts","new_string":"providers: [UsersService, OrganizationRepository, PlanRepository]"}}'
# PERMITE: singleton citado FORA do bloco providers (ex: import, comentário)
run "singleton só no import" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/w/w.module.ts","new_string":"import { CacheService } from \"../../common/services/cache.service\";\n@Module({ imports: [AuthModule], providers: [WService] })"}}'
run "singleton em comentário no providers" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/users/users.module.ts","new_string":"providers: [\n  // UserRepository, CacheService vêm do AuthModule\n  UsersService,\n]"}}'
# PERMITE: arquivo que não é module.ts
run "service.ts não dispara" 0 '{"tool_name":"Edit","tool_input":{"file_path":"src/modules/x/x.service.ts","new_string":"providers: [UserRepository]"}}'
# Neutros
run "sem file_path" 0 '{"tool_name":"Edit","tool_input":{}}'
run "stdin não-JSON" 0 'not json'

echo "$PASS ok, $FAIL falhas"
[ "$FAIL" -eq 0 ]
