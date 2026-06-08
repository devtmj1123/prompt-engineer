import type { RefineRequest, EditRequest, PromptEngineerResult, PromptCategory, LLMClient, DomainDiscovery, WebSearchResult } from "@/types";
import { getRelevantContext } from "./knowledge";
import { getWebContext } from "./websearch";
import { readConfig } from "./config";
import { createClient } from "./clients";
import { getDiscoveryPrompt, getInjectionPrompt } from "./templates-v2";

// ============================================================
// Category Detection (shared with v1)
// ============================================================

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

// ============================================================
// JSON parsing helpers
// ============================================================

/**
 * Strip markdown code block wrappers (```json ... ``` or ``` ... ```)
 * that LLMs sometimes wrap around JSON responses.
 */
function stripMarkdownCodeBlocks(raw: string): string {
  // Match ```json\n...``` or ```\n...```
  const match = raw.match(/```(?:json)?\s*\n?([\s\S]*?)```/);
  if (match) return match[1].trim();
  return raw.trim();
}

function parseJsonResponse<T>(raw: string): T | null {
  const cleaned = stripMarkdownCodeBlocks(raw);
  try {
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : cleaned;
    return JSON.parse(jsonStr.trim()) as T;
  } catch {
    return null;
  }
}

/**
 * Clean the optimized prompt text — strip any JSON artifacts,
 * markdown wrappers, or field labels that leaked into the output.
 */
function cleanPromptText(text: string): string {
  let cleaned = stripMarkdownCodeBlocks(text);

  // If it looks like a JSON object with optimizedPrompt field, extract it
  const fieldMatch = cleaned.match(/"optimizedPrompt"\s*:\s*"([\s\S]*?)"\s*[,}]/);
  if (fieldMatch) {
    cleaned = fieldMatch[1]
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }

  // Strip leading/trailing quotes if the whole thing is wrapped
  if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
    cleaned = cleaned.slice(1, -1);
  }

  return cleaned.trim();
}

/**
 * Build a meaningful fallback explanation from discovery data
 * when the LLM fails to return a valid JSON explanation.
 */
function buildFallbackExplanation(d: DomainDiscovery): string {
  const parts: string[] = [];

  if (d.keyFormulas?.length) {
    parts.push(`Injected ${d.keyFormulas.length} critical formula(s)/pattern(s)`);
  }
  if (d.commonPitfalls?.length) {
    parts.push(`avoided ${d.commonPitfalls.length} known pitfall(s)`);
  }
  if (d.edgeCases?.length) {
    parts.push(`addressed ${d.edgeCases.length} edge case(s)`);
  }
  if (d.expertInsights?.length) {
    parts.push(`incorporated ${d.expertInsights.length} expert insight(s)`);
  }
  if (d.missingContext?.length) {
    parts.push(`filled in ${d.missingContext.length} missing specification(s)`);
  }

  if (parts.length === 0) {
    return "Prompt has been structured for optimal model performance.";
  }

  return `Expert knowledge augmented: ${parts.join(", ")}. The prompt was restructured to incorporate domain-specific expertise that a generic rewrite would miss.`;
}

// ============================================================
// STEP 1: Domain Discovery — Expert knowledge extraction
// ============================================================

async function discoverDomainKnowledge(
  client: LLMClient,
  rawPrompt: string,
  category: PromptCategory,
  knowledgeContext: string,
  webContext: string
): Promise<DomainDiscovery> {
  const discoveryPrompt = getDiscoveryPrompt(category);

  const contextBlock = [
    knowledgeContext ? `User's knowledge base:\n${knowledgeContext}` : "",
    webContext ? `Latest web search results:\n${webContext}` : "",
  ].filter(Boolean).join("\n\n");

  const userMessage = `User's raw intent:\n"${rawPrompt}"` +
    (contextBlock ? `\n\nAdditional context:\n${contextBlock}` : "");

  const response = await client.complete(discoveryPrompt, userMessage);
  const parsed = parseJsonResponse<DomainDiscovery>(response.text);

  // Graceful fallback if parsing fails
  return parsed ?? {
    keyFormulas: [],
    commonPitfalls: [],
    edgeCases: [],
    expertInsights: [],
    suggestedStructure: "",
    missingContext: [],
  };
}

// ============================================================
// STEP 2: Knowledge Injection — Augmented prompt generation
// ============================================================

