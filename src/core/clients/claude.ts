import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient } from "@/types";

export class ClaudeClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }
}
