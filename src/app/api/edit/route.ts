import { NextRequest, NextResponse } from "next/server";
import { editPrompt } from "@/core/engine";
import type { EditRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: EditRequest = await req.json();
    if (!body.currentPrompt?.trim()) {
      return NextResponse.json({ error: "currentPrompt is required" }, { status: 400 });
    }
    if (!body.instruction?.trim()) {
      return NextResponse.json({ error: "instruction is required" }, { status: 400 });
    }
    const result = await editPrompt(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
