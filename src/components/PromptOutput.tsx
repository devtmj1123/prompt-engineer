"use client";
import type { PromptEngineerResult } from "@/types";
import { useState } from "react";

interface Props {
  result: PromptEngineerResult | null;
  loading: boolean;
}

export function PromptOutput({ result, loading }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-4 rounded-lg bg-neu-surface w-2/3" />
        <div className="h-4 rounded-lg bg-neu-surface w-full" />
        <div className="h-4 rounded-lg bg-neu-surface w-5/6" />
        <div className="h-4 rounded-lg bg-neu-surface w-3/4" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-48 text-neu-text-muted text-sm">
        Your engineered prompt will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-neu-text-muted">
          Engineered Prompt
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg shadow-neu-btn bg-neu-bg text-neu-accent
            hover:text-white hover:bg-neu-accent transition-all font-medium animate-all"
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>

      <pre className="bg-neu-bg shadow-neu-inset rounded-xl p-4 font-mono text-xs
        text-green-400 overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap">
        {result.optimizedPrompt}
      </pre>

      <div className="bg-neu-bg shadow-neu-raised rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-neu-accent mb-2">
          Why This Works
        </p>
        <p className="text-xs text-neu-text-muted leading-relaxed">{result.explanation}</p>
      </div>
    </div>
  );
}
