"use client";
import { useState, useRef, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faCheck, faPencil } from "@fortawesome/free-solid-svg-icons";

const PROVIDERS = [
  { key: "groq", label: "Groq", placeholder: "llama-3.3-70b-versatile" },
  { key: "cerebras", label: "Cerebras", placeholder: "llama3.1-70b" },
  { key: "gemini", label: "Google Gemini", placeholder: "gemini-2.0-flash" },
  { key: "claude", label: "Anthropic Claude", placeholder: "claude-sonnet-4-20250514" },
  { key: "openai", label: "OpenAI", placeholder: "gpt-4o" },
  { key: "deepseek", label: "DeepSeek", placeholder: "deepseek-chat" },
  { key: "xiaomi", label: "Xiaomi (Mimo)", placeholder: "mimo-chat" },
];

interface Props {
  provider: string;
  model: string;
  onProviderChange: (provider: string) => void;
  onModelChange: (model: string) => void;
}

export function ModelSelector({ provider, model = "", onProviderChange, onModelChange }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedProvider = PROVIDERS.find((p) => p.key === provider) ?? PROVIDERS[0];

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="anim-fade-up flex flex-col gap-3">
      {/* Provider Dropdown */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest th-muted mb-2">
          AI Provider
        </label>
        <div className="relative" ref={containerRef}>
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center justify-between th-bg th-inset rounded-xl px-4 py-3 text-sm
              th-text border-none outline-none cursor-pointer text-left
              focus:ring-2 focus:ring-[var(--accent)] transition-all btn-press"
          >
            <span className="truncate">{selectedProvider.label}</span>
            <FontAwesomeIcon
              icon={faChevronDown}
              className={`w-3.5 h-3.5 th-muted transition-transform duration-200 ${
                isOpen ? "transform rotate-180" : ""
              }`}
            />
          </button>

          {isOpen && (
            <div className="absolute left-0 right-0 mt-2 z-50 th-surface th-raised rounded-xl p-1.5 flex flex-col gap-1 border th-border anim-scale-in">
              {PROVIDERS.map((p) => {
                const isSelected = p.key === provider;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      onProviderChange(p.key);
                      setIsOpen(false);
                    }}
                    className={`w-full text-left px-3.5 py-2.5 rounded-lg text-sm transition-all flex items-center justify-between cursor-pointer ${
                      isSelected
                        ? "th-inset th-accent font-semibold"
                        : "hover:th-surface hover:th-raised th-text"
                    }`}
                  >
                    <span className="truncate">{p.label}</span>
                    {isSelected && (
                      <FontAwesomeIcon icon={faCheck} className="w-3.5 h-3.5 th-accent shrink-0 ml-2" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Model Text Input */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-widest th-muted mb-2">
          Model Name
        </label>
        <div className="relative">
          <FontAwesomeIcon
            icon={faPencil}
            className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 th-muted pointer-events-none"
          />
          <input
            type="text"
            value={model}
            onChange={(e) => onModelChange(e.target.value)}
            placeholder={selectedProvider.placeholder}
            className="w-full th-bg th-inset rounded-xl pl-10 pr-4 py-3 text-sm
              th-text placeholder:th-muted border-none outline-none
              focus:ring-2 focus:ring-[var(--accent)] transition-all"
          />
        </div>
        <p className="text-[10px] th-muted mt-1.5 ml-1">
          Type any model supported by {selectedProvider.label}. Leave empty for default: <span className="th-text font-mono">{selectedProvider.placeholder}</span>
        </p>
      </div>
    </div>
  );
}
