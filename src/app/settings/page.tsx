"use client";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faFloppyDisk, faCheck } from "@fortawesome/free-solid-svg-icons";
import { CustomSelect } from "@/components/CustomSelect";

const PROVIDERS = [
  { key: "groq", label: "Groq", defaultModel: "llama-3.3-70b-versatile" },
  { key: "cerebras", label: "Cerebras", defaultModel: "llama3.1-70b" },
  { key: "gemini", label: "Google Gemini", defaultModel: "gemini-2.0-flash" },
  { key: "claude", label: "Anthropic Claude", defaultModel: "claude-3-5-sonnet-latest" },
  { key: "openai", label: "OpenAI", defaultModel: "gpt-4o" },
  { key: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat" },
];

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [defaultProvider, setDefaultProvider] = useState("groq");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then((data) => {
        setDefaultProvider(data.defaultProvider ?? "groq");
        const k: Record<string, string> = {};
        for (const p of PROVIDERS) {
          k[p.key] = data.providers?.[p.key]?.apiKey === "***set***" ? "***set***" : "";
        }
        setKeys(k);
      });
  }, []);

  async function handleSave() {
    const providers: Record<string, { apiKey: string; model: string }> = {};
    for (const p of PROVIDERS) {
      providers[p.key] = { apiKey: keys[p.key] ?? "", model: p.defaultModel };
    }
    await fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultProvider, providers }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const selectOptions = PROVIDERS.map((p) => ({ label: p.label, value: p.key }));

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full mt-4 flex flex-col gap-4">
        <div className="th-bg th-raised rounded-2xl p-6 flex flex-col gap-5 anim-fade-up">
          <h1 className="text-lg font-bold th-text flex items-center gap-2">
            <FontAwesomeIcon icon={faGear} className="w-4 h-4 th-accent" />
            <span>Settings</span>
          </h1>

          <div>
            <CustomSelect
              label="Default Provider"
              options={selectOptions}
              value={defaultProvider}
              onChange={setDefaultProvider}
            />
          </div>

          {PROVIDERS.map((p) => (
            <div key={p.key}>
              <label className="block text-xs font-bold uppercase tracking-widest th-muted mb-2">
                {p.label} API Key
              </label>
              <input
                type="password"
                placeholder={keys[p.key] === "***set***" ? "API Key is set (enter to overwrite)" : `Enter ${p.label} API key...`}
                value={keys[p.key] ?? ""}
                onChange={(e) => setKeys((k) => ({ ...k, [p.key]: e.target.value }))}
                className="w-full th-bg th-inset rounded-xl px-4 py-3 text-sm
                  th-text placeholder:th-muted border-none outline-none
                  focus:ring-2 focus:ring-[var(--accent)]"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-semibold text-sm
              th-bg th-btn th-accent hover:bg-[var(--accent)] hover:text-white transition-all
              flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <FontAwesomeIcon icon={saved ? faCheck : faFloppyDisk} className="w-4 h-4" />
            <span>{saved ? "Saved!" : "Save Settings"}</span>
          </button>
        </div>
      </main>
      <Footer />
    </div>
  );
}

