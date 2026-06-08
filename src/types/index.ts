export type PromptCategory = "coding" | "image" | "writing" | "video";
export type ExecutionStrategy = "sequential" | "fan_out";
export type LLMProvider = "groq" | "cerebras" | "gemini" | "claude" | "openai" | "deepseek" | "xiaomi";

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
}

export interface LLMResponse {
  text: string;
  usage?: TokenUsage;
}

export interface PromptEngineerResult {
  optimizedPrompt: string;
  explanation: string;
  requiredTools: string[];
  executionStrategy: ExecutionStrategy;
  suggestedSubtasks?: string[];
  targetModel: string;
  category: PromptCategory;
  usage?: TokenUsage;
  webSearchResults?: WebSearchResult[];
}

export interface RefineRequest {
  rawPrompt: string;
  targetModel?: string;
  provider?: LLMProvider;
  category?: PromptCategory;
  customInstructions?: string;
  enableWebSearch?: boolean;
}

export interface EditRequest {
  currentPrompt: string;
  instruction: string;
  category: PromptCategory;
  targetModel: string;
  provider?: LLMProvider;
}


export interface ProviderConfig {
  apiKey: string;
  model: string;
}

export interface AppConfig {
  defaultProvider: LLMProvider;
  providers: Record<LLMProvider, ProviderConfig>;
}

export interface KnowledgeEntry {
  id: string;
  name: string;
  source: string;           // GitHub URL or "upload"
  addedAt: string;          // ISO timestamp
  description: string;
  localPath: string;        // Path under /knowledge/
}

export interface LLMClient {
  complete(systemPrompt: string, userMessage: string): Promise<LLMResponse>;
}

