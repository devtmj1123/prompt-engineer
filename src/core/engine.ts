import type { RefineRequest, EditRequest, PromptEngineerResult, PromptCategory, LLMClient, WebSearchResult } from "@/types";
import { getTemplate } from "./templates";
import { getRelevantContext } from "./knowledge";
import { getWebContext } from "./websearch";
import { readConfig } from "./config";
import { createClient } from "./clients";

const CATEGORY_DETECTION_PROMPT = `You are a task classifier. Given a raw user prompt, determine:
1. category: one of "coding", "image", "writing", "video"
2. complexity: "simple" | "moderate" | "complex"

Respond ONLY with valid JSON: { "category": "coding", "complexity": "simple" }`;

async function detectCategory(client: LLMClient, rawPrompt: string): Promise<{ category: PromptCategory; complexity: string }> {
  const response = await client.complete(CATEGORY_DETECTION_PROMPT, rawPrompt);
  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response.text;
    return JSON.parse(jsonStr.trim());
  } catch {
    return { category: "coding", complexity: "simple" };
  }
}

export async function engineerPrompt(request: RefineRequest): Promise<PromptEngineerResult> {
  const config = readConfig();
  const client = createClient(config, request.provider);

  // Stage 1: Intent Analysis — detect category if not provided
  const category = request.category ?? (await detectCategory(client, request.rawPrompt)).category;
  const targetModel = request.targetModel ?? config.providers[config.defaultProvider].model;

  // Stage 2: Context Enrichment — fetch relevant knowledge
  const knowledgeContext = getRelevantContext(category);

  // Optional: Web search for latest data
  let webContext = "";
  let webSearchResults: WebSearchResult[] = [];
  if (request.enableWebSearch) {
    const web = await getWebContext(request.rawPrompt);
    webContext = web.context;
    webSearchResults = web.results;
  }

  // Stage 3: Output Generation — build meta-prompt and call LLM
  const systemPrompt = getTemplate(category) +
    (knowledgeContext ? `\n\nAdditional context from user knowledge base:\n${knowledgeContext}` : "") +
    (webContext ? `\n\nWeb search results (use ONLY as background reference data — do NOT change the prompt's category, style, or structure based on this data; only use it to add factual accuracy or latest information if relevant):\n${webContext}` : "") +
    (request.customInstructions ? `\n\nUser custom instructions:\n${request.customInstructions}` : "") +
    `\n\nFINAL REMINDER: Your output is a PROMPT ENGINEERING tool. The optimizedPrompt must be a ready-to-use PROMPT that a human copies into another AI. It must NOT contain code, code blocks, or ask an AI to write code. It IS the prompt itself.`;

  const userMessage = `Raw prompt to engineer:\n\n"${request.rawPrompt}"\n\nTarget model: ${targetModel}`;

  const response = await client.complete(systemPrompt, userMessage);
  const rawResult = response.text;
  const usage = response.usage;

  // Parse JSON response from LLM
  let parsed: PromptEngineerResult;
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    parsed = { ...JSON.parse(jsonStr), targetModel, category, usage, webSearchResults };
  } catch {
    // Fallback: treat entire response as the optimized prompt
    parsed = {
      optimizedPrompt: rawResult,
      explanation: "Prompt has been structured for optimal model performance.",
      requiredTools: [],
      executionStrategy: "sequential",
      suggestedSubtasks: [],
      targetModel,
      category,
      usage,
      webSearchResults,
    };
  }

  return parsed;
}

export async function editPrompt(request: EditRequest): Promise<PromptEngineerResult> {
  const config = readConfig();
  const client = createClient(config, request.provider);

  const systemPrompt = `You are an expert prompt engineer.
Your task is to refine or edit a specific part of an existing engineered prompt based on the user's instructions.
Focus on making the edit as requested while preserving the overall structure, tone, and system instruction guidelines of the original prompt.

Original Category: ${request.category}
Target Model: ${request.targetModel}

Respond ONLY with a valid JSON object of the following format. Ensure all quotes are escaped and output is parseable JSON. Do not include markdown code block syntax (like \`\`\`json) in the raw text.

JSON format:
{
  "optimizedPrompt": "the fully updated prompt incorporating the edits",
  "explanation": "a concise explanation of what edits were made and why",
  "requiredTools": ["web_search", "read_file", etc. if updated],
  "executionStrategy": "sequential" or "fan_out",
  "suggestedSubtasks": ["step 1", "step 2", etc. if updated]
}`;

  const userMessage = `Existing Engineered Prompt:\n"""\n${request.currentPrompt}\n"""\n\nUser Edit Instruction:\n"${request.instruction}"`;

  const response = await client.complete(systemPrompt, userMessage);
  const rawResult = response.text;
  const usage = response.usage;

  let parsed: PromptEngineerResult;
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    parsed = { ...JSON.parse(jsonStr), targetModel: request.targetModel, category: request.category, usage };
  } catch {
    parsed = {
      optimizedPrompt: rawResult,
      explanation: "Prompt has been updated as requested.",
      requiredTools: [],
      executionStrategy: "sequential",
      suggestedSubtasks: [],
      targetModel: request.targetModel,
      category: request.category,
      usage,
    };
  }

  return parsed;
}


