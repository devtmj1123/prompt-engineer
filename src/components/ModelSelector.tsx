"use client";
import { CustomSelect } from "./CustomSelect";

const MODELS = [
  { label: "Groq — Llama 3.3 70B Versatile", value: "llama-3.3-70b-versatile" },
  { label: "Cerebras — Llama 3.1 70B", value: "llama3.1-70b" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div className="anim-fade-up">
      <CustomSelect
        label="Target AI Model"
        options={MODELS}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}



