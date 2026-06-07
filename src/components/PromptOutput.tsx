"use client";
import type { PromptEngineerResult } from "@/types";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck, faLightbulb } from "@fortawesome/free-solid-svg-icons";

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
        <div className="h-4 rounded-lg th-surface w-2/3" />
        <div className="h-4 rounded-lg th-surface w-full" />
        <div className="h-4 rounded-lg th-surface w-5/6" />
        <div className="h-4 rounded-lg th-surface w-3/4" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-48 th-muted text-sm">
        Your engineered prompt will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest th-muted">
          Engineered Prompt
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-2 rounded-lg th-btn th-bg th-accent
            hover:bg-[var(--accent)] hover:text-white hover:shadow-none transition-all font-semibold flex items-center gap-1.5 cursor-pointer"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3.5 h-3.5" />
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>

      <pre className="th-bg th-inset rounded-xl p-4 font-mono text-xs
        text-emerald-600 dark:text-emerald-400 overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap">
        {result.optimizedPrompt}
      </pre>

      <div className="th-bg th-raised rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-widest th-accent mb-2 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faLightbulb} className="w-3.5 h-3.5" />
          <span>Why This Works</span>
        </p>
        <p className="text-xs th-muted leading-relaxed">{result.explanation}</p>
      </div>
    </div>
  );
}

