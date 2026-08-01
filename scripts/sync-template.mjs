#!/usr/bin/env node
/**
 * Materializa o template (apps/ + configs de raiz) dentro de
 * packages/create-app/template/, para publicação do pacote.
 *
 * Roda automaticamente no `npm publish` (prepublishOnly do pacote). O
 * conteúdo gerado NÃO é versionado (.gitignore) — a raiz do monorepo é a
 * única fonte de verdade; isto aqui é só o payload do pacote publicado.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEST = path.join(REPO_ROOT, "packages/create-app/template");

const EXCLUDE = new Set([
  "node_modules",
  ".git",
  ".next",
  ".turbo",
  "dist",
  "build",
  "coverage",
  ".env",
  ".env.local",
  "packages",
  "scripts",
]);

fs.rmSync(DEST, { recursive: true, force: true });
fs.mkdirSync(DEST, { recursive: true });

for (const entry of fs.readdirSync(REPO_ROOT)) {
  if (EXCLUDE.has(entry)) continue;
  fs.cpSync(path.join(REPO_ROOT, entry), path.join(DEST, entry), {
    recursive: true,
    filter: (src) => !EXCLUDE.has(path.basename(src)),
  });
}

console.log(`Template sincronizado em ${DEST}`);
