import type { LLMClient, LLMProvider, AppConfig } from "@/types";
import { GroqClient } from "./groq";
import { CerebrasClient } from "./cerebras";
import { GeminiClient } from "./gemini";
import { ClaudeClient } from "./claude";
import { OpenAIClient } from "./openai";
import { DeepSeekClient } from "./deepseek";

export function createClient(config: AppConfig, overrideProvider?: LLMProvider): LLMClient {
  const provider = overrideProvider ?? config.defaultProvider;
  const providerConfig = config.providers[provider];
  if (!providerConfig || !providerConfig.apiKey) {
    throw new Error(`No API key configured for provider: ${provider}. Run 'prompt-eng config' to set it up.`);
  }
  switch (provider) {
    case "groq":     return new GroqClient(providerConfig.apiKey, providerConfig.model);
    case "cerebras": return new CerebrasClient(providerConfig.apiKey, providerConfig.model);
    case "gemini":   return new GeminiClient(providerConfig.apiKey, providerConfig.model);
    case "claude":   return new ClaudeClient(providerConfig.apiKey, providerConfig.model);
    case "openai":   return new OpenAIClient(providerConfig.apiKey, providerConfig.model);
    case "deepseek": return new DeepSeekClient(providerConfig.apiKey, providerConfig.model);
    default:         throw new Error(`Unknown provider: ${provider}`);
  }
}

