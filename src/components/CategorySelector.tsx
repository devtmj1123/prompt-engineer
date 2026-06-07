"use client";
import type { PromptCategory } from "@/types";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faWandMagicSparkles, faCode, faPalette, faPenNib, faFilm } from "@fortawesome/free-solid-svg-icons";

const CATEGORIES = [
  { value: "coding" as const, label: "Coding", icon: faCode },
  { value: "image" as const, label: "Image", icon: faPalette },
  { value: "writing" as const, label: "Writing", icon: faPenNib },
  { value: "video" as const, label: "Video", icon: faFilm },
];

interface Props {
  value: PromptCategory | "auto";
  onChange: (value: PromptCategory | "auto") => void;
}

export function CategorySelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest th-muted mb-2">
        Category
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
        <button
          onClick={() => onChange("auto")}
          className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press ${
            value === "auto"
              ? "th-inset th-accent"
              : "th-surface th-muted th-raised hover:th-accent"
          }`}
        >
          <FontAwesomeIcon icon={faWandMagicSparkles} className="w-3.5 h-3.5 shrink-0" />
          <span>Auto</span>
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`rounded-xl px-3 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer btn-press ${
              value === cat.value
                ? "th-inset th-accent"
                : "th-surface th-muted th-raised hover:th-accent"
            }`}
          >
            <FontAwesomeIcon icon={cat.icon} className="w-3.5 h-3.5 shrink-0" />
            <span>{cat.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

