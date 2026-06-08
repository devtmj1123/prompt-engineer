import { NextRequest, NextResponse } from "next/server";
import { engineerPromptV2 } from "@/core/engine-v2";
import type { RefineRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: RefineRequest = await req.json();
    if (!body.rawPrompt?.trim()) {
      return NextResponse.json({ error: "rawPrompt is required" }, { status: 400 });
    }
    const result = await engineerPromptV2(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
