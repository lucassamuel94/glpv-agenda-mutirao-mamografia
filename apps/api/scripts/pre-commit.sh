#!/bin/bash

# Pre-commit hook para verificar lint antes de commitar

echo "🧹 Verificando lint antes do commit..."

# Rodar lint check
npm run lint:check

LINT_EXIT_CODE=$?

if [ $LINT_EXIT_CODE -ne 0 ]; then
  echo ""
  echo "❌ Lint falhou! Corrija os erros antes de commitar."
  echo ""
  echo "💡 Para corrigir automaticamente:"
  echo "   npm run lint:fix"
  echo ""
  exit 1
fi

echo "✅ Lint passou!"
exit 0
