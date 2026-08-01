import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

export interface GetComponentInput {
  name: string;
}

export function getComponent(input: GetComponentInput) {
  const filePath = path.join(DATA_DIR, "components.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("components.json not found. Run 'npm run build:mcp-data' first.");
  }

  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const component = data.components.find(
    (c: any) => c.name.toLowerCase() === input.name.toLowerCase(),
  );

  if (!component) {
    const available = data.components.map((c: any) => c.name).join(", ");
    throw new Error(`Component "${input.name}" not found. Available: ${available}`);
  }

  return component;
}
