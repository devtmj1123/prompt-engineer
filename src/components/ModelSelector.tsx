"use client";
const MODELS = [
  { label: "Groq — Llama 3.3 70B Versatile", value: "llama-3.3-70b-versatile", provider: "groq" },
  { label: "Cerebras — Llama 3.1 70B", value: "llama3.1-70b", provider: "cerebras" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash", provider: "gemini" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest", provider: "claude" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
        Target AI Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neu-bg text-neu-text rounded-xl px-4 py-3 text-sm
          shadow-neu-inset border-none outline-none cursor-pointer
          focus:ring-2 focus:ring-neu-accent transition-all"
      >
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
