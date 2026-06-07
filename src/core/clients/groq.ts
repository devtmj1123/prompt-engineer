import OpenAI from "openai";
import type { LLMClient, LLMResponse } from "@/types";

export class GroqClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    
    return {
      text: response.choices[0]?.message?.content ?? "",
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens,
      } : undefined
    };
  }
}
