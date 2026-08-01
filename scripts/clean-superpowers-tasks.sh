#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd -- "$SCRIPT_DIR/.." && pwd)"
TARGET="$REPO_ROOT/.superpowers/sdd"
DRY_RUN=false
ASSUME_YES=false

for arg in "$@"; do
  case "$arg" in
    --dry-run) DRY_RUN=true ;;
    --yes|-y) ASSUME_YES=true ;;
    *)
      echo "Uso: $0 [--dry-run] [--yes]"
      exit 2
      ;;
  esac
done

if [[ ! -d "$TARGET" ]]; then
  echo "Nenhuma task do Superpowers encontrada em .superpowers/sdd."
  exit 0
fi

echo "Tasks encontradas:"
find "$TARGET" -type f -print | sed "s#^$REPO_ROOT/##" | sort

if [[ "$DRY_RUN" == true ]]; then
  echo "Dry-run: nada foi removido."
  exit 0
fi

if [[ "$ASSUME_YES" != true ]]; then
  printf "Remover todas as tasks de .superpowers/sdd? [y/N] "
  read -r answer
  [[ "$answer" == "y" || "$answer" == "Y" ]] || {
    echo "Operação cancelada."
    exit 0
  }
fi

rm -rf -- "$TARGET"
echo "Tasks removidas de .superpowers/sdd."
