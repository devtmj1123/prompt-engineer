import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { KnowledgeEntry } from "@/types";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const INDEX_FILE = path.join(KNOWLEDGE_DIR, "knowledge-index.json");

function ensureDir() {
  fs.mkdirSync(KNOWLEDGE_DIR, { recursive: true });
}

export function readIndex(): KnowledgeEntry[] {
  ensureDir();
  if (!fs.existsSync(INDEX_FILE)) return [];
  return JSON.parse(fs.readFileSync(INDEX_FILE, "utf-8"));
}

function writeIndex(entries: KnowledgeEntry[]) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(entries, null, 2));
}

export async function addFromGitHub(repoUrl: string): Promise<KnowledgeEntry> {
  ensureDir();
  // Parse owner/repo from URL e.g. https://github.com/anthropics/prompt-library
  const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) throw new Error("Invalid GitHub URL. Expected: https://github.com/owner/repo");
  const [, owner, repo] = match;

  // Fetch the repo tree via GitHub API
  const treeUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/HEAD?recursive=1`;
  const treeRes = await fetch(treeUrl, {
    headers: {
      Accept: "application/vnd.github+json",
      "User-Agent": "prompt-engineer-app"
    }
  });
  if (!treeRes.ok) throw new Error(`GitHub API error: ${treeRes.status} ${treeRes.statusText}`);
  const treeData = await treeRes.json() as { tree: Array<{ path: string; type: string }> };

  const docFiles = treeData.tree.filter(
    (f) => f.type === "blob" && /\.(md|txt|yaml|yml|json)$/i.test(f.path)
  );

  // Fetch and concatenate all doc files (limit to 50 files)
  const contents: string[] = [];
  for (const file of docFiles.slice(0, 50)) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`;
    const res = await fetch(rawUrl, {
      headers: {
        "User-Agent": "prompt-engineer-app"
      }
    });
    if (res.ok) {
      const text = await res.text();
      contents.push(`\n\n## File: ${file.path}\n\n${text}`);
    }
  }

  const id = crypto.randomUUID();
  const localPath = path.join(KNOWLEDGE_DIR, `${id}.md`);
  const fullContent = `# Knowledge: ${owner}/${repo}\n\nSource: ${repoUrl}\n${contents.join("")}`;
  fs.writeFileSync(localPath, fullContent, "utf-8");

  const entry: KnowledgeEntry = {
    id,
    name: `${owner}/${repo}`,
    source: repoUrl,
    addedAt: new Date().toISOString(),
    description: `GitHub repository: ${owner}/${repo}`,
    localPath,
  };

  const index = readIndex();
  index.push(entry);
  writeIndex(index);

  return entry;
}

export function addFromUpload(filename: string, content: string): KnowledgeEntry {
  ensureDir();
  const id = crypto.randomUUID();
  const localPath = path.join(KNOWLEDGE_DIR, `${id}.md`);
  fs.writeFileSync(localPath, content, "utf-8");

  const entry: KnowledgeEntry = {
    id,
    name: filename,
    source: "upload",
    addedAt: new Date().toISOString(),
    description: `Uploaded file: ${filename}`,
    localPath,
  };

  const index = readIndex();
  index.push(entry);
  writeIndex(index);

  return entry;
}

export function deleteEntry(id: string): void {
  const index = readIndex();
  const entry = index.find((e) => e.id === id);
  if (!entry) throw new Error(`Knowledge entry not found: ${id}`);
  if (fs.existsSync(entry.localPath)) fs.unlinkSync(entry.localPath);
  writeIndex(index.filter((e) => e.id !== id));
}

export function getRelevantContext(domain: string): string {
  const index = readIndex();
  if (index.length === 0) return "";
  // Read all knowledge files and return concatenated (simple retrieval for now)
  const parts: string[] = [];
  for (const entry of index) {
    if (fs.existsSync(entry.localPath)) {
      parts.push(fs.readFileSync(entry.localPath, "utf-8"));
    }
  }
  return parts.join("\n\n---\n\n").slice(0, 6000); // Limit context size
}
