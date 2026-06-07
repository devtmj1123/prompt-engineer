"use client";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faShieldHalved, faDatabase, faKey, faCode } from "@fortawesome/free-solid-svg-icons";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full mt-4 flex flex-col gap-6">
        
        {/* Main Panel */}
        <div className="th-bg th-raised rounded-2xl p-8 flex flex-col gap-6">
          <div className="border-b th-border pb-4">
            <h1 className="text-xl font-bold th-text flex items-center gap-2">
              <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5 th-accent" />
              <span>Privacy Policy</span>
            </h1>
            <p className="text-xs th-muted mt-1">
              Learn how we protect your keys, prompts, and history.
            </p>
          </div>

          {/* Section 1 */}
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-xl th-surface th-raised text-blue-500 dark:text-sky-400 shrink-0">
              <FontAwesomeIcon icon={faDatabase} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold th-text">100% Browser-Local Storage</h2>
              <p className="text-xs th-muted mt-1.5 leading-relaxed">
                Prompt Engineer is designed to be entirely client-side. We **do not host any external databases** to save your prompts, history entries, or preferences. All configurations, history, and uploaded knowledge base contexts reside strictly within your local browser context using standard HTML5 storage (`localStorage`).
              </p>
              <p className="text-xs th-muted mt-1.5 leading-relaxed">
                Because this data is stored locally in your browser cache, it never leaves your machine unless you explicitly export it. Note that clearing your cookies or site cache will clear this data.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-xl th-surface th-raised text-emerald-500 shrink-0">
              <FontAwesomeIcon icon={faKey} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold th-text">API Key Integrity &amp; Security</h2>
              <p className="text-xs th-muted mt-1.5 leading-relaxed">
                Your API keys for Groq, Cerebras, Google Gemini, and Anthropic Claude are stored locally on your disk config file (or in environment variables). They are used solely to authenticate request endpoints with these providers.
              </p>
              <p className="text-xs th-muted mt-1.5 leading-relaxed">
                We do not intercept, transmit, or log your keys to any intermediate tracking servers.
              </p>
            </div>
          </div>

          {/* Section 3 */}
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-xl th-surface th-raised text-amber-500 shrink-0">
              <FontAwesomeIcon icon={faShieldHalved} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold th-text">Direct Provider Connections</h2>
              <p className="text-xs th-muted mt-1.5 leading-relaxed">
                When you run prompt engineering refinements, API calls are dispatched directly from your backend/environment to the target model provider endpoint (e.g. `api.groq.com`, `api.anthropic.com`, etc.). No intermediary services log or audit your prompt templates.
              </p>
            </div>
          </div>

          {/* Section 4 */}
          <div className="flex gap-4 items-start">
            <div className="p-3 rounded-xl th-surface th-raised text-purple-500 shrink-0">
              <FontAwesomeIcon icon={faCode} className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold th-text">Open Source Auditability</h2>
              <p className="text-xs th-muted mt-1.5 leading-relaxed">
                Prompt Engineer is released under the open-source MIT License. You can audit the complete codebase, configuration handlers, and API connection pipelines at any time to verify that your data is safe and secured.
              </p>
            </div>
          </div>

          <div className="mt-4 p-4 rounded-xl bg-slate-500/5 dark:bg-slate-300/5 border th-border text-[11px] th-muted leading-relaxed">
            <p className="font-semibold th-text mb-1">Last updated: June 2026</p>
            <p>
              By using Prompt Engineer, you acknowledge that your data is saved locally on your device and agree that you are responsible for maintaining your browser storage backups.
            </p>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
