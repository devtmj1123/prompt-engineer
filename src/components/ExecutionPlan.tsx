"use client";
import type { PromptEngineerResult } from "@/types";

interface Props {
  result: PromptEngineerResult | null;
}

const TOOL_ICONS: Record<string, string> = {
  web_search: "🔍",
  read_file: "📄",
  bash: "💻",
  subagent: "🤖",
  write_file: "📝",
};

export function ExecutionPlan({ result }: Props) {
  if (!result || (!result.requiredTools.length && !result.suggestedSubtasks?.length)) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-neu-text-muted">
        Execution Plan
      </p>

      {result.requiredTools.length > 0 && (
        <div className="bg-neu-bg shadow-neu-raised rounded-xl p-4">
          <p className="text-xs font-semibold text-neu-text-muted mb-2">Required Tools</p>
          <div className="flex flex-wrap gap-2">
            {result.requiredTools.map((tool) => (
              <span key={tool} className="text-xs px-3 py-1 rounded-full bg-neu-surface
                text-neu-accent font-medium shadow-neu-raised">
                {TOOL_ICONS[tool] ?? "🔧"} {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.suggestedSubtasks && result.suggestedSubtasks.length > 0 && (
        <div className="bg-neu-bg shadow-neu-raised rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-neu-text-muted">Strategy:</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              result.executionStrategy === "fan_out"
                ? "bg-purple-900 text-purple-300"
                : "bg-blue-900 text-blue-300"
            }`}>
              {result.executionStrategy === "fan_out" ? "🌐 Fan-Out Subagents" : "⬇️ Sequential"}
            </span>
          </div>
          <ol className="flex flex-col gap-1">
            {result.suggestedSubtasks.map((task, i) => (
              <li key={i} className="text-xs text-neu-text-muted flex items-start gap-2">
                <span className="text-neu-accent font-bold shrink-0">{i + 1}.</span>
                {task}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
