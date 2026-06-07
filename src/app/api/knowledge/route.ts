import { NextRequest, NextResponse } from "next/server";
import { readIndex, addFromGitHub, addFromUpload, deleteEntry } from "@/core/knowledge";

export async function GET() {
  return NextResponse.json(readIndex());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.githubUrl) {
      const entry = await addFromGitHub(body.githubUrl);
      return NextResponse.json(entry);
    } else if (body.filename && body.content) {
      const entry = addFromUpload(body.filename, body.content);
      return NextResponse.json(entry);
    } else {
      return NextResponse.json({ error: "Provide githubUrl or filename+content" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    deleteEntry(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
