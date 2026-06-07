"use client";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import type { KnowledgeEntry } from "@/types";

export default function KnowledgePage() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([]);
  const [githubUrl, setGithubUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchEntries() {
    const res = await fetch("/api/knowledge");
    const data = await res.json();
    setEntries(data);
  }

  useEffect(() => { fetchEntries(); }, []);

  async function handleAddGitHub() {
    if (!githubUrl.trim()) return;
    setLoading(true);
    setError(null);
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
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setLoading(false);
    }
  }

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
        <div className="bg-neu-bg shadow-neu-raised rounded-2xl p-6 flex flex-col gap-4">
          <h1 className="text-lg font-bold text-neu-text">📚 Knowledge Base</h1>
          <p className="text-xs text-neu-text-muted">
            Add GitHub repositories or upload docs to enrich prompt engineering with your context.
          </p>

          <div className="flex gap-2">
            <input
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              placeholder="https://github.com/owner/repo"
              className="flex-1 bg-neu-bg shadow-neu-inset rounded-xl px-4 py-2.5
                text-sm text-neu-text placeholder:text-neu-text-muted
                border-none outline-none focus:ring-2 focus:ring-neu-accent"
            />
            <button
              onClick={handleAddGitHub}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold
                bg-neu-bg shadow-neu-btn text-neu-accent
                hover:bg-neu-accent hover:text-white transition-all
                disabled:opacity-40"
            >
              {loading ? "⏳" : "+ Add"}
            </button>
          </div>
          {error && <p className="text-xs text-red-400">{error}</p>}
        </div>

        <div className="flex flex-col gap-3">
          {entries.length === 0 && (
            <p className="text-center text-neu-text-muted text-sm py-8">
              No knowledge sources yet. Add a GitHub repo above to get started.
            </p>
          )}
          {entries.map((entry) => (
            <div key={entry.id} className="bg-neu-bg shadow-neu-raised rounded-2xl p-4
              flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-neu-text">{entry.name}</p>
                <p className="text-xs text-neu-text-muted mt-0.5">{entry.description}</p>
                <p className="text-xs text-neu-text-muted mt-0.5">
                  Added: {new Date(entry.addedAt).toLocaleDateString()}
                </p>
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
