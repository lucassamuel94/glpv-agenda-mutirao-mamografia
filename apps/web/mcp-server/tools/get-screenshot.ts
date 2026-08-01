import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "data");

export interface GetScreenshotInput {
  component: string;
  story: string;
}

export function getScreenshot(input: GetScreenshotInput) {
  const filename = `${input.component}-${input.story.replace(/\s+/g, "")}.png`;
  const filePath = path.join(DATA_DIR, "screenshots", filename);

  if (!fs.existsSync(filePath)) {
    const screenshotsDir = path.join(DATA_DIR, "screenshots");
    if (!fs.existsSync(screenshotsDir)) {
      throw new Error("No screenshots found. Run 'npm run build:mcp-screenshots' first.");
    }
    const available = fs.readdirSync(screenshotsDir).filter((f) => f.endsWith(".png"));
    throw new Error(
      `Screenshot "${filename}" not found. Available: ${available.join(", ")}`,
    );
  }

  const imageBuffer = fs.readFileSync(filePath);
  const base64 = imageBuffer.toString("base64");

  return {
    image: `data:image/png;base64,${base64}`,
    filename,
  };
}
