import { GoogleGenAI } from "@google/genai";
import type { LLMClient, LLMResponse } from "@/types";

export class GeminiClient implements LLMClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<LLMResponse> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: userMessage,
      config: { systemInstruction: systemPrompt },
    });
    
    return {
      text: response.text ?? "",
      usage: response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount ?? 0,
        completionTokens: response.usageMetadata.candidatesTokenCount ?? 0,
        totalTokens: response.usageMetadata.totalTokenCount ?? 0,
      } : undefined
    };
  }
}

