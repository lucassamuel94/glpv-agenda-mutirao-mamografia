#!/bin/bash

# Script para verificar lint do projeto EZCRM Backend

echo "🧹 Verificando lint do EZCRM Backend..."
echo ""

# Verificar se node_modules existe
if [ ! -d "node_modules" ]; then
  echo "❌ node_modules não encontrado. Execute 'npm install' primeiro."
  exit 1
fi

# Rodar lint check
echo "📋 Executando ESLint..."
npm run lint:check

LINT_EXIT_CODE=$?

echo ""
if [ $LINT_EXIT_CODE -eq 0 ]; then
  echo "✅ Lint passou sem erros!"
  exit 0
else
  echo "⚠️  Lint encontrou problemas."
  echo ""
  echo "💡 Para corrigir automaticamente, execute:"
  echo "   npm run lint:fix"
  exit $LINT_EXIT_CODE
fi