async function generateAugmentedPrompt(
  client: LLMClient,
  rawPrompt: string,
  category: PromptCategory,
  discovery: DomainDiscovery,
  targetModel: string,
  customInstructions?: string
): Promise<{ optimizedPrompt: string; explanation: string; requiredTools: string[]; executionStrategy: string; suggestedSubtasks: string[] }> {
  const injectionPrompt = getInjectionPrompt(category, discovery);

  const userMessage = `Raw prompt to engineer:\n\n"${rawPrompt}"\n\nTarget model: ${targetModel}` +
    (customInstructions ? `\n\nUser custom instructions:\n${customInstructions}` : "");

  const response = await client.complete(injectionPrompt, userMessage);
  const parsed = parseJsonResponse<{
    optimizedPrompt: string;
    explanation: string;
    requiredTools: string[];
    executionStrategy: string;
    suggestedSubtasks: string[];
  }>(response.text);

  if (parsed?.optimizedPrompt) {
    return {
      ...parsed,
      optimizedPrompt: cleanPromptText(parsed.optimizedPrompt),
    };
  }

  // Fallback — clean the raw response and build explanation from discovery
  const fallbackExplanation = buildFallbackExplanation(discovery);
  return {
    optimizedPrompt: cleanPromptText(response.text),
    explanation: fallbackExplanation,
    requiredTools: [],
    executionStrategy: "sequential",
    suggestedSubtasks: [],
  };
}

// ============================================================
// MAIN: Two-Step Augmentation Pipeline
// ============================================================

export async function engineerPromptV2(request: RefineRequest): Promise<PromptEngineerResult> {
  const config = readConfig();
  const client = createClient(config, request.provider, request.apiKey);

  // Stage 1: Intent Analysis — detect category
  const category = request.category ?? (await detectCategory(client, request.rawPrompt)).category;
  const targetModel = request.targetModel ?? config.providers[config.defaultProvider].model;

  // Stage 2: Context Collection — knowledge + web search
  const knowledgeContext = getRelevantContext(category);

  let webContext = "";
  let webSearchResults: WebSearchResult[] = [];
  if (request.enableWebSearch) {
    const web = await getWebContext(request.rawPrompt);
    webContext = web.context;
    webSearchResults = web.results;
  }

  // ========================================
  // STEP 1: Domain Discovery
  // "What does a senior expert know that the user doesn't?"
  // ========================================
  const discovery = await discoverDomainKnowledge(
    client, request.rawPrompt, category, knowledgeContext, webContext
  );

  // ========================================
  // STEP 2: Knowledge Injection
  // "Build a prompt that incorporates this expert knowledge"
  // ========================================
  const generated = await generateAugmentedPrompt(
    client, request.rawPrompt, category, discovery, targetModel, request.customInstructions
  );

  return {
    optimizedPrompt: generated.optimizedPrompt,
    explanation: generated.explanation,
    requiredTools: generated.requiredTools,
    executionStrategy: generated.executionStrategy as "sequential" | "fan_out",
    suggestedSubtasks: generated.suggestedSubtasks,
    targetModel,
    category,
    webSearchResults,
    discovery,
  };
}

// ============================================================
// Edit (same as v1 — uses v1 template for quick edits)
// ============================================================

export async function editPromptV2(request: EditRequest): Promise<PromptEngineerResult> {
  const config = readConfig();
  const client = createClient(config, request.provider, request.apiKey);

  const systemPrompt = `You are an expert prompt engineer.
Your task is to refine or edit a specific part of an existing engineered prompt based on the user's instructions.
Focus on making the edit as requested while preserving the overall structure, tone, and system instruction guidelines of the original prompt.

Original Category: ${request.category}
Target Model: ${request.targetModel}

Respond ONLY with a valid JSON object:
{
  "optimizedPrompt": "the fully updated prompt incorporating the edits",
  "explanation": "a concise explanation of what edits were made and why",
  "requiredTools": [],
  "executionStrategy": "sequential",
  "suggestedSubtasks": []
}`;

  const userMessage = `Existing Engineered Prompt:\n"""\n${request.currentPrompt}\n"""\n\nUser Edit Instruction:\n"${request.instruction}"`;

  const response = await client.complete(systemPrompt, userMessage);
  const usage = response.usage;

  let parsed: PromptEngineerResult;
  try {
    const jsonMatch = response.text.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : response.text;
    parsed = { ...JSON.parse(jsonStr), targetModel: request.targetModel, category: request.category, usage };
  } catch {
    parsed = {
      optimizedPrompt: response.text,
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
