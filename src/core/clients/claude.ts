import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient, LLMResponse } from "@/types";

export class ClaudeClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = response.content[0];
    
    return {
      text: block.type === "text" ? block.text : "",
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens ?? 0,
        completionTokens: response.usage.output_tokens ?? 0,
        totalTokens: (response.usage.input_tokens ?? 0) + (response.usage.output_tokens ?? 0),
      } : undefined
    };
  }
}

