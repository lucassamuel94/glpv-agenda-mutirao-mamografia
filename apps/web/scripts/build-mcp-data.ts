import fs from "fs";
import path from "path";
import * as csstree from "css-tree";

const ROOT = path.resolve(__dirname, "..");
const GLOBALS_CSS = path.join(ROOT, "src/app/globals.css");
const OUTPUT_DIR = path.join(ROOT, "mcp-server/data");
const CONFIG_PATH = path.join(ROOT, "design-system.config.json");

interface DesignSystemLayer {
  name: string;
  components?: string;
  stories: string;
  storyTitle?: string;
  ignore?: string[];
  tokensOnly?: boolean;
}

function loadDesignSystemConfig(): DesignSystemLayer[] {
  if (!fs.existsSync(CONFIG_PATH)) {
    console.warn("  ⚠ design-system.config.json not found, scanning all src/stories/");
    return [{ name: "All", stories: "src/stories", storyTitle: "All" }];
  }
  const config = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
  return config.layers;
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function remToPx(rem: string): string | null {
  const match = rem.match(/^([\d.]+)rem$/);
  if (!match) return null;
  return `${parseFloat(match[1]) * 16}px`;
}

interface TokenValue {
  value: string;
  css: string;
  px?: string;
  format?: string;
}

interface Tokens {
  colors: Record<string, TokenValue>;
  spacing: Record<string, TokenValue>;
  radius: TokenValue;
  typography: {
    font: string;
    letterSpacing: Record<string, string>;
    lineHeight: Record<string, string>;
  };
  inputHeights: Record<string, TokenValue>;
  gaps: Record<string, TokenValue>;
  borderWidths: Record<string, TokenValue>;
  themes: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

function extractTokens(): Tokens {
  const css = fs.readFileSync(GLOBALS_CSS, "utf-8");
  const ast = csstree.parse(css);

  const lightVars: Record<string, string> = {};
  const darkVars: Record<string, string> = {};

  csstree.walk(ast, {
    visit: "Rule",
    enter(node) {
      if (node.prelude.type !== "SelectorList") return;
      const selectorText = csstree.generate(node.prelude);
      const isDark = selectorText.includes(".dark");
      const isRoot = selectorText.includes(":root");
      if (!isDark && !isRoot) return;
      const target = isDark ? darkVars : lightVars;
      if (node.block.type === "Block") {
        node.block.children.forEach((decl) => {
          if (decl.type === "Declaration" && decl.property.startsWith("--")) {
            target[decl.property] = csstree.generate(decl.value).trim();
          }
        });
      }
    },
  });

  const colorNames = [
    "background", "foreground", "card", "card-foreground",
    "popover", "popover-foreground", "primary", "primary-foreground",
    "secondary", "secondary-foreground", "muted", "muted-foreground",
    "accent", "accent-foreground", "destructive", "destructive-foreground",
    "border", "input", "ring",
    "sidebar-bg", "sidebar-text", "sidebar-text-muted",
    "shell-bg", "shell-surface", "shell-border", "sidebar-hover", "sidebar-active",
  ];

  const colors: Record<string, TokenValue> = {};
  for (const name of colorNames) {
    const cssVar = `--${name}`;
    if (lightVars[cssVar]) {
      colors[name] = { value: lightVars[cssVar], css: cssVar, format: "hsl" };
    }
  }

  const spacing: Record<string, TokenValue> = {};
  for (const [key, value] of Object.entries(lightVars)) {
    if (key.startsWith("--spacing-")) {
      const name = key.replace("--spacing-", "");
      spacing[name] = { value, css: key };
      const px = remToPx(value);
      if (px) spacing[name].px = px;
    }
  }

  const inputHeights: Record<string, TokenValue> = {};
  for (const [key, value] of Object.entries(lightVars)) {
    if (key.startsWith("--input-height")) {
      const name = key === "--input-height" ? "default" : key.replace("--input-height-", "");
      inputHeights[name] = { value, css: key };
      const px = remToPx(value);
      if (px) inputHeights[name].px = px;
    }
  }

  const gaps: Record<string, TokenValue> = {};
  for (const [key, value] of Object.entries(lightVars)) {
    if (key.startsWith("--gap-")) {
      const name = key.replace("--gap-", "");
      gaps[name] = { value, css: key };
      const px = remToPx(value);
      if (px) gaps[name].px = px;
    }
  }

  const borderWidths: Record<string, TokenValue> = {};
  for (const [key, value] of Object.entries(lightVars)) {
    if (key.startsWith("--border-width")) {
      const name = key === "--border-width" ? "default" : key.replace("--border-width-", "");
      borderWidths[name] = { value, css: key };
    }
  }

  const radiusValue = lightVars["--radius"] || "0.4rem";

  const themeLight: Record<string, string> = {};
  const themeDark: Record<string, string> = {};
  for (const name of colorNames) {
    const cssVar = `--${name}`;
    if (lightVars[cssVar]) themeLight[name] = lightVars[cssVar];
    if (darkVars[cssVar]) themeDark[name] = darkVars[cssVar];
  }

  return {
    colors,
    spacing,
    radius: { value: radiusValue, css: "--radius" },
    typography: {
      font: "Inter",
      letterSpacing: { tight: "-0.022em", normal: "-0.011em" },
      lineHeight: { body: "1.6", heading: "1.3" },
    },
    inputHeights,
    gaps,
    borderWidths,
    themes: { light: themeLight, dark: themeDark },
  };
}

interface ComponentProp {
  type: string;
  values?: string[];
  default?: string;
  description?: string;
}

interface ComponentMeta {
  name: string;
  category: string;
  path: string;
  description: string;
  props: Record<string, ComponentProp>;
  subComponents?: string[];
  usage: string;
  screenshots: string[];
}

function extractCvaVariants(content: string, variantName: string): string[] {
  const regex = new RegExp(`${variantName}:\\s*\\{([^}]+)\\}`, "g");
  const match = regex.exec(content);
  if (!match) return [];
  const block = match[1];
  const keys: string[] = [];
  const keyRegex = /["']?(\w[\w-]*)["']?\s*:/g;
  let keyMatch;
  while ((keyMatch = keyRegex.exec(block)) !== null) {
    keys.push(keyMatch[1]);
  }
  return keys;
}

function extractDefaultVariant(content: string, variantName: string): string | undefined {
  const regex = new RegExp(`defaultVariants:\\s*\\{[^}]*${variantName}:\\s*["']([^"']+)["']`, "s");
  const match = regex.exec(content);
  return match ? match[1] : undefined;
}

function extractComponentMeta(storyFile: string): ComponentMeta | null {
  const storyContent = fs.readFileSync(storyFile, "utf-8");
  const titleMatch = storyContent.match(/title:\s*["']([^"']+)["']/);
  if (!titleMatch) return null;
  const title = titleMatch[1];
  const parts = title.split("/");
  const category = parts[0];
  const name = parts[parts.length - 1];

  const importMatch = storyContent.match(/from\s+["'](@\/components\/[^"']+)["']/);
  if (!importMatch) return null;
  const importPath = importMatch[1].replace("@/", "src/");

  const componentFile = path.join(ROOT, importPath + (importPath.endsWith(".tsx") ? "" : ".tsx"));
  if (!fs.existsSync(componentFile)) return null;
  const componentContent = fs.readFileSync(componentFile, "utf-8");

  const props: Record<string, ComponentProp> = {};

  const variants = extractCvaVariants(componentContent, "variant");
  if (variants.length > 0) {
    props["variant"] = {
      type: "enum",
      values: variants,
      default: extractDefaultVariant(componentContent, "variant"),
    };
  }

  const sizes = extractCvaVariants(componentContent, "size");
  if (sizes.length > 0) {
    props["size"] = {
      type: "enum",
      values: sizes,
      default: extractDefaultVariant(componentContent, "size"),
    };
  }

  const booleanPropsRegex = /(\w+)\??\s*:\s*boolean/g;
  let boolMatch;
  while ((boolMatch = booleanPropsRegex.exec(componentContent)) !== null) {
    const propName = boolMatch[1];
    if (!props[propName] && !["asChild"].includes(propName)) {
      props[propName] = { type: "boolean", default: "false" };
    }
  }

  const stringPropsRegex = /(\w+)\??\s*:\s*string(?:\s*;)/g;
  let strMatch;
  while ((strMatch = stringPropsRegex.exec(componentContent)) !== null) {
    const propName = strMatch[1];
    if (!props[propName] && !["className", "displayName"].includes(propName)) {
      props[propName] = { type: "string" };
    }
  }

  const subComponents: string[] = [];
  const exportRegex = /export\s+(?:const|function)\s+(\w+)/g;
  let expMatch;
  while ((expMatch = exportRegex.exec(componentContent)) !== null) {
    const exportName = expMatch[1];
    if (exportName !== name && !exportName.endsWith("Props") && !exportName.endsWith("Variants") && !exportName.startsWith("use")) {
      subComponents.push(exportName);
    }
  }

  const argsMatch = storyContent.match(/args:\s*\{([^}]+)\}/);
  let usage = `<${name} />`;
  if (argsMatch) {
    const argsBlock = argsMatch[1];
    const argPairs: string[] = [];
    const argRegex = /(\w+):\s*["']([^"']+)["']/g;
    let argMatch2;
    while ((argMatch2 = argRegex.exec(argsBlock)) !== null) {
      if (argMatch2[1] === "children") continue;
      argPairs.push(`${argMatch2[1]}="${argMatch2[2]}"`);
    }
    const childrenMatch = argsBlock.match(/children:\s*["']([^"']+)["']/);
    const children = childrenMatch ? childrenMatch[1] : "";
    usage = children
      ? `<${name} ${argPairs.join(" ")}>${children}</${name}>`
      : `<${name} ${argPairs.join(" ")} />`;
  }

  const jsdocMatch = componentContent.match(/\/\*\*\s*\n\s*\*\s*([^\n]+)/);
  const description = jsdocMatch
    ? jsdocMatch[1].replace(/\*\s*$/, "").trim()
    : `${name} component`;

  const screenshots: string[] = [];
  const storyExportRegex = /export\s+const\s+(\w+):\s*Story/g;
  let storyExpMatch;
  while ((storyExpMatch = storyExportRegex.exec(storyContent)) !== null) {
    screenshots.push(`${name}-${storyExpMatch[1]}.png`);
  }

  return {
    name,
    category,
    path: importPath + ".tsx",
    description,
    props,
    subComponents: subComponents.length > 0 ? subComponents : undefined,
    usage,
    screenshots,
  };
}

function extractAllComponents(): ComponentMeta[] {
  const components: ComponentMeta[] = [];
  const layers = loadDesignSystemConfig();

  function walkDir(dir: string) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walkDir(fullPath);
      } else if (entry.name.endsWith(".stories.tsx")) {
        const meta = extractComponentMeta(fullPath);
        if (meta) components.push(meta);
      }
    }
  }

  for (const layer of layers) {
    if (layer.tokensOnly) continue;
    const storiesDir = path.join(ROOT, layer.stories);
    walkDir(storiesDir);
  }

  return components;
}

function main() {
  console.log("Building MCP data...\n");
  ensureDir(OUTPUT_DIR);
  ensureDir(path.join(OUTPUT_DIR, "screenshots"));

  console.log("1. Extracting design tokens from globals.css...");
  const tokens = extractTokens();
  fs.writeFileSync(path.join(OUTPUT_DIR, "tokens.json"), JSON.stringify(tokens, null, 2));
  console.log(`   ✓ ${Object.keys(tokens.colors).length} colors, ${Object.keys(tokens.spacing).length} spacing tokens\n`);

  console.log("2. Extracting component metadata from stories...");
  const components = extractAllComponents();
  fs.writeFileSync(path.join(OUTPUT_DIR, "components.json"), JSON.stringify({ components }, null, 2));
  console.log(`   ✓ ${components.length} components cataloged\n`);

  console.log("Done! Output written to mcp-server/data/");
  console.log("  - tokens.json");
  console.log("  - components.json");
}

main();
