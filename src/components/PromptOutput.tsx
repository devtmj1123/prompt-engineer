"use client";
import type { PromptEngineerResult } from "@/types";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck, faLightbulb, faWandMagicSparkles, faSpinner } from "@fortawesome/free-solid-svg-icons";

interface Props {
  result: PromptEngineerResult | null;
  loading: boolean;
  refining?: boolean;
  onRefine?: (instruction: string) => Promise<void>;
}

export function PromptOutput({ result, loading, refining = false, onRefine }: Props) {
  const [copied, setCopied] = useState(false);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function handleSubmitRefine() {
    if (!refineInstruction.trim() || !onRefine) return;
    try {
      await onRefine(refineInstruction);
      setRefineInstruction("");
      setShowRefineInput(false);
    } catch (err) {
      // Error handled by parent
    }
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
    <div className="flex flex-col gap-4 anim-fade-up">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest th-muted">
          Engineered Prompt
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-2 rounded-lg th-btn th-bg th-accent
            hover:bg-[var(--accent)] hover:text-white hover:shadow-none transition-all font-semibold flex items-center gap-1.5 cursor-pointer btn-press"
        >
          <FontAwesomeIcon icon={copied ? faCheck : faCopy} className="w-3.5 h-3.5" />
          <span>{copied ? "Copied!" : "Copy"}</span>
        </button>
      </div>

      <pre className="th-bg th-inset rounded-xl p-4 font-mono text-xs anim-scale-in
        text-emerald-600 dark:text-emerald-400 overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap">
        {result.optimizedPrompt}
      </pre>

      {onRefine && (
        <div className="th-bg th-raised rounded-xl p-4 flex flex-col gap-3">
          <div className="flex justify-between items-center">
            <button
              onClick={() => setShowRefineInput(!showRefineInput)}
              className="text-xs font-bold uppercase tracking-widest th-accent flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
            >
              <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5" />
              <span>Refine with AI</span>
            </button>
          </div>

          {showRefineInput && (
            <div className="flex flex-col gap-2 anim-slide-down">
              <textarea
                value={refineInstruction}
                onChange={(e) => setRefineInstruction(e.target.value)}
                placeholder="What would you like to edit? (e.g. 'Add comments', 'Change database config to Postgres', 'Make tone more casual')"
                disabled={refining}
                className="w-full h-16 th-bg th-inset rounded-xl px-3 py-2 text-xs th-text placeholder:th-muted resize-none border-none outline-none focus:ring-1 focus:ring-[var(--accent)]"
              />
              <div className="flex justify-end">
                <button
                  onClick={handleSubmitRefine}
                  disabled={refining || !refineInstruction.trim()}
                  className="text-xs px-3 py-2 rounded-lg th-btn th-bg th-accent hover:bg-[var(--accent)] hover:text-white hover:shadow-none transition-all font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed btn-press"
                >
                  {refining ? (
                    <>
                      <FontAwesomeIcon icon={faSpinner} className="w-3 h-3 animate-spin" />
                      <span>Refining...</span>
                    </>
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3 h-3" />
                      <span>Apply Edit</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="th-bg th-raised rounded-xl p-4 anim-fade-up anim-delay-2">
        <p className="text-xs font-bold uppercase tracking-widest th-accent mb-2 flex items-center gap-1.5">
          <FontAwesomeIcon icon={faLightbulb} className="w-3.5 h-3.5" />
          <span>Why This Works</span>
        </p>
        <p className="text-xs th-muted leading-relaxed">{result.explanation}</p>
      </div>
    </div>
  );
}


