"use client";
import { useState, useEffect, useRef } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faClockRotateLeft, 
  faTrash, 
  faFileExport, 
  faFileImport, 
  faPlay, 
  faCircleInfo,
  faChevronRight 
} from "@fortawesome/free-solid-svg-icons";
import type { PromptCategory, PromptEngineerResult } from "@/types";

interface HistoryEntry {
  id: string;
  timestamp: number;
  rawPrompt: string;
  targetModel: string;
  category: PromptCategory;
  customInstructions: string;
  result: PromptEngineerResult;
}

export default function HistoryPage() {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [confirmClear, setConfirmClear] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("prompt_history");
      if (raw) {
        setEntries(JSON.parse(raw));
      }
    } catch (err) {
      // Ignore read errors
    }
  }, []);

  function handleLoadWorkspace(item: HistoryEntry) {
    try {
      localStorage.setItem("prompt_engineer_load_history", JSON.stringify(item));
      window.location.href = "/";
    } catch (err) {
      alert("Failed to load history item into workspace");
    }
  }

  function handleDelete(id: string) {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    try {
      localStorage.setItem("prompt_history", JSON.stringify(updated));
    } catch (err) {
      // Ignore write errors
    }
  }

  function handleClearAll() {
    if (!confirmClear) {
      setConfirmClear(true);
      return;
    }
    setEntries([]);
    try {
      localStorage.removeItem("prompt_history");
    } catch (err) {
      // Ignore
    }
    setConfirmClear(false);
  }

  function handleExport() {
    if (entries.length === 0) {
      alert("No history entries to export.");
      return;
    }
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(entries, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `prompt-engineer-history-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        if (!Array.isArray(imported)) {
          alert("Invalid backup file: must be a JSON array");
          return;
        }
        // Basic check for valid structures
        const validItems = imported.filter((item) => item && item.id && item.rawPrompt);
        if (validItems.length === 0) {
          alert("No valid prompt history items found in backup file.");
          return;
        }
        
        const mergedMap = new Map();
        // Insert imported first, then existing (existing overrides if ID matches)
        imported.forEach(item => {
          if (item && item.id) mergedMap.set(item.id, item);
        });
        entries.forEach(item => {
          mergedMap.set(item.id, item);
        });

        const merged = Array.from(mergedMap.values()).sort(
          (a: any, b: any) => b.timestamp - a.timestamp
        );
        
        setEntries(merged);
        localStorage.setItem("prompt_history", JSON.stringify(merged));
        alert(`Successfully imported ${validItems.length} history items!`);
      } catch (err) {
        alert("Failed to parse backup file: invalid JSON format");
      }
    };
    reader.readAsText(file);
    e.target.value = ""; // clear input
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 max-w-4xl mx-auto w-full mt-4 flex flex-col gap-4">
        
        {/* Header and Controls */}
        <div className="th-bg th-raised rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-lg font-bold th-text flex items-center gap-2">
                <FontAwesomeIcon icon={faClockRotateLeft} className="w-4 h-4 th-accent" />
                <span>Prompt History</span>
              </h1>
              <p className="text-xs th-muted mt-1">
                Your past prompt engineering workspace states are saved right in your browser.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleExport}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold th-bg th-btn th-accent
                  hover:bg-[var(--accent)] hover:text-white hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                title="Export history backup"
              >
                <FontAwesomeIcon icon={faFileExport} className="w-3.5 h-3.5" />
                <span>Export Backup</span>
              </button>
              
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold th-bg th-btn th-accent
                  hover:bg-[var(--accent)] hover:text-white hover:shadow-none transition-all flex items-center gap-1.5 cursor-pointer"
                title="Import history backup"
              >
                <FontAwesomeIcon icon={faFileImport} className="w-3.5 h-3.5" />
                <span>Import Backup</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleImport}
              />
              
              {entries.length > 0 && (
                <button
                  onClick={handleClearAll}
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                    confirmClear 
                      ? "bg-red-600 text-white hover:bg-red-700 shadow-none animate-pulse" 
                      : "text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10"
                  }`}
                >
                  <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                  <span>{confirmClear ? "Click again to confirm" : "Clear All"}</span>
                </button>
              )}
            </div>
          </div>

          {/* Privacy & cookie warning */}
          <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-500/10 dark:bg-sky-950/40 border border-sky-500/20 text-xs text-sky-800 dark:text-sky-300">
            <FontAwesomeIcon icon={faCircleInfo} className="w-4 h-4 mt-0.5 shrink-0 th-accent" />
            <div className="flex-1 leading-relaxed">
              <p className="font-bold mb-1">Local Browser Storage Notice & Privacy</p>
              <p>
                All your prompt history entries and LLM generation configurations are stored **100% locally** in your browser's local cache (`localStorage`). No information leaves your device. However, clearing your browser cookies, cleaning site data, or formatting your browser will wipe this history. We recommend clicking **Export Backup** regularly to save your prompts to a local file.
              </p>
            </div>
          </div>
        </div>

        {/* Entries List */}
        <div className="flex flex-col gap-4">
          {entries.length === 0 ? (
            <div className="th-bg th-raised rounded-2xl p-12 text-center th-muted text-sm">
              <FontAwesomeIcon icon={faClockRotateLeft} className="w-8 h-8 opacity-30 mb-3 mx-auto" />
              <p>No prompt history found. Try engineering prompts in the workspace!</p>
            </div>
          ) : (
            entries.map((entry) => (
              <div 
                key={entry.id} 
                className="th-bg th-raised rounded-2xl p-5 flex flex-col gap-4 transition-all duration-200"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b th-border pb-3">
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    <span className="font-semibold th-text">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                    <span className="th-muted opacity-50">•</span>
                    <span className="px-2 py-0.5 rounded-full th-surface th-accent font-bold">
                      {entry.category}
                    </span>
                    <span className="th-muted opacity-50">•</span>
                    <span className="th-muted font-mono">{entry.targetModel}</span>
                  </div>
                  
                  <div className="flex items-center gap-2 justify-end">
                    <button
                      onClick={() => handleLoadWorkspace(entry)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold th-btn th-bg th-accent
                        hover:bg-[var(--accent)] hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      title="Load this state in the Workspace"
                    >
                      <FontAwesomeIcon icon={faPlay} className="w-2.5 h-2.5" />
                      <span>Workspace</span>
                      <FontAwesomeIcon icon={faChevronRight} className="w-2 h-2 ml-0.5" />
                    </button>
                    
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:text-red-700
                        dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-all cursor-pointer"
                      title="Delete entry"
                    >
                      <FontAwesomeIcon icon={faTrash} className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Left Column — Raw Prompt & Custom Inst */}
                  <div className="flex flex-col gap-2">
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-wider th-muted mb-1">Raw Intent</p>
                      <p className="text-xs th-text bg-slate-500/5 dark:bg-slate-300/5 rounded-xl p-3 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed border th-border">
                        {entry.rawPrompt}
                      </p>
                    </div>
                    {entry.customInstructions && (
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-wider th-muted mb-1">Custom Instructions</p>
                        <p className="text-xs th-text bg-slate-500/5 dark:bg-slate-300/5 rounded-xl p-3 max-h-24 overflow-y-auto whitespace-pre-wrap leading-relaxed border th-border">
                          {entry.customInstructions}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Right Column — Engineered Prompt Output Preview */}
                  <div className="flex flex-col">
                    <p className="text-[10px] font-bold uppercase tracking-wider th-muted mb-1">Engineered Output Preview</p>
                    <pre className="text-[11px] font-mono th-text th-inset rounded-xl p-3 max-h-[195px] overflow-auto whitespace-pre-wrap leading-relaxed border th-border text-emerald-600 dark:text-emerald-400">
                      {entry.result.optimizedPrompt}
                    </pre>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
