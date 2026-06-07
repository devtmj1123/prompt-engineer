import OpenAI from "openai";
import type { LLMClient } from "@/types";

export class CerebrasClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey, baseURL: "https://api.cerebras.ai/v1" });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }
}
