"use client";
import type { PromptEngineerResult } from "@/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";
import { 
  faSearch, 
  faFileLines, 
  faTerminal, 
  faRobot, 
  faPenToSquare, 
  faWrench,
  faSitemap,
  faArrowDownLong
} from "@fortawesome/free-solid-svg-icons";

interface Props {
  result: PromptEngineerResult | null;
}

const TOOL_ICONS: Record<string, IconDefinition> = {
  web_search: faSearch,
  read_file: faFileLines,
  bash: faTerminal,
  subagent: faRobot,
  write_file: faPenToSquare,
};

export function ExecutionPlan({ result }: Props) {
  if (!result || (!result.requiredTools.length && !result.suggestedSubtasks?.length)) return null;

  return (
    <div className="flex flex-col gap-3 anim-fade-up">
      <p className="text-xs font-bold uppercase tracking-widest th-muted">
        Execution Plan
      </p>

      {result.requiredTools.length > 0 && (
        <div className="th-bg th-raised rounded-xl p-4 anim-fade-up anim-delay-1">
          <p className="text-xs font-semibold th-muted mb-2">Required Tools</p>
          <div className="flex flex-wrap gap-2">
            {result.requiredTools.map((tool) => (
              <span key={tool} className="text-xs px-3 py-1 rounded-full th-surface
                th-accent font-semibold th-raised flex items-center gap-1.5">
                <FontAwesomeIcon icon={TOOL_ICONS[tool] ?? faWrench} className="w-3 h-3" />
                <span>{tool}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {result.suggestedSubtasks && result.suggestedSubtasks.length > 0 && (
        <div className="th-bg th-raised rounded-xl p-4 anim-fade-up anim-delay-1">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold th-muted">Strategy:</p>
            <span className={`text-xs px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1.5 ${
              result.executionStrategy === "fan_out"
                ? "bg-purple-500/10 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300"
                : "bg-blue-500/10 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300"
            }`}>
              <FontAwesomeIcon 
                icon={result.executionStrategy === "fan_out" ? faSitemap : faArrowDownLong} 
                className="w-3 h-3" 
              />
              <span>{result.executionStrategy === "fan_out" ? "Fan-Out Subagents" : "Sequential"}</span>
            </span>
          </div>
          <ol className="flex flex-col gap-1">
            {result.suggestedSubtasks.map((task, i) => (
              <li key={i} className="text-xs th-muted flex items-start gap-2">
                <span className="th-accent font-bold shrink-0">{i + 1}.</span>
                <span>{task}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

