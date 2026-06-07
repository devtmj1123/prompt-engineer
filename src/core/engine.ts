import type { RefineRequest, PromptEngineerResult, PromptCategory, LLMClient } from "@/types";
import { getTemplate } from "./templates";
import { getRelevantContext } from "./knowledge";
import { readConfig } from "./config";
import { createClient } from "./clients";

const CATEGORY_DETECTION_PROMPT = `You are a task classifier. Given a raw user prompt, determine:
1. category: one of "coding", "image", "writing", "video"
2. complexity: "simple" | "moderate" | "complex"

Respond ONLY with valid JSON: { "category": "coding", "complexity": "simple" }`;

async function detectCategory(client: LLMClient, rawPrompt: string): Promise<{ category: PromptCategory; complexity: string }> {
  const result = await client.complete(CATEGORY_DETECTION_PROMPT, rawPrompt);
  try {
    const jsonMatch = result.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : result;
    return JSON.parse(jsonStr.trim());
  } catch {
    return { category: "coding", complexity: "simple" };
  }
}

export async function engineerPrompt(request: RefineRequest): Promise<PromptEngineerResult> {
  const config = readConfig();
  const client = createClient(config);

  // Stage 1: Intent Analysis — detect category if not provided
  const category = request.category ?? (await detectCategory(client, request.rawPrompt)).category;
  const targetModel = request.targetModel ?? config.providers[config.defaultProvider].model;

  // Stage 2: Context Enrichment — fetch relevant knowledge
  const knowledgeContext = getRelevantContext(category);

  // Stage 3: Output Generation — build meta-prompt and call LLM
  const systemPrompt = getTemplate(category) +
    (knowledgeContext ? `\n\nAdditional context from user knowledge base:\n${knowledgeContext}` : "") +
    (request.customInstructions ? `\n\nUser custom instructions:\n${request.customInstructions}` : "");

  const userMessage = `Raw prompt to engineer:\n\n"${request.rawPrompt}"\n\nTarget model: ${targetModel}`;

  const rawResult = await client.complete(systemPrompt, userMessage);

  // Parse JSON response from LLM
  let parsed: PromptEngineerResult;
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    parsed = { ...JSON.parse(jsonStr), targetModel, category };
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
    };
  }

  return parsed;
}
