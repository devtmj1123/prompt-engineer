#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { engineerPrompt } from "../src/core/engine";
import type { PromptCategory, LLMProvider } from "../src/types";

const server = new Server(
  { name: "prompt-engineer", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "refine_prompt",
      description:
        "Engineers a professional, structured prompt from a raw natural language intent. " +
        "Analyzes the task, selects the right template, enriches with knowledge context, " +
        "and returns the optimized prompt along with required tools and an execution strategy.",
      inputSchema: {
        type: "object",
        properties: {
          rawPrompt: { type: "string", description: "The raw natural language intent to engineer." },
          provider: { type: "string", enum: ["groq", "cerebras", "gemini", "claude", "openai", "deepseek", "xiaomi"], description: "AI provider to use. Uses default provider if not specified." },
          apiKey: { type: "string", description: "API key for the provider. Overrides config/env if specified." },
          targetModel: { type: "string", description: "Target AI model name (e.g. 'gpt-4o', 'claude-sonnet-4-20250514', 'gemini-2.0-flash'). Uses provider's default if not specified." },
          category: { type: "string", enum: ["coding", "image", "writing", "video"], description: "Prompt category. Auto-detected if not provided." },
          customInstructions: { type: "string", description: "Additional constraints or instructions to factor in." },
        },
        required: ["rawPrompt"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "refine_prompt") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  const args = request.params.arguments as {
    rawPrompt: string;
    provider?: LLMProvider;
    apiKey?: string;
    targetModel?: string;
    category?: PromptCategory;
    customInstructions?: string;
  };
  const result = await engineerPrompt(args);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
