/**
 * check-stories.ts
 *
 * Verifica quais componentes definidos no design-system.config.json
 * possuem story no Storybook e quais estão faltando.
 *
 * Uso: npm run check:stories
 */

import fs from "fs";
import path from "path";

const ROOT = path.resolve(__dirname, "..");
const CONFIG_PATH = path.join(ROOT, "design-system.config.json");

interface Layer {
  name: string;
  description?: string;
  components?: string;
  stories: string;
  storyTitle?: string;
  depth?: "flat" | "recursive";
  ignore?: string[];
  tokensOnly?: boolean;
}

interface Config {
  layers: Layer[];
}

interface CheckResult {
  layer: string;
  component: string;
  hasStory: boolean;
  storyFile?: string;
}

function loadConfig(): Config {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.error("design-system.config.json not found at", CONFIG_PATH);
    process.exit(1);
  }
  return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
}

/**
 * Arquivo de TESTE nunca é componente — não faz sentido exigir story dele.
 *
 * Antes disso, cada teste colocado ao lado do componente (que é a convenção do
 * projeto: `Form/index.test.tsx`, `DynamicFieldsForm.test.tsx`) tinha que ser
 * acrescentado À MÃO na lista `ignore` do `design-system.config.json`, senão o
 * gate `check:stories` acusava "componente sem story" e caía de 100% para 99%.
 * Três entradas da config existiam só para isso, e a quarta apareceu ao criar
 * `Fields/Select.test.tsx` — sinal de que o custo era recorrente, não pontual.
 *
 * Excluir por sufixo resolve a classe: `.test.tsx` e `.spec.tsx` são convenção
 * universal e nenhuma delas descreve um componente do design system.
 */
function isTestFile(name: string): boolean {
  return name.endsWith(".test.tsx") || name.endsWith(".spec.tsx");
}

function getComponentFiles(dir: string, ignore: string[], depth: string): string[] {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];

  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    // Skip ignored entries
    if (ignore.some((ig) => entry.name === ig || entry.name.startsWith(ig))) continue;

    if (entry.isFile() && isTestFile(entry.name)) continue;

    if (entry.isFile() && entry.name.endsWith(".tsx")) {
      files.push(entry.name);
    } else if (entry.isDirectory() && depth === "recursive") {
      const subFiles = getComponentFiles(
        path.join(dir, entry.name),
        ignore,
        depth,
      );
      files.push(...subFiles.map((f) => path.join(entry.name, f)));
    }
  }

  return files;
}

function getStoryFiles(dir: string): string[] {
  const fullDir = path.join(ROOT, dir);
  if (!fs.existsSync(fullDir)) return [];

  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  const files: string[] = [];

  for (const entry of entries) {
    if (entry.isFile() && entry.name.endsWith(".stories.tsx")) {
      files.push(entry.name);
    }
  }

  return files;
}

function componentNameFromFile(filename: string): string {
  // Remove extension and path
  const base = path.basename(filename, ".tsx");
  // Handle kebab-case (ui components) → PascalCase for matching
  return base;
}

function storyNameFromFile(filename: string): string {
  return path.basename(filename, ".stories.tsx");
}

function findMatchingStory(
  componentName: string,
  storyNames: string[],
): string | undefined {
  // Exact match (case-insensitive)
  const match = storyNames.find(
    (s) => s.toLowerCase() === componentName.toLowerCase(),
  );
  if (match) return match;

  // kebab-case to PascalCase matching (e.g., "alert-dialog" → "AlertDialog")
  const pascalComponent = componentName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("");

  return storyNames.find(
    (s) => s.toLowerCase() === pascalComponent.toLowerCase(),
  );
}

function main() {
  const config = loadConfig();
  const results: CheckResult[] = [];
  let totalComponents = 0;
  let totalWithStories = 0;
  let totalMissing = 0;

  console.log("Design System — Story Coverage Report");
  console.log("=====================================\n");

  for (const layer of config.layers) {
    // Skip token-only layers (no component → story mapping)
    if (layer.tokensOnly) {
      const storyFiles = getStoryFiles(layer.stories);
      console.log(`📦 ${layer.name}`);
      console.log(`   ${storyFiles.length} stories (tokens, no component mapping)\n`);
      continue;
    }

    if (!layer.components) continue;

    const componentFiles = getComponentFiles(
      layer.components,
      layer.ignore || [],
      layer.depth || "flat",
    );
    const storyFiles = getStoryFiles(layer.stories);
    const storyNames = storyFiles.map(storyNameFromFile);

    console.log(`📦 ${layer.name} (${layer.components})`);

    const missing: string[] = [];
    const covered: string[] = [];

    for (const file of componentFiles) {
      const componentName = componentNameFromFile(file);
      const matchingStory = findMatchingStory(componentName, storyNames);
      totalComponents++;

      if (matchingStory) {
        totalWithStories++;
        covered.push(componentName);
        results.push({
          layer: layer.name,
          component: componentName,
          hasStory: true,
          storyFile: `${matchingStory}.stories.tsx`,
        });
      } else {
        totalMissing++;
        missing.push(componentName);
        results.push({
          layer: layer.name,
          component: componentName,
          hasStory: false,
        });
      }
    }

    // Print covered
    for (const name of covered) {
      console.log(`   ✅ ${name}`);
    }

    // Print missing
    for (const name of missing) {
      console.log(`   ❌ ${name} — sem story`);
    }

    const coverage = componentFiles.length > 0
      ? Math.round((covered.length / componentFiles.length) * 100)
      : 100;
    console.log(`   → ${covered.length}/${componentFiles.length} (${coverage}%)\n`);
  }

  // Summary
  console.log("─────────────────────────────────────");
  const totalCoverage = totalComponents > 0
    ? Math.round((totalWithStories / totalComponents) * 100)
    : 100;
  console.log(`Total: ${totalWithStories}/${totalComponents} componentes com story (${totalCoverage}%)`);

  if (totalMissing > 0) {
    console.log(`\n⚠️  ${totalMissing} componente(s) sem story.`);
    console.log("   Crie as stories faltantes em src/stories/\n");
    process.exit(1);
  } else {
    console.log(`\n✅ Todos os componentes possuem story!\n`);
    process.exit(0);
  }
}

main();
