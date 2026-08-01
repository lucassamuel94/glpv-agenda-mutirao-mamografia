import { execSync } from "child_process";
import { chromium } from "playwright";
import fs from "fs";
import path from "path";
import http from "http";

const ROOT = path.resolve(__dirname, "..");
const STATIC_DIR = path.join(ROOT, "storybook-static");
const OUTPUT_DIR = path.join(ROOT, "mcp-server/data/screenshots");
const PORT = 6007;

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

async function waitForServer(url: string, maxRetries = 30): Promise<void> {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw new Error(`Server at ${url} did not start`);
}

async function main() {
  console.log("Capturing Storybook screenshots...\n");

  console.log("1. Building static Storybook...");
  execSync("npm run build-storybook", { cwd: ROOT, stdio: "inherit" });

  if (!fs.existsSync(STATIC_DIR)) {
    throw new Error("Storybook build failed — storybook-static/ not found");
  }

  console.log("\n2. Starting local server...");
  const handler = (req: http.IncomingMessage, res: http.ServerResponse) => {
    const urlPath = req.url === "/" ? "/index.html" : req.url || "/index.html";
    const filePath = path.join(STATIC_DIR, urlPath);
    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      const mimeTypes: Record<string, string> = {
        ".html": "text/html",
        ".js": "application/javascript",
        ".css": "text/css",
        ".json": "application/json",
        ".png": "image/png",
        ".svg": "image/svg+xml",
        ".woff": "font/woff",
        ".woff2": "font/woff2",
        ".ttf": "font/ttf",
      };
      res.writeHead(200, { "Content-Type": mimeTypes[ext] || "application/octet-stream" });
      fs.createReadStream(filePath).pipe(res);
    } else {
      // Try index.html for SPA routing
      const indexPath = path.join(STATIC_DIR, "index.html");
      if (fs.existsSync(indexPath)) {
        res.writeHead(200, { "Content-Type": "text/html" });
        fs.createReadStream(indexPath).pipe(res);
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    }
  };

  const server = http.createServer(handler);
  server.listen(PORT);
  console.log(`   Serving at http://localhost:${PORT}`);

  await waitForServer(`http://localhost:${PORT}`);

  console.log("\n3. Fetching story index...");
  const indexRes = await fetch(`http://localhost:${PORT}/index.json`);
  const index = (await indexRes.json()) as { v: number; entries: Record<string, { id: string; title: string; name: string; type: string }> };

  const stories = Object.values(index.entries).filter((e) => e.type === "story");
  console.log(`   Found ${stories.length} stories`);

  ensureDir(OUTPUT_DIR);
  console.log("\n4. Capturing screenshots...");

  const browser = await chromium.launch();
  const context = await browser.newContext({ viewport: { width: 800, height: 600 } });
  const page = await context.newPage();

  for (const story of stories) {
    const url = `http://localhost:${PORT}/iframe.html?id=${story.id}&viewMode=story`;

    try {
      await page.goto(url, { waitUntil: "load" });

      // Wait for Storybook to finish rendering the story
      // The story content renders inside #storybook-root
      await page.waitForFunction(
        () => {
          const root = document.querySelector("#storybook-root");
          if (!root) return false;
          // Must have child elements (not empty/loading)
          if (root.children.length === 0) return false;
          // Check there's no Storybook loading indicator
          const loading = document.querySelector("[aria-label='loading']");
          if (loading) return false;
          return true;
        },
        { timeout: 10000 },
      ).catch(() => {
        // fallback: if the function times out, still try to capture
      });

      // Extra settle time for CSS transitions and fonts
      await page.waitForTimeout(300);

      const titleParts = story.title.split("/");
      const componentName = titleParts[titleParts.length - 1];
      const filename = `${componentName}-${story.name.replace(/\s+/g, "")}.png`;

      await page.screenshot({ path: path.join(OUTPUT_DIR, filename) });
      console.log(`   ✓ ${filename}`);
    } catch (err) {
      console.error(`   ✗ ${story.id}: ${err}`);
    }
  }

  await page.close();
  await browser.close();
  server.close();

  console.log("\n5. Cleaning up...");
  fs.rmSync(STATIC_DIR, { recursive: true, force: true });

  console.log(`\nDone! ${stories.length} screenshots saved to mcp-server/data/screenshots/`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
