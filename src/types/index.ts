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
  discovery?: DomainDiscovery;
}

/** Step 1 output: expert-level domain knowledge extracted before prompt generation */
export interface DomainDiscovery {
  keyFormulas: string[];        // critical formulas, patterns, or algorithms
  commonPitfalls: string[];     // mistakes 90% of developers/creators make
  edgeCases: string[];          // boundary conditions and gotchas
  expertInsights: string[];     // non-obvious tricks, optimizations, or best practices
  suggestedStructure: string;   // recommended approach/architecture
  missingContext: string[];     // what the user forgot to specify
}

export interface RefineRequest {
  rawPrompt: string;
  targetModel?: string;
  provider?: LLMProvider;
  apiKey?: string;
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
  apiKey?: string;
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

