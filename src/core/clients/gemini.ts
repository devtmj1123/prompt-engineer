import { GoogleGenAI } from "@google/genai";
import type { LLMClient } from "@/types";

export class GeminiClient implements LLMClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: userMessage,
      config: { systemInstruction: systemPrompt },
    });
    return response.text ?? "";
  }
}
