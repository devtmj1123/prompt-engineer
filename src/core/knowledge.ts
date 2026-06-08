import fs from "fs";
import path from "path";
import crypto from "crypto";
import type { KnowledgeEntry } from "@/types";

const KNOWLEDGE_DIR = path.join(process.cwd(), "knowledge");
const INDEX_FILE = path.join(KNOWLEDGE_DIR, "knowledge-index.json");

// Use /tmp on serverless (Vercel, AWS Lambda) where the filesystem is read-only
function getWritableDir(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join("/tmp", "knowledge");
  }
  return KNOWLEDGE_DIR;
}

function ensureDir(dir?: string) {
  const target = dir ?? getWritableDir();
  try {
    fs.mkdirSync(target, { recursive: true });
  } catch {
    // read-only filesystem — skip
  }
}

export function readIndex(): KnowledgeEntry[] {
  const dir = getWritableDir();
  const indexFile = path.join(dir, "knowledge-index.json");
  try {
    ensureDir(dir);
    if (!fs.existsSync(indexFile)) return [];
    return JSON.parse(fs.readFileSync(indexFile, "utf-8"));
  } catch {
    return [];
  }
}

function writeIndex(entries: KnowledgeEntry[]) {
  const dir = getWritableDir();
  ensureDir(dir);
  fs.writeFileSync(path.join(dir, "knowledge-index.json"), JSON.stringify(entries, null, 2));
}

export async function addFromGitHub(repoUrl: string): Promise<KnowledgeEntry> {
  const dir = getWritableDir();
  ensureDir(dir);
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
  const localPath = path.join(dir, `${id}.md`);
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
  const dir = getWritableDir();
  ensureDir(dir);
  const id = crypto.randomUUID();
  const localPath = path.join(dir, `${id}.md`);
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
  try {
    if (fs.existsSync(entry.localPath)) fs.unlinkSync(entry.localPath);
  } catch {
    // read-only filesystem
  }
  writeIndex(index.filter((e) => e.id !== id));
}

export function getRelevantContext(domain: string): string {
  try {
    const index = readIndex();
    if (index.length === 0) return "";
    // Read all knowledge files and return concatenated (simple retrieval for now)
    const parts: string[] = [];
    for (const entry of index) {
      try {
        if (fs.existsSync(entry.localPath)) {
          parts.push(fs.readFileSync(entry.localPath, "utf-8"));
        }
      } catch {
        // skip unreadable files
      }
    }
    return parts.join("\n\n---\n\n").slice(0, 6000); // Limit context size
  } catch {
    return "";
  }
}
