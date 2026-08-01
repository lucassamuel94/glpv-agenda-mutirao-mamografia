/**
 * sync-check.ts
 *
 * Compara os paths sincronizáveis (syncPaths do design-system.config.json)
 * entre este template e um projeto de referência, classificando cada arquivo:
 *   identical | diverged | only-template | only-ref
 *
 * READ-ONLY: nunca copia nem altera arquivos. A decisão do que absorver é
 * sempre revisão humana/agente (ver docs/superpowers/specs/2026-07-24-*).
 *
 * Uso: npm run sync:check -- /caminho/do/projeto-ref
 * Saída: tabela no terminal + sync-report.json na raiz do frontend (gitignored).
 */

import fs from "fs";
import path from "path";
import crypto from "crypto";

const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "design-system.config.json");
const REPORT_PATH = path.join(ROOT, "sync-report.json");

interface SyncPath {
  name: string;
  path: string;
  depth?: "flat" | "recursive";
}

interface LayerReport {
  name: string;
  path: string;
  identical: string[];
  diverged: string[];
  onlyTemplate: string[];
  onlyRef: string[];
}

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

function hashFile(filePath: string): string {
  return crypto.createHash("sha256").update(fs.readFileSync(filePath)).digest("hex");
}

/** Lista arquivos relativos ao baseDir. depth=flat não desce em subpastas. */
function listFiles(baseDir: string, depth: "flat" | "recursive"): string[] {
  if (!fs.existsSync(baseDir)) return [];
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        if (depth === "recursive") walk(full);
      } else {
        out.push(path.relative(baseDir, full));
      }
    }
  };
  walk(baseDir);
  return out.sort();
}

function compareLayer(sp: SyncPath, refRoot: string): LayerReport {
  const report: LayerReport = {
    name: sp.name, path: sp.path,
    identical: [], diverged: [], onlyTemplate: [], onlyRef: [],
  };
  const tplTarget = path.join(ROOT, sp.path);
  const refTarget = path.join(refRoot, sp.path);

  // Caso arquivo único (ex.: globals.css)
  if (fs.existsSync(tplTarget) && fs.statSync(tplTarget).isFile()) {
    if (!fs.existsSync(refTarget)) report.onlyTemplate.push(sp.path);
    else if (hashFile(tplTarget) === hashFile(refTarget)) report.identical.push(sp.path);
    else report.diverged.push(sp.path);
    return report;
  }

  const depth = sp.depth ?? "recursive";
  const tplFiles = new Set(listFiles(tplTarget, depth));
  const refFiles = new Set(listFiles(refTarget, depth));
  for (const f of tplFiles) {
    if (!refFiles.has(f)) { report.onlyTemplate.push(f); continue; }
    const same = hashFile(path.join(tplTarget, f)) === hashFile(path.join(refTarget, f));
    (same ? report.identical : report.diverged).push(f);
  }
  for (const f of refFiles) if (!tplFiles.has(f)) report.onlyRef.push(f);
  return report;
}

function main() {
  const refArg = process.argv[2];
  if (!refArg) fail("Uso: npm run sync:check -- /caminho/do/projeto-ref");
  const refRoot = path.resolve(refArg);
  if (!fs.existsSync(refRoot)) fail(`Projeto-ref não encontrado: ${refRoot}`);
  if (!fs.existsSync(CONFIG_PATH)) fail(`Config não encontrada: ${CONFIG_PATH}`);

  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  const syncPaths: SyncPath[] = config.syncPaths;
  if (!Array.isArray(syncPaths) || syncPaths.length === 0)
    fail("design-system.config.json não tem bloco syncPaths");

  const layers = syncPaths.map((sp) => compareLayer(sp, refRoot));

  console.log(`\nsync-check — template × ${refRoot}\n`);
  const pad = (s: string, n: number) => s.padEnd(n);
  console.log(pad("Camada", 14) + pad("idênticos", 11) + pad("divergentes", 13) + pad("só-template", 13) + "só-ref");
  console.log("-".repeat(62));
  for (const l of layers) {
    console.log(
      pad(l.name, 14) + pad(String(l.identical.length), 11) +
      pad(String(l.diverged.length), 13) + pad(String(l.onlyTemplate.length), 13) +
      String(l.onlyRef.length),
    );
    for (const f of l.diverged) console.log(`  ≠ ${f}`);
    for (const f of l.onlyRef) console.log(`  + ${f} (só no ref)`);
  }

  const report = { generatedAt: new Date().toISOString(), ref: refRoot, layers };
  fs.writeFileSync(REPORT_PATH, JSON.stringify(report, null, 2));
  console.log(`\n✓ Relatório salvo em ${REPORT_PATH}`);
}

main();
