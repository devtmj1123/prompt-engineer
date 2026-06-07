"use client";
import { useState, useEffect, useRef } from "react";
import { NavBar } from "@/components/NavBar";
import { Footer } from "@/components/Footer";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faBook, 
  faFolderOpen, 
  faFileLines, 
  faTrash, 
  faSpinner, 
  faPlus, 
  faCircleNotch 
} from "@fortawesome/free-solid-svg-icons";
import { faGithub } from "@fortawesome/free-brands-svg-icons";
import type { KnowledgeEntry } from "@/types";

type Tab = "github" | "upload";

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

  // ── Drag & drop ───────────────────────────────────────────────
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
        <div className="th-bg th-raised rounded-2xl p-6 flex flex-col gap-4 anim-fade-up">
          <div>
            <h1 className="text-lg font-bold th-text flex items-center gap-2">
              <FontAwesomeIcon icon={faBook} className="w-4 h-4 th-accent" />
              <span>Knowledge &amp; Skills</span>
            </h1>
            <p className="text-xs th-muted mt-1">
              Feed the engine with skills, docs, or repos. It uses them as context when engineering your prompts.
            </p>
          </div>

          {/* Tab switcher */}
          <div className="flex gap-2">
            <button
              onClick={() => setTab("github")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer btn-press ${
                tab === "github"
                  ? "th-inset th-accent"
                  : "th-raised th-muted hover:th-accent"
              }`}
            >
              <FontAwesomeIcon icon={faGithub} className="w-3.5 h-3.5" />
              <span>GitHub Repo</span>
            </button>
            <button
              onClick={() => setTab("upload")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer btn-press ${
                tab === "upload"
                  ? "th-inset th-accent"
                  : "th-raised th-muted hover:th-accent"
              }`}
            >
              <FontAwesomeIcon icon={faFolderOpen} className="w-3.5 h-3.5" />
              <span>Upload Skill / Doc</span>
            </button>
          </div>

          {/* GitHub tab */}
          {tab === "github" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs th-muted">
                Paste any public GitHub repo URL. The engine will fetch all <code className="th-accent">.md</code>,{" "}
                <code className="th-accent">.txt</code>, <code className="th-accent">.yaml</code>, and{" "}
                <code className="th-accent">.json</code> files from it (up to 50 files).
              </p>
              <div className="flex gap-2">
                <input
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddGitHub()}
                  placeholder="https://github.com/owner/repo"
                  className="flex-1 th-bg th-inset rounded-xl px-4 py-2.5
                    text-sm th-text placeholder:th-muted
                    border-none outline-none focus:ring-2 focus:ring-[var(--accent)]"
                />
                <button
                  onClick={handleAddGitHub}
                  disabled={githubLoading || !githubUrl.trim()}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold btn-press
                    th-bg th-btn th-accent
                    hover:bg-[var(--accent)] hover:text-white transition-all
                    disabled:opacity-40 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {githubLoading ? (
                    <FontAwesomeIcon icon={faSpinner} className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <FontAwesomeIcon icon={faPlus} className="w-3 h-3" />
                      <span>Add</span>
                    </>
                  )}
                </button>
              </div>
              {githubError && <p className="text-xs text-red-500 mt-1">{githubError}</p>}
            </div>
          )}

          {/* Upload tab */}
          {tab === "upload" && (
            <div className="flex flex-col gap-3">
              <p className="text-xs th-muted">
                Upload a skill file, prompt template, or doc (any plain-text format:{" "}
                <code className="th-accent">.md</code>,{" "}
                <code className="th-accent">.txt</code>,{" "}
                <code className="th-accent">.yaml</code>,{" "}
                <code className="th-accent">.json</code>, etc).
                The content is indexed and injected as context during prompt engineering.
              </p>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-3 rounded-2xl p-8 cursor-pointer
                  transition-all border-2 border-dashed group
                  ${dragOver
                    ? "border-[var(--accent)] th-surface"
                    : "border-slate-500/30 hover:border-[var(--accent)]/60"
                  }`}
              >
                {uploadLoading ? (
                  <div className="flex flex-col items-center gap-2 text-sm th-muted animate-pulse">
                    <FontAwesomeIcon icon={faCircleNotch} className="w-8 h-8 animate-spin th-accent" />
                    <span>Uploading…</span>
                  </div>
                ) : (
                  <>
                    <FontAwesomeIcon icon={faFolderOpen} className="w-10 h-10 th-muted/60 group-hover:th-accent transition-colors" />
                    <p className="text-sm th-muted text-center mt-2">
                      Drag &amp; drop a file here, or{" "}
                      <span className="th-accent font-semibold">click to browse</span>
                    </p>
                    <p className="text-xs th-muted opacity-60">
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

              {uploadError && <p className="text-xs text-red-500 mt-1">{uploadError}</p>}
            </div>
          )}
        </div>

        {/* ── Indexed Sources List ───────────────────────────────── */}
        <div className="flex flex-col gap-3">
          {entries.length === 0 && (
            <p className="text-center th-muted text-sm py-8">
              No knowledge or skills added yet. Use the panel above to get started.
            </p>
          )}
          {entries.length > 0 && (
            <p className="text-xs font-bold uppercase tracking-widest th-muted px-1">
              {entries.length} indexed source{entries.length !== 1 ? "s" : ""}
            </p>
          )}
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="th-bg th-raised rounded-2xl p-4 flex items-center justify-between gap-4 card-hover anim-fade-up"
              style={{ animationDelay: `${index * 0.07}s` }}
            >
              <div className="flex items-start gap-3 min-w-0">
                <FontAwesomeIcon 
                  icon={entry.source === "upload" ? faFileLines : faGithub} 
                  className="w-5 h-5 th-accent shrink-0 mt-1" 
                />
                <div className="min-w-0">
                  <p className="text-sm font-semibold th-text truncate">{entry.name}</p>
                  <p className="text-xs th-muted mt-0.5 truncate">{entry.description}</p>
                  <p className="text-xs th-muted opacity-60 mt-0.5">
                    Added {new Date(entry.addedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(entry.id)}
                className="text-xs px-3 py-2 rounded-lg text-red-500 hover:text-red-700 btn-press
                  dark:text-red-400 dark:hover:text-red-300 hover:bg-red-500/10 transition-all shrink-0 flex items-center gap-1 cursor-pointer font-semibold"
              >
                <FontAwesomeIcon icon={faTrash} className="w-3 h-3" />
                <span>Remove</span>
              </button>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}

