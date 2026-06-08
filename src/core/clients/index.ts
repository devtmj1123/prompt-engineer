import type { LLMClient, LLMProvider, AppConfig } from "@/types";
import { GroqClient } from "./groq";
import { CerebrasClient } from "./cerebras";
import { GeminiClient } from "./gemini";
import { ClaudeClient } from "./claude";
import { OpenAIClient } from "./openai";
import { DeepSeekClient } from "./deepseek";
import { XiaomiClient } from "./xiaomi";

export function createClient(
  config: AppConfig,
  overrideProvider?: LLMProvider,
  overrideApiKey?: string
): LLMClient {
  const provider = overrideProvider ?? config.defaultProvider;
  const providerConfig = config.providers[provider];
  const apiKey = overrideApiKey || providerConfig?.apiKey;

  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${provider}. Set it in Settings or as an environment variable.`);
  }

  const model = providerConfig?.model ?? "";

  switch (provider) {
    case "groq":     return new GroqClient(apiKey, model);
    case "cerebras": return new CerebrasClient(apiKey, model);
    case "gemini":   return new GeminiClient(apiKey, model);
    case "claude":   return new ClaudeClient(apiKey, model);
    case "openai":   return new OpenAIClient(apiKey, model);
    case "deepseek": return new DeepSeekClient(apiKey, model);
    case "xiaomi":   return new XiaomiClient(apiKey, model);
    default:         throw new Error(`Unknown provider: ${provider}`);
  }
}
