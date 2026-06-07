"use client";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { ModelSelector } from "@/components/ModelSelector";
import { CategorySelector } from "@/components/CategorySelector";
import { PromptOutput } from "@/components/PromptOutput";
import { ExecutionPlan } from "@/components/ExecutionPlan";
import { Footer } from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faSpinner } from "@fortawesome/free-solid-svg-icons";
import type { PromptEngineerResult, PromptCategory } from "@/types";

export default function WorkspacePage() {
  const [rawPrompt, setRawPrompt] = useState("");
  const [targetModel, setTargetModel] = useState("llama-3.3-70b-versatile");
  const [category, setCategory] = useState<PromptCategory | "auto">("auto");
  const [customInstructions, setCustomInstructions] = useState("");
  const [result, setResult] = useState<PromptEngineerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [refining, setRefining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load from history if flagged
  useEffect(() => {
    try {
      const loadData = localStorage.getItem("prompt_engineer_load_history");
      if (loadData) {
        const item = JSON.parse(loadData);
        setRawPrompt(item.rawPrompt ?? "");
        setTargetModel(item.targetModel ?? "llama-3.3-70b-versatile");
        setCategory(item.category ?? "auto");
        setCustomInstructions(item.customInstructions ?? "");
        setResult(item.result ?? null);
        localStorage.removeItem("prompt_engineer_load_history");
      }
    } catch (err) {
      // Ignore load errors
    }
  }, []);

  async function handleSaveToHistory(res: PromptEngineerResult, customInst: string) {
    try {
      const historyItem = {
        id: Math.random().toString(36).substring(2, 9),
        timestamp: Date.now(),
        rawPrompt,
        targetModel: res.targetModel,
        category: res.category,
        customInstructions: customInst,
        result: res
      };
      const existing = JSON.parse(localStorage.getItem("prompt_history") || "[]");
      localStorage.setItem("prompt_history", JSON.stringify([historyItem, ...existing]));
    } catch (err) {
      // Ignore local storage write errors
    }
  }

  async function handleEngineer() {
    if (!rawPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawPrompt,
          targetModel,
          category: category === "auto" ? undefined : category,
          customInstructions: customInstructions || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to engineer prompt");
      setResult(data);
      await handleSaveToHistory(data, customInstructions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefine(instruction: string) {
    if (!result || !instruction.trim()) return;
    setRefining(true);
    setError(null);
    try {
      const res = await fetch("/api/edit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPrompt: result.optimizedPrompt,
          instruction,
          category: result.category,
          targetModel: result.targetModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to edit prompt");
      setResult(data);
      const updatedInstructions = customInstructions 
        ? `${customInstructions}\n[Edit]: ${instruction}` 
        : `[Edit]: ${instruction}`;
      setCustomInstructions(updatedInstructions);
      await handleSaveToHistory(data, updatedInstructions);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Refinement failed");
    } finally {
      setRefining(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Left Pane — Input */}
        <div className="th-bg th-raised rounded-2xl p-6 flex flex-col gap-5 anim-fade-left">
          <div>
            <h1 className="text-lg font-bold th-text mb-1">Prompt Engineer</h1>
            <p className="text-xs th-muted">
              Describe your intent in plain language. We'll engineer the perfect prompt.
            </p>
          </div>

          <ModelSelector value={targetModel} onChange={setTargetModel} />
          <CategorySelector value={category} onChange={setCategory} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest th-muted mb-2">
              Your Raw Intent
            </label>
            <textarea
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              placeholder="e.g., build me a realtime chat app with websockets..."
              className="w-full h-40 th-bg th-inset rounded-xl px-4 py-3
                text-sm th-text placeholder:th-muted resize-none
                border-none outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest th-muted mb-2">
              Custom Instructions (optional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., use TypeScript, prefer functional components, no external dependencies..."
              className="w-full h-20 th-bg th-inset rounded-xl px-4 py-3
                text-sm th-text placeholder:th-muted resize-none
                border-none outline-none focus:ring-2 focus:ring-[var(--accent)] transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-500 bg-red-500/10 rounded-xl px-4 py-2 border border-red-500/20">{error}</p>
          )}

          <button
            onClick={handleEngineer}
            disabled={loading || refining || !rawPrompt.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all
              th-bg th-btn th-accent hover:bg-[var(--accent)] hover:text-white hover:shadow-none
              disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer btn-press"
          >
            {loading ? (
              <>
                <FontAwesomeIcon icon={faSpinner} className="w-4 h-4 animate-spin" />
                <span>Engineering...</span>
              </>
            ) : (
              <>
                <FontAwesomeIcon icon={faWandMagicSparkles} className="w-4 h-4" />
                <span>Engineer Prompt</span>
              </>
            )}
          </button>
        </div>

        {/* Right Pane — Output */}
        <div className="th-bg th-raised rounded-2xl p-6 flex flex-col gap-5 anim-fade-right anim-delay-1">
          <PromptOutput 
            result={result} 
            loading={loading} 
            refining={refining} 
            onRefine={handleRefine} 
          />
          <ExecutionPlan result={result} />
        </div>
      </main>
      <Footer />
    </div>
  );
}


