import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

export interface GetDesignTokensInput {
  group?: string;
}

export function getDesignTokens(input: GetDesignTokensInput) {
  const filePath = path.join(DATA_DIR, "tokens.json");
  if (!fs.existsSync(filePath)) {
    throw new Error("tokens.json not found. Run 'npm run build:mcp-data' first.");
  }

  const tokens = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  if (input.group) {
    const group = input.group.toLowerCase();
    if (!(group in tokens)) {
      const available = Object.keys(tokens).join(", ");
      throw new Error(`Token group "${input.group}" not found. Available: ${available}`);
    }
    return { [group]: tokens[group] };
  }

  return tokens;
}
