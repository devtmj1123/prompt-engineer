"use client";
import type { PromptEngineerResult, DomainDiscovery } from "@/types";
import { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCopy, faCheck, faLightbulb, faWandMagicSparkles, faSpinner, faBatteryFull, faGlobe, faChevronDown, faExternalLink, faBrain, faTriangleExclamation, faBolt, faMagnifyingGlass } from "@fortawesome/free-solid-svg-icons";

function hasDiscoveryContent(d: DomainDiscovery): boolean {
  return (
    (d.keyFormulas?.length ?? 0) > 0 ||
    (d.commonPitfalls?.length ?? 0) > 0 ||
    (d.edgeCases?.length ?? 0) > 0 ||
    (d.expertInsights?.length ?? 0) > 0 ||
    !!d.suggestedStructure ||
    (d.missingContext?.length ?? 0) > 0
  );
}

function DiscoverySection({ icon, color, title, items }: {
  icon: typeof faLightbulb;
  color: string;
  title: string;
  items: string[];
}) {
  return (
    <div className="th-bg th-inset rounded-lg px-3 py-2">
      <p className={`text-[10px] font-bold uppercase tracking-widest ${color} mb-1.5 flex items-center gap-1`}>
        <FontAwesomeIcon icon={icon} className="w-2.5 h-2.5" />
        {title}
      </p>
      <ul className="flex flex-col gap-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs th-muted leading-relaxed flex gap-1.5">
            <span className={`${color} mt-0.5 shrink-0`}>•</span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  result: PromptEngineerResult | null;
  loading: boolean;
  refining?: boolean;
  autoDetected?: boolean;
  onRefine?: (instruction: string) => Promise<void>;
}

export function PromptOutput({ result, loading, refining = false, autoDetected = false, onRefine }: Props) {
  const [copied, setCopied] = useState(false);
  const [showRefineInput, setShowRefineInput] = useState(false);
  const [refineInstruction, setRefineInstruction] = useState("");
  const [showWebResults, setShowWebResults] = useState(false);
  const [showDiscovery, setShowDiscovery] = useState(false);

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
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold uppercase tracking-widest th-muted">
            Engineered Prompt
          </span>
          {result.usage && (
            <span className="text-[10px] px-2 py-0.5 rounded-full th-inset th-text flex items-center gap-1 opacity-70">
              <FontAwesomeIcon icon={faBatteryFull} className="w-2.5 h-2.5" />
              {result.usage.totalTokens} tokens
            </span>
          )}
          {autoDetected && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full th-accent bg-[var(--accent)]/10 font-semibold capitalize">
              Detected: {result.category}
            </span>
          )}
          {result.webSearchResults && result.webSearchResults.length > 0 && (
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 dark:text-blue-300 font-semibold flex items-center gap-1">
              <FontAwesomeIcon icon={faGlobe} className="w-2.5 h-2.5" />
              Web: {result.webSearchResults.length} results
            </span>
          )}
        </div>
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

      {/* Domain Discovery (v2) */}
      {result.discovery && hasDiscoveryContent(result.discovery) && (
          <div className="th-bg th-raised rounded-xl p-4 anim-fade-up anim-delay-3">
            <button
              type="button"
              onClick={() => setShowDiscovery(!showDiscovery)}
              className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest th-muted hover:th-text transition-colors cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faBrain} className="w-3.5 h-3.5 text-purple-400" />
                <span>Expert Knowledge Injected</span>
              </span>
              <FontAwesomeIcon
                icon={faChevronDown}
                className={`w-3 h-3 transition-transform duration-200 ${showDiscovery ? "rotate-180" : ""}`}
              />
            </button>
            {showDiscovery && (
              <div className="mt-3 flex flex-col gap-3 anim-slide-down">
                {result.discovery.keyFormulas?.length > 0 && (
                  <DiscoverySection
                    icon={faBolt}
                    color="text-amber-400"
                    title="Key Formulas & Patterns"
                    items={result.discovery.keyFormulas}
                  />
                )}
                {result.discovery.commonPitfalls?.length > 0 && (
                  <DiscoverySection
                    icon={faTriangleExclamation}
                    color="text-red-400"
                    title="Common Pitfalls Avoided"
                    items={result.discovery.commonPitfalls}
                  />
                )}
                {result.discovery.edgeCases?.length > 0 && (
                  <DiscoverySection
                    icon={faMagnifyingGlass}
                    color="text-blue-400"
                    title="Edge Cases Handled"
                    items={result.discovery.edgeCases}
                  />
                )}
                {result.discovery.expertInsights?.length > 0 && (
                  <DiscoverySection
                    icon={faLightbulb}
                    color="text-emerald-400"
                    title="Expert Insights"
                    items={result.discovery.expertInsights}
                  />
                )}
                {result.discovery.suggestedStructure && (
                  <div className="th-bg th-inset rounded-lg px-3 py-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest th-muted mb-1">Recommended Structure</p>
                    <p className="text-xs th-text leading-relaxed">{result.discovery.suggestedStructure}</p>
                  </div>
                )}
                {result.discovery.missingContext?.length > 0 && (
                  <DiscoverySection
                    icon={faMagnifyingGlass}
                    color="text-orange-400"
                    title="Missing Context (auto-filled)"
                    items={result.discovery.missingContext}
                  />
                )}
              </div>
            )}
          </div>
      )}

      {/* Web Search Results */}
      {result.webSearchResults && result.webSearchResults.length > 0 && (
        <div className="th-bg th-raised rounded-xl p-4 anim-fade-up anim-delay-3">
          <button
            type="button"
            onClick={() => setShowWebResults(!showWebResults)}
            className="w-full flex items-center justify-between text-xs font-bold uppercase tracking-widest th-muted hover:th-text transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <FontAwesomeIcon icon={faGlobe} className="w-3.5 h-3.5 text-blue-400" />
              <span>Web Sources Used ({result.webSearchResults.length})</span>
            </span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`w-3 h-3 transition-transform duration-200 ${showWebResults ? "rotate-180" : ""}`}
            />
          </button>
          {showWebResults && (
            <div className="mt-3 flex flex-col gap-2 anim-slide-down">
              {result.webSearchResults.map((r, i) => (
                <div key={i} className="th-bg th-inset rounded-lg px-3 py-2">
                  <p className="text-xs font-semibold th-text truncate">{r.title}</p>
                  {r.snippet && (
                    <p className="text-[11px] th-muted mt-0.5 line-clamp-2">{r.snippet}</p>
                  )}
                  {r.url && (
                    <a
                      href={r.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:underline mt-1 inline-flex items-center gap-1 truncate max-w-full"
                    >
                      <FontAwesomeIcon icon={faExternalLink} className="w-2.5 h-2.5 shrink-0" />
                      <span className="truncate">{r.url}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


