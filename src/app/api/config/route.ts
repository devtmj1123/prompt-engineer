import { NextRequest, NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/core/config";

export async function GET() {
  const config = readConfig();
  // Mask API keys for security — only return whether they are set
  const masked = structuredClone(config);
  for (const provider of Object.keys(masked.providers) as Array<keyof typeof masked.providers>) {
    masked.providers[provider].apiKey = masked.providers[provider].apiKey ? "***set***" : "";
  }
  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    const config = readConfig();
    
    if (updates.defaultProvider) {
      config.defaultProvider = updates.defaultProvider;
    }
    if (updates.providers) {
      for (const p of Object.keys(updates.providers) as Array<keyof typeof config.providers>) {
        if (config.providers[p]) {
          const incomingKey = updates.providers[p].apiKey;
          const apiKey = incomingKey === "***set***" ? config.providers[p].apiKey : (incomingKey ?? config.providers[p].apiKey);
          config.providers[p] = {
            apiKey: apiKey,
            model: updates.providers[p].model ?? config.providers[p].model,
          };
        }
      }
    }
    writeConfig(config);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
