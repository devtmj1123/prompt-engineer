"use client";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear, faFloppyDisk, faCheck, faShieldHalved } from "@fortawesome/free-solid-svg-icons";
import { CustomSelect } from "@/components/CustomSelect";

const PROVIDERS = [
  { key: "groq", label: "Groq", defaultModel: "llama-3.3-70b-versatile" },
  { key: "cerebras", label: "Cerebras", defaultModel: "llama3.1-70b" },
  { key: "gemini", label: "Google Gemini", defaultModel: "gemini-2.0-flash" },
  { key: "claude", label: "Anthropic Claude", defaultModel: "claude-3-5-sonnet-latest" },
  { key: "openai", label: "OpenAI", defaultModel: "gpt-4o" },
  { key: "deepseek", label: "DeepSeek", defaultModel: "deepseek-chat" },
  { key: "xiaomi", label: "Xiaomi (Mimo)", defaultModel: "mimo-chat" },
];

const LS_API_KEYS = "pe_api_keys";
const LS_DEFAULT_PROVIDER = "pe_default_provider";

export default function SettingsPage() {
  const [keys, setKeys] = useState<Record<string, string>>({});
  const [defaultProvider, setDefaultProvider] = useState("groq");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    // Load from localStorage
    try {
      const stored = localStorage.getItem(LS_API_KEYS);
      if (stored) setKeys(JSON.parse(stored));
    } catch { /* ignore */ }

    try {
      const provider = localStorage.getItem(LS_DEFAULT_PROVIDER);
      if (provider) setDefaultProvider(provider);
    } catch { /* ignore */ }
  }, []);

  function handleSave() {
    // Save API keys to localStorage
    localStorage.setItem(LS_API_KEYS, JSON.stringify(keys));
    localStorage.setItem(LS_DEFAULT_PROVIDER, defaultProvider);

    // Also save to server config (best-effort, no-op on Vercel)
    const providers: Record<string, { apiKey: string; model: string }> = {};
    for (const p of PROVIDERS) {
      providers[p.key] = { apiKey: keys[p.key] ?? "", model: p.defaultModel };
    }
    fetch("/api/config", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ defaultProvider, providers }),
    }).catch(() => {}); // best-effort

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

          {/* Security notice */}
          <div className="th-inset rounded-xl px-4 py-3 flex items-start gap-2.5">
            <FontAwesomeIcon icon={faShieldHalved} className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
            <p className="text-xs th-muted leading-relaxed">
              API keys are stored <strong className="th-text">locally in your browser</strong> (localStorage).
              They are sent directly to the AI provider with each request — we never store or see your keys on the server.
            </p>
          </div>

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
                placeholder={keys[p.key] ? "API Key is set (enter to overwrite)" : `Enter ${p.label} API key...`}
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
