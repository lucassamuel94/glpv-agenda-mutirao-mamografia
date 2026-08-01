import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

interface ComponentEntry {
  name: string;
  category: string;
  description: string;
}

export interface ListComponentsInput {
  category?: string;
}

export function listComponents(input: ListComponentsInput): ComponentEntry[] {
  const filePath = path.join(DATA_DIR, "components.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("components.json not found. Run 'npm run build:mcp-data' first.");
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  let components: ComponentEntry[] = data.components.map((c: any) => ({
    name: c.name,
    category: c.category,
    description: c.description,
  }));

  if (input.category) {
    components = components.filter(
      (c) => c.category.toLowerCase() === input.category!.toLowerCase(),
    );
  }

  return components;
}
