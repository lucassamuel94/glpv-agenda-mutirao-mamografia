import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { listComponents } from "./tools/list-components.js";
import { getComponent } from "./tools/get-component.js";
import { getDesignTokens } from "./tools/get-design-tokens.js";
import { getScreenshot } from "./tools/get-screenshot.js";

const server = new McpServer({
  name: "ezcrm-design-system",
  version: "1.0.0",
});

server.tool(
  "list_components",
  "List all available UI components in the ezCRM design system, optionally filtered by category (UI, Components, Form Fields, Design Tokens)",
  {
    category: z
      .string()
      .optional()
      .describe("Filter by category: 'UI', 'Components', 'Form Fields', or 'Design Tokens'"),
  },
  async ({ category }) => {
    try {
      const result = listComponents({ category });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  },
);

server.tool(
  "get_component",
  "Get detailed information about a specific component: props, variants, usage example, sub-components, and screenshot filenames",
  {
    name: z.string().describe("Component name (e.g., 'Button', 'Card', 'Input')"),
  },
  async ({ name }) => {
    try {
      const result = getComponent({ name });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  },
);

server.tool(
  "get_design_tokens",
  "Get design tokens (colors, spacing, typography, radius, input heights, themes) from the ezCRM design system",
  {
    group: z
      .string()
      .optional()
      .describe("Token group: 'colors', 'spacing', 'typography', 'radius', 'inputHeights', 'gaps', 'borderWidths', 'themes'"),
  },
  async ({ group }) => {
    try {
      const result = getDesignTokens({ group });
      return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  },
);

server.tool(
  "get_screenshot",
  "Get a screenshot (base64 PNG) of a specific component story from the ezCRM design system",
  {
    component: z.string().describe("Component name (e.g., 'Button')"),
    story: z.string().describe("Story name (e.g., 'Primary', 'AllVariants')"),
  },
  async ({ component, story }) => {
    try {
      const result = getScreenshot({ component, story });
      return {
        content: [
          {
            type: "image",
            data: result.image.replace("data:image/png;base64,", ""),
            mimeType: "image/png",
          },
        ],
      };
    } catch (err: any) {
      return { content: [{ type: "text", text: `Error: ${err.message}` }], isError: true };
    }
  },
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("MCP Server failed to start:", err);
  process.exit(1);
});
