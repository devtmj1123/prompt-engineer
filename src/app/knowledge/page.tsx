"use client";
import { useState, useEffect, useRef } from "react";
import { NavBar } from "@/components/NavBar";
import type { KnowledgeEntry } from "@/types";

type Tab = "github" | "upload";

const SOURCE_ICONS: Record<string, string> = {
  upload: "📄",
  github: "🐙",
};

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [tab, setTab] = useState<Tab>("github");

  // GitHub tab state
  const [githubUrl, setGithubUrl] = useState("");
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubError, setGithubError] = useState<string | null>(null);

  // Upload tab state
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function fetchEntries() {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setEntries(data);
  }

  useEffect(() => { fetchEntries(); }, []);

  // ── GitHub add ────────────────────────────────────────────────
  async function handleAddGitHub() {
    if (!githubUrl.trim()) return;
    setGithubLoading(true);
    setGithubError(null);
    try {
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ githubUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to add knowledge");
      setGithubUrl("");
      await fetchEntries();
    } catch (err) {
      setGithubError(err instanceof Error ? err.message : "Error");
    } finally {
      setGithubLoading(false);
    }
  }

  // ── File upload ───────────────────────────────────────────────
  async function uploadFile(file: File) {
    setUploadLoading(true);
    setUploadError(null);
    try {
      const content = await file.text();
      const res = await fetch("/api/knowledge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: file.name, content }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to upload skill");
      await fetchEntries();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload error");
    } finally {
      setUploadLoading(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }

  // ── Delete ─────────────────────────────────────────────────────
  async function handleDelete(id: string) {
    await fetch("/api/knowledge", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    await fetchEntries();
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 max-w-3xl mx-auto w-full mt-4 flex flex-col gap-4">

        {/* ── Add Panel ─────────────────────────────────────────── */}
        <div className="bg-neu-bg shadow-neu-raised rounded-2xl p-6 flex flex-col gap-4">
          <div>
            <h1 className="text-lg font-bold text-neu-text">📚 Knowledge &amp; Skills</h1>
            <p className="text-xs text-neu-text-muted mt-1">
              Feed the engine with skills, docs, or repos. It uses them as context when engineering your prompts.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab("github")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === "github"
                  ? "shadow-neu-inset text-neu-accent"
                  : "shadow-neu-raised text-neu-text-muted hover:text-neu-accent"
              }`}
            >
              🐙 GitHub Repo
            </button>
            <button
              onClick={() => setTab("upload")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === "upload"
                  ? "shadow-neu-inset text-neu-accent"
                  : "shadow-neu-raised text-neu-text-muted hover:text-neu-accent"
              }`}
            >
              📄 Upload Skill / Doc
            </button>
          </div>

          {/* GitHub tab */}
          {tab === "github" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neu-text-muted">
                Paste any public GitHub repo URL. The engine will fetch all <code className="text-neu-accent">.md</code>,{" "}
                <code className="text-neu-accent">.txt</code>, <code className="text-neu-accent">.yaml</code>, and{" "}
                <code className="text-neu-accent">.json</code> files from it (up to 50 files).
              </p>
              <div className="flex gap-2">
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddGitHub()}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 bg-neu-bg shadow-neu-inset rounded-xl px-4 py-2.5
                    text-sm text-neu-text placeholder:text-neu-text-muted
                    border-none outline-none focus:ring-2 focus:ring-neu-accent"
                />
                <button
                  onClick={handleAddGitHub}
                  disabled={githubLoading || !githubUrl.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold
                    bg-neu-bg shadow-neu-btn text-neu-accent
                    hover:bg-neu-accent hover:text-white transition-all
                    disabled:opacity-40"
                >
                  {githubLoading ? "⏳" : "+ Add"}
                </button>
              </div>
              {githubError && <p className="text-xs text-red-400">{githubError}</p>}
            </div>
          )}

          {/* Upload tab */}
          {tab === "upload" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs text-neu-text-muted">
                Upload a skill file, prompt template, or doc (any plain-text format:{" "}
                <code className="text-neu-accent">.md</code>,{" "}
                <code className="text-neu-accent">.txt</code>,{" "}
                <code className="text-neu-accent">.yaml</code>,{" "}
                <code className="text-neu-accent">.json</code>, etc).
                The content is indexed and injected as context during prompt engineering.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl p-8 cursor-pointer
                  transition-all border-2 border-dashed
                  ${dragOver
                    ? "border-neu-accent bg-neu-surface"
                    : "border-neu-text-muted/30 hover:border-neu-accent/60"
                  }`}
              >
                {uploadLoading ? (
                  <p className="text-sm text-neu-text-muted animate-pulse">⏳ Uploading…</p>
                ) : (
                  <>
                    <span className="text-4xl">📂</span>
                    <p className="text-sm text-neu-text-muted text-center">
                      Drag &amp; drop a file here, or{" "}
                      <span className="text-neu-accent font-semibold">click to browse</span>
                    </p>
                    <p className="text-xs text-neu-text-muted/60">
                      .md · .txt · .yaml · .json · .py · any plain-text file
                    </p>
                  </>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".md,.txt,.yaml,.yml,.json,.py,.ts,.js,.sh,.toml"
                className="hidden"
                onChange={handleFileChange}
              />

              {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}
            </div>
          )}
        </div>

        {/* ── Indexed Sources List ───────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {entries.length === 0 && (
            <p className="text-center text-neu-text-muted text-sm py-8">
              No knowledge or skills added yet. Use the panel above to get started.
            </p>
          )}
          {entries.length > 0 && (
            <p className="text-xs font-bold uppercase tracking-widest text-neu-text-muted px-1">
              {entries.length} indexed source{entries.length !== 1 ? "s" : ""}
            </p>
          )}
          {entries.map((entry) => (
            <div
              key={entry.id}
              className="bg-neu-bg shadow-neu-raised rounded-2xl p-4 flex items-center justify-between gap-4"
            >
              <div className="flex items-start gap-3 min-w-0">
                <span className="text-xl shrink-0 mt-0.5">
                  {SOURCE_ICONS[entry.source === "upload" ? "upload" : "github"] ?? "📚"}
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-neu-text truncate">{entry.name}</p>
                  <p className="text-xs text-neu-text-muted mt-0.5 truncate">{entry.description}</p>
                  <p className="text-xs text-neu-text-muted/60 mt-0.5">
                    Added {new Date(entry.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-xs px-3 py-1.5 rounded-lg text-red-400
                  hover:bg-red-950 transition-all shrink-0"
              >
                🗑 Remove
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
