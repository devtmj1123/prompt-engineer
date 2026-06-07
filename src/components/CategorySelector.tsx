"use client";
import type { PromptCategory } from "@/types";

const CATEGORIES: Array<{ value: PromptCategory; label: string; icon: string }> = [
  { value: "coding", label: "Coding & Engineering", icon: "💻" },
  { value: "image", label: "Image Generation", icon: "🎨" },
  { value: "writing", label: "Writing & Persona", icon: "✍️" },
  { value: "video", label: "Video Generation", icon: "🎬" },
];

interface Props {
  value: PromptCategory | "auto";
  onChange: (value: PromptCategory | "auto") => void;
}

export function CategorySelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
        Category
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange("auto")}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            value === "auto"
              ? "bg-neu-accent text-white shadow-neu-btn"
              : "bg-neu-bg text-neu-text-muted shadow-neu-raised hover:text-neu-accent"
          }`}
        >
          🤖 Auto Detect
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
              value === cat.value
                ? "bg-neu-accent text-white shadow-neu-btn"
                : "bg-neu-bg text-neu-text-muted shadow-neu-raised hover:text-neu-accent"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
