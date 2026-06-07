"use client";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";

const PROVIDERS = [
  { key: "groq", label: "Groq", defaultModel: "llama-3.3-70b-versatile" },
  { key: "cerebras", label: "Cerebras", defaultModel: "llama3.1-70b" },
  { key: "gemini", label: "Google Gemini", defaultModel: "gemini-2.0-flash" },
  { key: "claude", label: "Anthropic Claude", defaultModel: "claude-3-5-sonnet-latest" },
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

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 max-w-2xl mx-auto w-full mt-4 flex flex-col gap-4">
        <div className="bg-neu-bg shadow-neu-raised rounded-2xl p-6 flex flex-col gap-5">
          <h1 className="text-lg font-bold text-neu-text">⚙️ Settings</h1>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
              Default Provider
            </label>
            <select
              value={defaultProvider}
              onChange={(e) => setDefaultProvider(e.target.value)}
              className="w-full bg-neu-bg shadow-neu-inset rounded-xl px-4 py-3 text-sm
                text-neu-text border-none outline-none cursor-pointer"
            >
              {PROVIDERS.map((p) => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>

          {PROVIDERS.map((p) => (
            <div key={p.key}>
              <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
                {p.label} API Key
              </label>
              <input
                type="password"
                placeholder={keys[p.key] === "***set***" ? "API Key is set (enter to overwrite)" : `Enter ${p.label} API key...`}
                value={keys[p.key] ?? ""}
                onChange={(e) => setKeys((k) => ({ ...k, [p.key]: e.target.value }))}
                className="w-full bg-neu-bg shadow-neu-inset rounded-xl px-4 py-3 text-sm
                  text-neu-text placeholder:text-neu-text-muted border-none outline-none
                  focus:ring-2 focus:ring-neu-accent"
              />
            </div>
          ))}

          <button
            onClick={handleSave}
            className="w-full py-3 rounded-xl font-semibold text-sm
              bg-neu-bg shadow-neu-btn text-neu-accent
              hover:bg-neu-accent hover:text-white transition-all"
          >
            {saved ? "✓ Saved!" : "💾 Save Settings"}
          </button>
        </div>
      </main>
    </div>
  );
}
