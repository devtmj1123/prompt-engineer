# Prompt Engineer — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a hybrid AI Prompt Engineering system that analyzes raw user intent, engineers structured model-specific prompts, recommends required tools, generates execution strategies, and delivers this through a Next.js Neumorphic web dashboard, a CLI tool, and an MCP server.

**Architecture:** A shared TypeScript core engine (analyze → enrich → generate) powers three surfaces: a Next.js 15 App Router web dashboard, a CLI binary, and an MCP stdio server. All surfaces share the same engine, LLM clients, config manager, and knowledge base.

**Tech Stack:** Next.js 15 (App Router), TypeScript, Tailwind CSS v4, `openai` SDK (Groq/Cerebras), `@google/genai` (Gemini), `@anthropic-ai/sdk` (Claude), `@modelcontextprotocol/sdk`, `commander` (CLI), `ora` + `chalk` (CLI UX), `node-fetch` (GitHub fetcher).

---

## Phase 0 — Project Bootstrap

### Task 0: Initialize Next.js project and install dependencies

**Files:**
- Create: `package.json` (via npx)
- Create: `tailwind.config.ts`
- Create: `tsconfig.json`
- Create: `.gitignore`
- Create: `.env.example`

- [ ] **Step 1: Initialize the Next.js project**

```bash
cd c:\Users\mjtan\Desktop\prompt_engineer
npx -y create-next-app@latest ./ --typescript --tailwind --app --no-src-dir --import-alias "@/*" --no-eslint
```

Expected: Next.js project scaffolded with TypeScript, Tailwind CSS v4 and App Router.

- [ ] **Step 2: Install core dependencies**

```bash
npm install openai @google/genai @anthropic-ai/sdk @modelcontextprotocol/sdk commander ora chalk node-fetch
npm install --save-dev @types/node tsx
```

- [ ] **Step 3: Add `src/` directory structure**

```bash
mkdir -p src/core/clients src/components src/types knowledge
mkdir -p bin docs/superpowers/specs docs/superpowers/plans
```

- [ ] **Step 4: Create `.env.example`**

```bash
# .env.example
GROQ_API_KEY=
CEREBRAS_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=
DEFAULT_PROVIDER=groq
```

- [ ] **Step 5: Update `package.json` with CLI and MCP bin entries**

Add to `package.json`:
```json
{
  "bin": {
    "prompt-eng": "./bin/cli.ts",
    "prompt-engineer-mcp": "./bin/mcp.ts"
  },
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "cli": "tsx bin/cli.ts",
    "mcp": "tsx bin/mcp.ts"
  }
}
```

- [ ] **Step 6: Commit**

```bash
git init
git add .
git commit -m "chore: initialize Next.js + TypeScript project with dependencies"
```

---

## Phase 1 — Core Engine

### Task 1: TypeScript Types

**Files:**
- Create: `src/types/index.ts`

- [ ] **Step 1: Write types**

```typescript
// src/types/index.ts

export type PromptCategory = "coding" | "image" | "writing" | "video";
export type ExecutionStrategy = "sequential" | "fan_out";
export type LLMProvider = "groq" | "cerebras" | "gemini" | "claude";

export interface PromptEngineerResult {
  optimizedPrompt: string;
  explanation: string;
  requiredTools: string[];
  executionStrategy: ExecutionStrategy;
  suggestedSubtasks?: string[];
  targetModel: string;
  category: PromptCategory;
}

export interface RefineRequest {
  rawPrompt: string;
  targetModel?: string;
  category?: PromptCategory;
  customInstructions?: string;
}

export interface ProviderConfig {
  apiKey: string;
  model: string;
}

export interface AppConfig {
  defaultProvider: LLMProvider;
  providers: Record<LLMProvider, ProviderConfig>;
}

export interface KnowledgeEntry {
  id: string;
  name: string;
  source: string;           // GitHub URL or "upload"
  addedAt: string;          // ISO timestamp
  description: string;
  localPath: string;        // Path under /knowledge/
}

export interface LLMClient {
  complete(systemPrompt: string, userMessage: string): Promise<string>;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/types/index.ts
git commit -m "feat: add shared TypeScript types"
```

---

### Task 2: Configuration Manager

**Files:**
- Create: `src/core/config.ts`

- [ ] **Step 1: Write config manager**

```typescript
// src/core/config.ts
import fs from "fs";
import path from "path";
import os from "os";
import type { AppConfig, LLMProvider } from "@/types";

const DEFAULT_CONFIG: AppConfig = {
  defaultProvider: "groq",
  providers: {
    groq: { apiKey: "", model: "llama-3.3-70b-specdec" },
    cerebras: { apiKey: "", model: "llama3.1-70b" },
    gemini: { apiKey: "", model: "gemini-2.0-flash" },
    claude: { apiKey: "", model: "claude-3-5-sonnet-latest" },
  },
};

function getConfigPath(): string {
  const localPath = path.join(process.cwd(), ".prompt-eng-config.json");
  if (fs.existsSync(localPath)) return localPath;
  const globalDir = path.join(os.homedir(), ".config", "prompt-engineer");
  fs.mkdirSync(globalDir, { recursive: true });
  return path.join(globalDir, "config.json");
}

export function readConfig(): AppConfig {
  const configPath = getConfigPath();
  if (!fs.existsSync(configPath)) {
    // Merge environment variables into default config
    const config = structuredClone(DEFAULT_CONFIG);
    if (process.env.GROQ_API_KEY) config.providers.groq.apiKey = process.env.GROQ_API_KEY;
    if (process.env.CEREBRAS_API_KEY) config.providers.cerebras.apiKey = process.env.CEREBRAS_API_KEY;
    if (process.env.GEMINI_API_KEY) config.providers.gemini.apiKey = process.env.GEMINI_API_KEY;
    if (process.env.ANTHROPIC_API_KEY) config.providers.claude.apiKey = process.env.ANTHROPIC_API_KEY;
    if (process.env.DEFAULT_PROVIDER) config.defaultProvider = process.env.DEFAULT_PROVIDER as LLMProvider;
    return config;
  }
  return JSON.parse(fs.readFileSync(configPath, "utf-8")) as AppConfig;
}

export function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/config.ts
git commit -m "feat: add config manager with local/global fallback"
```

---

### Task 3: LLM Clients

**Files:**
- Create: `src/core/clients/groq.ts`
- Create: `src/core/clients/cerebras.ts`
- Create: `src/core/clients/gemini.ts`
- Create: `src/core/clients/claude.ts`
- Create: `src/core/clients/index.ts`

- [ ] **Step 1: Write Groq client**

```typescript
// src/core/clients/groq.ts
import OpenAI from "openai";
import type { LLMClient } from "@/types";

export class GroqClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey, baseURL: "https://api.groq.com/openai/v1" });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }
}
```

- [ ] **Step 2: Write Cerebras client**

```typescript
// src/core/clients/cerebras.ts
import OpenAI from "openai";
import type { LLMClient } from "@/types";

export class CerebrasClient implements LLMClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new OpenAI({ apiKey, baseURL: "https://api.cerebras.ai/v1" });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    });
    return response.choices[0]?.message?.content ?? "";
  }
}
```

- [ ] **Step 3: Write Gemini client**

```typescript
// src/core/clients/gemini.ts
import { GoogleGenAI } from "@google/genai";
import type { LLMClient } from "@/types";

export class GeminiClient implements LLMClient {
  private client: GoogleGenAI;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new GoogleGenAI({ apiKey });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.models.generateContent({
      model: this.model,
      contents: userMessage,
      config: { systemInstruction: systemPrompt },
    });
    return response.text ?? "";
  }
}
```

- [ ] **Step 4: Write Claude client**

```typescript
// src/core/clients/claude.ts
import Anthropic from "@anthropic-ai/sdk";
import type { LLMClient } from "@/types";

export class ClaudeClient implements LLMClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
  }

  async complete(systemPrompt: string, userMessage: string): Promise<string> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: "user", content: userMessage }],
    });
    const block = response.content[0];
    return block.type === "text" ? block.text : "";
  }
}
```

- [ ] **Step 5: Write client factory index**

```typescript
// src/core/clients/index.ts
import type { LLMClient, LLMProvider, AppConfig } from "@/types";
import { GroqClient } from "./groq";
import { CerebrasClient } from "./cerebras";
import { GeminiClient } from "./gemini";
import { ClaudeClient } from "./claude";

export function createClient(config: AppConfig, overrideProvider?: LLMProvider): LLMClient {
  const provider = overrideProvider ?? config.defaultProvider;
  const providerConfig = config.providers[provider];
  if (!providerConfig.apiKey) {
    throw new Error(`No API key configured for provider: ${provider}. Run 'prompt-eng config' to set it up.`);
  }
  switch (provider) {
    case "groq":     return new GroqClient(providerConfig.apiKey, providerConfig.model);
    case "cerebras": return new CerebrasClient(providerConfig.apiKey, providerConfig.model);
    case "gemini":   return new GeminiClient(providerConfig.apiKey, providerConfig.model);
    case "claude":   return new ClaudeClient(providerConfig.apiKey, providerConfig.model);
    default:         throw new Error(`Unknown provider: ${provider}`);
  }
}
```

- [ ] **Step 6: Commit**

```bash
git add src/core/clients/
git commit -m "feat: add LLM clients for Groq, Cerebras, Gemini, and Claude"
```

---

### Task 4: Prompt Category Templates

**Files:**
- Create: `src/core/templates.ts`

- [ ] **Step 1: Write templates**

```typescript
// src/core/templates.ts
import type { PromptCategory } from "@/types";

export const TEMPLATES: Record<PromptCategory, string> = {
  coding: `You are an expert prompt engineer specializing in coding and engineering tasks.

Transform the raw user intent into a professional, structured prompt for an AI coding assistant.
Your engineered prompt MUST:
- Define a clear <role> using XML tags that establishes expertise.
- Wrap the main task in <instructions> XML tags with numbered steps.
- Add <constraints> for: output format (markdown code block only), language/framework specifics, performance/style rules.
- Add <rules> for things the AI must NOT do (e.g., no external libraries unless specified).
- Be specific enough that the AI has zero ambiguity.

Respond in this JSON format:
{
  "optimizedPrompt": "...",
  "explanation": "...",
  "requiredTools": ["bash", "read_file"],
  "executionStrategy": "sequential",
  "suggestedSubtasks": []
}`,

  image: `You are an expert prompt engineer specializing in AI image generation.

Transform the raw user intent into a professional image generation prompt.
Your engineered prompt MUST include:
- Subject and main focus (detailed description).
- Art style and medium (e.g., photorealistic, oil painting, anime).
- Lighting and atmosphere (golden hour, dramatic, soft diffused).
- Camera/composition details (wide angle, close-up, rule of thirds).
- Platform-specific parameters (Midjourney: --ar, --v, --style; SD: negative prompts).

Respond in this JSON format:
{
  "optimizedPrompt": "...",
  "explanation": "...",
  "requiredTools": [],
  "executionStrategy": "sequential",
  "suggestedSubtasks": []
}`,

  writing: `You are an expert prompt engineer specializing in creative and professional writing tasks.

Transform the raw user intent into a structured writing prompt.
Your engineered prompt MUST define:
- A clear persona/role for the AI author.
- Audience: who is reading this?
- Tone: formal, casual, persuasive, educational, etc.
- Structure: sections, word count, headings if needed.
- Any constraints: do not use jargon, avoid passive voice, etc.

Respond in this JSON format:
{
  "optimizedPrompt": "...",
  "explanation": "...",
  "requiredTools": [],
  "executionStrategy": "sequential",
  "suggestedSubtasks": []
}`,

  video: `You are an expert prompt engineer specializing in AI video generation.

Transform the raw user intent into a structured video generation prompt.
Your engineered prompt MUST include:
- Scene description (environment, time of day, weather).
- Subject action (what is happening, movement, speed).
- Camera movement (pan left, dolly in, static shot, aerial tracking).
- Visual style (cinematic, documentary, animation, hyper-realistic).
- Duration and pacing hints (e.g., "slow motion", "time lapse").

Respond in this JSON format:
{
  "optimizedPrompt": "...",
  "explanation": "...",
  "requiredTools": [],
  "executionStrategy": "sequential",
  "suggestedSubtasks": []
}`,
};

export function getTemplate(category: PromptCategory): string {
  return TEMPLATES[category];
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/templates.ts
git commit -m "feat: add prompt engineering templates for coding, image, writing, video"
```

---

### Task 5: Knowledge Manager

**Files:**
- Create: `src/core/knowledge.ts`

- [ ] **Step 1: Write knowledge manager**

```typescript
// src/core/knowledge.ts
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
  const treeRes = await fetch(treeUrl, { headers: { Accept: "application/vnd.github+json" } });
  if (!treeRes.ok) throw new Error(`GitHub API error: ${treeRes.status} ${treeRes.statusText}`);
  const treeData = await treeRes.json() as { tree: Array<{ path: string; type: string }> };

  const docFiles = treeData.tree.filter(
    (f) => f.type === "blob" && /\.(md|txt|yaml|yml|json)$/i.test(f.path)
  );

  // Fetch and concatenate all doc files (limit to 50 files)
  const contents: string[] = [];
  for (const file of docFiles.slice(0, 50)) {
    const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/HEAD/${file.path}`;
    const res = await fetch(rawUrl);
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
```

- [ ] **Step 2: Commit**

```bash
git add src/core/knowledge.ts
git commit -m "feat: add knowledge manager with GitHub fetcher and file upload support"
```

---

### Task 6: Core Prompt Engineering Engine

**Files:**
- Create: `src/core/engine.ts`

- [ ] **Step 1: Write engine**

```typescript
// src/core/engine.ts
import type { RefineRequest, PromptEngineerResult, PromptCategory, LLMClient } from "@/types";
import { getTemplate } from "./templates";
import { getRelevantContext } from "./knowledge";
import { readConfig } from "./config";
import { createClient } from "./clients";

const CATEGORY_DETECTION_PROMPT = `You are a task classifier. Given a raw user prompt, determine:
1. category: one of "coding", "image", "writing", "video"
2. complexity: "simple" | "moderate" | "complex"

Respond ONLY with valid JSON: { "category": "coding", "complexity": "simple" }`;

async function detectCategory(client: LLMClient, rawPrompt: string): Promise<{ category: PromptCategory; complexity: string }> {
  const result = await client.complete(CATEGORY_DETECTION_PROMPT, rawPrompt);
  try {
    return JSON.parse(result.trim());
  } catch {
    return { category: "coding", complexity: "simple" };
  }
}

export async function engineerPrompt(request: RefineRequest): Promise<PromptEngineerResult> {
  const config = readConfig();
  const client = createClient(config);

  // Stage 1: Intent Analysis — detect category if not provided
  const category = request.category ?? (await detectCategory(client, request.rawPrompt)).category;
  const targetModel = request.targetModel ?? config.providers[config.defaultProvider].model;

  // Stage 2: Context Enrichment — fetch relevant knowledge
  const knowledgeContext = getRelevantContext(category);

  // Stage 3: Output Generation — build meta-prompt and call LLM
  const systemPrompt = getTemplate(category) +
    (knowledgeContext ? `\n\nAdditional context from user knowledge base:\n${knowledgeContext}` : "") +
    (request.customInstructions ? `\n\nUser custom instructions:\n${request.customInstructions}` : "");

  const userMessage = `Raw prompt to engineer:\n\n"${request.rawPrompt}"\n\nTarget model: ${targetModel}`;

  const rawResult = await client.complete(systemPrompt, userMessage);

  // Parse JSON response from LLM
  let parsed: PromptEngineerResult;
  try {
    const jsonMatch = rawResult.match(/\{[\s\S]*\}/);
    const jsonStr = jsonMatch ? jsonMatch[0] : rawResult;
    parsed = { ...JSON.parse(jsonStr), targetModel, category };
  } catch {
    // Fallback: treat entire response as the optimized prompt
    parsed = {
      optimizedPrompt: rawResult,
      explanation: "Prompt has been structured for optimal model performance.",
      requiredTools: [],
      executionStrategy: "sequential",
      suggestedSubtasks: [],
      targetModel,
      category,
    };
  }

  return parsed;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/core/engine.ts
git commit -m "feat: add three-stage prompt engineering core engine"
```

---

## Phase 2 — Next.js Backend APIs

### Task 7: API Route — `POST /api/refine`

**Files:**
- Create: `src/app/api/refine/route.ts`

- [ ] **Step 1: Write refine API route**

```typescript
// src/app/api/refine/route.ts
import { NextRequest, NextResponse } from "next/server";
import { engineerPrompt } from "@/core/engine";
import type { RefineRequest } from "@/types";

export async function POST(req: NextRequest) {
  try {
    const body: RefineRequest = await req.json();
    if (!body.rawPrompt?.trim()) {
      return NextResponse.json({ error: "rawPrompt is required" }, { status: 400 });
    }
    const result = await engineerPrompt(body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/api/refine/
git commit -m "feat: add POST /api/refine route"
```

---

### Task 8: API Routes — Config and Knowledge

**Files:**
- Create: `src/app/api/config/route.ts`
- Create: `src/app/api/knowledge/route.ts`

- [ ] **Step 1: Write config API**

```typescript
// src/app/api/config/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readConfig, writeConfig } from "@/core/config";

export async function GET() {
  const config = readConfig();
  // Mask API keys for security — only return whether they are set
  const masked = structuredClone(config);
  for (const provider of Object.keys(masked.providers) as Array<keyof typeof masked.providers>) {
    masked.providers[provider].apiKey = masked.providers[provider].apiKey ? "***set***" : "";
  }
  return NextResponse.json(masked);
}

export async function POST(req: NextRequest) {
  try {
    const updates = await req.json();
    const config = readConfig();
    const merged = { ...config, ...updates };
    writeConfig(merged);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 2: Write knowledge API**

```typescript
// src/app/api/knowledge/route.ts
import { NextRequest, NextResponse } from "next/server";
import { readIndex, addFromGitHub, addFromUpload, deleteEntry } from "@/core/knowledge";

export async function GET() {
  return NextResponse.json(readIndex());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (body.githubUrl) {
      const entry = await addFromGitHub(body.githubUrl);
      return NextResponse.json(entry);
    } else if (body.filename && body.content) {
      const entry = addFromUpload(body.filename, body.content);
      return NextResponse.json(entry);
    } else {
      return NextResponse.json({ error: "Provide githubUrl or filename+content" }, { status: 400 });
    }
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    deleteEntry(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/api/config/ src/app/api/knowledge/
git commit -m "feat: add config and knowledge API routes"
```

---

## Phase 3 — Web Dashboard UI

### Task 9: Tailwind Neumorphism Design System

**Files:**
- Modify: `tailwind.config.ts`
- Modify: `src/app/globals.css`
- Modify: `src/app/layout.tsx`

- [ ] **Step 1: Configure Tailwind with custom Neumorphic shadows**

```typescript
// tailwind.config.ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        neu: {
          bg: "#0f172a",
          "bg-light": "#e2e8f0",
          surface: "#1e293b",
          "surface-light": "#f1f5f9",
          accent: "#38bdf8",
          "accent-dark": "#0284c7",
          success: "#10b981",
          text: "#f3f4f6",
          "text-muted": "#64748b",
          "text-light": "#1e293b",
        },
      },
      boxShadow: {
        "neu-raised": "8px 8px 16px #080d18, -8px -8px 16px #16213c",
        "neu-inset": "inset 4px 4px 8px #080d18, inset -4px -4px 8px #16213c",
        "neu-raised-light": "8px 8px 16px #c8d0db, -8px -8px 16px #fcffff",
        "neu-inset-light": "inset 4px 4px 8px #c8d0db, inset -4px -4px 8px #fcffff",
        "neu-btn": "4px 4px 10px #080d18, -4px -4px 10px #16213c",
        "neu-btn-light": "4px 4px 10px #c8d0db, -4px -4px 10px #fcffff",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
    },
  },
  plugins: [],
};

export default config;
```

- [ ] **Step 2: Update globals.css with Inter and JetBrains Mono from Google Fonts**

```css
/* src/app/globals.css */
@import url("https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap");
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --scrollbar-thumb: #334155;
  --scrollbar-track: #0f172a;
}

* {
  scrollbar-width: thin;
  scrollbar-color: var(--scrollbar-thumb) var(--scrollbar-track);
}

body {
  font-family: "Inter", system-ui, sans-serif;
  background-color: #0f172a;
  color: #f3f4f6;
}
```

- [ ] **Step 3: Update layout.tsx**

```tsx
// src/app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Prompt Engineer — AI Prompt Orchestration",
  description: "Engineer professional, model-specific prompts from natural language. Powered by Groq, Cerebras, Gemini, and Claude.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-neu-bg text-neu-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add tailwind.config.ts src/app/globals.css src/app/layout.tsx
git commit -m "feat: configure Tailwind Neumorphism design system"
```

---

### Task 10: Reusable UI Components

**Files:**
- Create: `src/components/ModelSelector.tsx`
- Create: `src/components/CategorySelector.tsx`
- Create: `src/components/PromptOutput.tsx`
- Create: `src/components/ExecutionPlan.tsx`
- Create: `src/components/NavBar.tsx`

- [ ] **Step 1: Create ModelSelector component**

```tsx
// src/components/ModelSelector.tsx
"use client";
const MODELS = [
  { label: "Groq — Llama 3.3 70B", value: "llama-3.3-70b-specdec", provider: "groq" },
  { label: "Cerebras — Llama 3.1 70B", value: "llama3.1-70b", provider: "cerebras" },
  { label: "Gemini 2.0 Flash", value: "gemini-2.0-flash", provider: "gemini" },
  { label: "Claude 3.5 Sonnet", value: "claude-3-5-sonnet-latest", provider: "claude" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function ModelSelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
        Target AI Model
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-neu-bg text-neu-text rounded-xl px-4 py-3 text-sm
          shadow-neu-inset border-none outline-none cursor-pointer
          focus:ring-2 focus:ring-neu-accent transition-all"
      >
        {MODELS.map((m) => (
          <option key={m.value} value={m.value}>{m.label}</option>
        ))}
      </select>
    </div>
  );
}
```

- [ ] **Step 2: Create CategorySelector component**

```tsx
// src/components/CategorySelector.tsx
"use client";
import type { PromptCategory } from "@/types";

const CATEGORIES: Array<{ value: PromptCategory; label: string; icon: string }> = [
  { value: "coding", label: "Coding & Engineering", icon: "💻" },
  { value: "image", label: "Image Generation", icon: "🎨" },
  { value: "writing", label: "Writing & Persona", icon: "✍️" },
  { value: "video", label: "Video Generation", icon: "🎬" },
];

interface Props {
  value: PromptCategory | "auto";
  onChange: (value: PromptCategory | "auto") => void;
}

export function CategorySelector({ value, onChange }: Props) {
  return (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
        Category
      </label>
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onChange("auto")}
          className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
            value === "auto"
              ? "bg-neu-accent text-white shadow-neu-btn"
              : "bg-neu-bg text-neu-text-muted shadow-neu-raised hover:text-neu-accent"
          }`}
        >
          🤖 Auto Detect
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.value}
            onClick={() => onChange(cat.value)}
            className={`rounded-xl px-3 py-2 text-xs font-medium transition-all ${
              value === cat.value
                ? "bg-neu-accent text-white shadow-neu-btn"
                : "bg-neu-bg text-neu-text-muted shadow-neu-raised hover:text-neu-accent"
            }`}
          >
            {cat.icon} {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Create PromptOutput component**

```tsx
// src/components/PromptOutput.tsx
"use client";
import type { PromptEngineerResult } from "@/types";
import { useState } from "react";

interface Props {
  result: PromptEngineerResult | null;
  loading: boolean;
}

export function PromptOutput({ result, loading }: Props) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.optimizedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-col gap-3 animate-pulse">
        <div className="h-4 rounded-lg bg-neu-surface w-2/3" />
        <div className="h-4 rounded-lg bg-neu-surface w-full" />
        <div className="h-4 rounded-lg bg-neu-surface w-5/6" />
        <div className="h-4 rounded-lg bg-neu-surface w-3/4" />
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex items-center justify-center h-48 text-neu-text-muted text-sm">
        Your engineered prompt will appear here
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex justify-between items-center">
        <span className="text-xs font-bold uppercase tracking-widest text-neu-text-muted">
          Engineered Prompt
        </span>
        <button
          onClick={handleCopy}
          className="text-xs px-3 py-1.5 rounded-lg shadow-neu-btn bg-neu-bg text-neu-accent
            hover:text-white hover:bg-neu-accent transition-all font-medium"
        >
          {copied ? "✓ Copied!" : "📋 Copy"}
        </button>
      </div>

      <pre className="bg-neu-bg shadow-neu-inset rounded-xl p-4 font-mono text-xs
        text-green-400 overflow-auto max-h-64 leading-relaxed whitespace-pre-wrap">
        {result.optimizedPrompt}
      </pre>

      <div className="bg-neu-bg shadow-neu-raised rounded-xl p-4">
        <p className="text-xs font-bold uppercase tracking-widest text-neu-accent mb-2">
          Why This Works
        </p>
        <p className="text-xs text-neu-text-muted leading-relaxed">{result.explanation}</p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Create ExecutionPlan component**

```tsx
// src/components/ExecutionPlan.tsx
"use client";
import type { PromptEngineerResult } from "@/types";

interface Props {
  result: PromptEngineerResult | null;
}

const TOOL_ICONS: Record<string, string> = {
  web_search: "🔍",
  read_file: "📄",
  bash: "💻",
  subagent: "🤖",
  write_file: "📝",
};

export function ExecutionPlan({ result }: Props) {
  if (!result || (!result.requiredTools.length && !result.suggestedSubtasks?.length)) return null;

  return (
    <div className="flex flex-col gap-3">
      <p className="text-xs font-bold uppercase tracking-widest text-neu-text-muted">
        Execution Plan
      </p>

      {result.requiredTools.length > 0 && (
        <div className="bg-neu-bg shadow-neu-raised rounded-xl p-4">
          <p className="text-xs font-semibold text-neu-text-muted mb-2">Required Tools</p>
          <div className="flex flex-wrap gap-2">
            {result.requiredTools.map((tool) => (
              <span key={tool} className="text-xs px-3 py-1 rounded-full bg-neu-surface
                text-neu-accent font-medium shadow-neu-raised">
                {TOOL_ICONS[tool] ?? "🔧"} {tool}
              </span>
            ))}
          </div>
        </div>
      )}

      {result.suggestedSubtasks && result.suggestedSubtasks.length > 0 && (
        <div className="bg-neu-bg shadow-neu-raised rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-xs font-semibold text-neu-text-muted">Strategy:</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
              result.executionStrategy === "fan_out"
                ? "bg-purple-900 text-purple-300"
                : "bg-blue-900 text-blue-300"
            }`}>
              {result.executionStrategy === "fan_out" ? "🌐 Fan-Out Subagents" : "⬇️ Sequential"}
            </span>
          </div>
          <ol className="flex flex-col gap-1">
            {result.suggestedSubtasks.map((task, i) => (
              <li key={i} className="text-xs text-neu-text-muted flex items-start gap-2">
                <span className="text-neu-accent font-bold shrink-0">{i + 1}.</span>
                {task}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 5: Create NavBar component**

```tsx
// src/components/NavBar.tsx
"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "⚡ Workspace" },
  { href: "/knowledge", label: "📚 Knowledge" },
  { href: "/settings", label: "⚙️ Settings" },
];

export function NavBar() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center justify-between px-6 py-3
      bg-neu-bg shadow-neu-raised rounded-2xl mx-4 mt-4">
      <span className="text-sm font-bold text-neu-accent tracking-tight">
        🧠 Prompt Engineer
      </span>
      <div className="flex gap-1">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs px-4 py-2 rounded-xl font-medium transition-all ${
              pathname === link.href
                ? "shadow-neu-inset text-neu-accent"
                : "text-neu-text-muted hover:text-neu-accent hover:shadow-neu-raised"
            }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
```

- [ ] **Step 6: Commit**

```bash
git add src/components/
git commit -m "feat: add Neumorphic UI components (ModelSelector, CategorySelector, PromptOutput, ExecutionPlan, NavBar)"
```

---

### Task 11: Main Workspace Page

**Files:**
- Modify: `src/app/page.tsx`
- Create: `src/app/knowledge/page.tsx`
- Create: `src/app/settings/page.tsx`

- [ ] **Step 1: Build main workspace page**

```tsx
// src/app/page.tsx
"use client";
import { useState } from "react";
import { NavBar } from "@/components/NavBar";
import { ModelSelector } from "@/components/ModelSelector";
import { CategorySelector } from "@/components/CategorySelector";
import { PromptOutput } from "@/components/PromptOutput";
import { ExecutionPlan } from "@/components/ExecutionPlan";
import type { PromptEngineerResult, PromptCategory } from "@/types";

export default function WorkspacePage() {
  const [rawPrompt, setRawPrompt] = useState("");
  const [targetModel, setTargetModel] = useState("llama-3.3-70b-specdec");
  const [category, setCategory] = useState<PromptCategory | "auto">("auto");
  const [customInstructions, setCustomInstructions] = useState("");
  const [result, setResult] = useState<PromptEngineerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleEngineer() {
    if (!rawPrompt.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rawPrompt,
          targetModel,
          category: category === "auto" ? undefined : category,
          customInstructions: customInstructions || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to engineer prompt");
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <NavBar />
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        {/* Left Pane — Input */}
        <div className="bg-neu-bg shadow-neu-raised rounded-2xl p-6 flex flex-col gap-5">
          <div>
            <h1 className="text-lg font-bold text-neu-text mb-1">Prompt Engineer</h1>
            <p className="text-xs text-neu-text-muted">
              Describe your intent in plain language. We'll engineer the perfect prompt.
            </p>
          </div>

          <ModelSelector value={targetModel} onChange={setTargetModel} />
          <CategorySelector value={category} onChange={setCategory} />

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
              Your Raw Intent
            </label>
            <textarea
              value={rawPrompt}
              onChange={(e) => setRawPrompt(e.target.value)}
              placeholder="e.g., build me a realtime chat app with websockets..."
              className="w-full h-40 bg-neu-bg shadow-neu-inset rounded-xl px-4 py-3
                text-sm text-neu-text placeholder:text-neu-text-muted resize-none
                border-none outline-none focus:ring-2 focus:ring-neu-accent transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-neu-text-muted mb-2">
              Custom Instructions (optional)
            </label>
            <textarea
              value={customInstructions}
              onChange={(e) => setCustomInstructions(e.target.value)}
              placeholder="e.g., use TypeScript, prefer functional components, no external dependencies..."
              className="w-full h-20 bg-neu-bg shadow-neu-inset rounded-xl px-4 py-3
                text-sm text-neu-text placeholder:text-neu-text-muted resize-none
                border-none outline-none focus:ring-2 focus:ring-neu-accent transition-all"
            />
          </div>

          {error && (
            <p className="text-xs text-red-400 bg-red-950 rounded-xl px-4 py-2">{error}</p>
          )}

          <button
            onClick={handleEngineer}
            disabled={loading || !rawPrompt.trim()}
            className="w-full py-3 rounded-xl font-semibold text-sm transition-all
              bg-neu-bg shadow-neu-btn text-neu-accent
              hover:bg-neu-accent hover:text-white hover:shadow-none
              disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? "⏳ Engineering..." : "✨ Engineer Prompt"}
          </button>
        </div>

        {/* Right Pane — Output */}
        <div className="bg-neu-bg shadow-neu-raised rounded-2xl p-6 flex flex-col gap-5">
          <PromptOutput result={result} loading={loading} />
          <ExecutionPlan result={result} />
        </div>
      </main>
    </div>
  );
}
```

- [ ] **Step 2: Build Knowledge page**

```tsx
// src/app/knowledge/page.tsx
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
```

- [ ] **Step 3: Build Settings page**

```tsx
// src/app/settings/page.tsx
"use client";
import { useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";

const PROVIDERS = [
  { key: "groq", label: "Groq", defaultModel: "llama-3.3-70b-specdec" },
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
          k[p.key] = data.providers?.[p.key]?.apiKey === "***set***" ? "" : "";
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
                placeholder={`Enter ${p.label} API key...`}
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
```

- [ ] **Step 4: Commit**

```bash
git add src/app/
git commit -m "feat: add Workspace, Knowledge, and Settings pages with Neumorphic UI"
```

---

## Phase 4 — CLI Tool

### Task 12: CLI Binary

**Files:**
- Create: `bin/cli.ts`

- [ ] **Step 1: Write CLI**

```typescript
// bin/cli.ts
#!/usr/bin/env node
import { Command } from "commander";
import readline from "readline";
import { engineerPrompt } from "../src/core/engine";
import { addFromGitHub, readIndex } from "../src/core/knowledge";
import { readConfig, writeConfig } from "../src/core/config";
import type { PromptCategory } from "../src/types";

const program = new Command();
program.name("prompt-eng").description("AI Prompt Engineer CLI").version("1.0.0");

// Main refine command
program
  .argument("[prompt]", "Raw prompt to engineer")
  .option("-m, --model <model>", "Target model")
  .option("-c, --category <category>", "Category: coding|image|writing|video")
  .action(async (prompt, options) => {
    const raw = prompt ?? await askQuestion("Enter your raw prompt:\n> ");
    console.log("\n⏳ Engineering your prompt...\n");
    const result = await engineerPrompt({
      rawPrompt: raw,
      targetModel: options.model,
      category: options.category as PromptCategory | undefined,
    });
    console.log("─".repeat(60));
    console.log("✨ OPTIMIZED PROMPT:\n");
    console.log(result.optimizedPrompt);
    console.log("\n─".repeat(60));
    console.log("💡 " + result.explanation);
    if (result.requiredTools.length) {
      console.log("🔧 Required Tools: " + result.requiredTools.join(", "));
    }
    if (result.suggestedSubtasks?.length) {
      console.log("📋 Execution Strategy: " + result.executionStrategy);
      result.suggestedSubtasks.forEach((t, i) => console.log(`   ${i + 1}. ${t}`));
    }
    console.log("");
    const confirm = await askQuestion("✅ Copy this prompt to clipboard? (Y/n): ");
    if (!confirm.trim() || confirm.trim().toLowerCase() === "y") {
      await copyToClipboard(result.optimizedPrompt);
      console.log("📋 Copied to clipboard!");
    }
  });

// Launch UI command
program
  .command("ui")
  .description("Start the web dashboard")
  .action(async () => {
    console.log("🚀 Starting Prompt Engineer web dashboard...");
    const { spawn } = await import("child_process");
    const server = spawn("npm", ["run", "dev"], { stdio: "inherit", shell: true });
    setTimeout(() => {
      import("open").then((m) => m.default("http://localhost:3000")).catch(() => {
        console.log("Open http://localhost:3000 in your browser");
      });
    }, 3000);
    server.on("close", (code) => process.exit(code ?? 0));
  });

// Config command
program
  .command("config")
  .description("Configure API keys")
  .action(async () => {
    const config = readConfig();
    const providers = ["groq", "cerebras", "gemini", "claude"] as const;
    for (const provider of providers) {
      const key = await askQuestion(`Enter ${provider} API key (leave blank to skip): `);
      if (key.trim()) config.providers[provider].apiKey = key.trim();
    }
    const def = await askQuestion(`Default provider (groq/cerebras/gemini/claude) [${config.defaultProvider}]: `);
    if (def.trim()) config.defaultProvider = def.trim() as typeof config.defaultProvider;
    writeConfig(config);
    console.log("✅ Config saved!");
  });

// Knowledge sub-commands
const knowledge = program.command("knowledge").description("Manage knowledge base");
knowledge.command("add <url>").description("Add GitHub repo").action(async (url) => {
  console.log("⏳ Fetching GitHub repo...");
  const entry = await addFromGitHub(url);
  console.log(`✅ Added: ${entry.name}`);
});
knowledge.command("list").description("List knowledge sources").action(() => {
  const entries = readIndex();
  if (!entries.length) { console.log("No knowledge sources."); return; }
  entries.forEach((e) => console.log(`• ${e.name} (${e.source}) — ${e.addedAt.slice(0, 10)}`));
});

function askQuestion(q: string): Promise<string> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => { rl.question(q, (a) => { rl.close(); resolve(a); }); });
}

async function copyToClipboard(text: string) {
  const { execSync } = await import("child_process");
  const platform = process.platform;
  try {
    if (platform === "win32") {
      execSync(`echo ${text.replace(/\n/g, " ")} | clip`);
    } else if (platform === "darwin") {
      execSync(`echo "${text}" | pbcopy`);
    } else {
      execSync(`echo "${text}" | xclip -selection clipboard`);
    }
  } catch { /* ignore clipboard errors */ }
}

program.parse();
```

- [ ] **Step 2: Commit**

```bash
git add bin/cli.ts
git commit -m "feat: add CLI tool with refine, ui, config, and knowledge commands"
```

---

## Phase 5 — MCP Server

### Task 13: MCP Server

**Files:**
- Create: `bin/mcp.ts`

- [ ] **Step 1: Write MCP server**

```typescript
// bin/mcp.ts
#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { engineerPrompt } from "../src/core/engine";
import type { PromptCategory } from "../src/types";

const server = new Server(
  { name: "prompt-engineer", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "refine_prompt",
      description:
        "Engineers a professional, structured prompt from a raw natural language intent. " +
        "Analyzes the task, selects the right template, enriches with knowledge context, " +
        "and returns the optimized prompt along with required tools and an execution strategy.",
      inputSchema: {
        type: "object",
        properties: {
          rawPrompt: { type: "string", description: "The raw natural language intent to engineer." },
          targetModel: { type: "string", description: "Target AI model (e.g. 'claude-3-5-sonnet-latest', 'gemini-2.0-flash', 'midjourney')." },
          category: { type: "string", enum: ["coding", "image", "writing", "video"], description: "Prompt category. Auto-detected if not provided." },
          customInstructions: { type: "string", description: "Additional constraints or instructions to factor in." },
        },
        required: ["rawPrompt"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  if (request.params.name !== "refine_prompt") {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  const args = request.params.arguments as {
    rawPrompt: string;
    targetModel?: string;
    category?: PromptCategory;
    customInstructions?: string;
  };
  const result = await engineerPrompt(args);
  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(result, null, 2),
      },
    ],
  };
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
```

- [ ] **Step 2: Create MCP README snippet for users**

Create `MCP_SETUP.md`:
```markdown
# Using Prompt Engineer as an MCP Server

## Zero-Install (Recommended)

Add to your agent config (e.g. `claude_config.json` or `.cursor/mcp.json`):

```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "npx",
      "args": ["prompt-engineer-mcp"]
    }
  }
}
```

## Global Install

```bash
npm install -g prompt-engineer-mcp
```

Then configure:
```json
{
  "mcpServers": {
    "prompt-engineer": {
      "command": "prompt-engineer-mcp"
    }
  }
}
```

## Available Tool: `refine_prompt`

Call it from any MCP-compatible agent:
- `rawPrompt` (required): Your raw intent.
- `targetModel` (optional): e.g. `"claude-3-5-sonnet-latest"`.
- `category` (optional): `"coding"` | `"image"` | `"writing"` | `"video"`.
- `customInstructions` (optional): Extra constraints.
```

- [ ] **Step 3: Commit**

```bash
git add bin/mcp.ts MCP_SETUP.md
git commit -m "feat: add MCP server with refine_prompt tool and setup documentation"
```

---

## Phase 6 — Verification

### Task 14: Final Verification

- [ ] **Step 1: Verify the Next.js dashboard starts**

```bash
npm run dev
```
Expected: Server starts at `http://localhost:3000` with no errors.

- [ ] **Step 2: Verify web workspace**

- Open `http://localhost:3000`
- Input: "build a rest api with authentication in node"
- Select: Claude 3.5 Sonnet / Coding & Engineering
- Click "Engineer Prompt"
- Expected: Engineered prompt with XML tags appears in the output pane, plus required tools and execution strategy.

- [ ] **Step 3: Verify knowledge base**

- Go to `http://localhost:3000/knowledge`
- Add: `https://github.com/anthropics/prompt-library`
- Expected: Entry appears in the list.

- [ ] **Step 4: Verify Settings page**

- Go to `http://localhost:3000/settings`
- Enter a Groq API key and save
- Expected: "Saved!" confirmation appears.

- [ ] **Step 5: Verify CLI**

```bash
npx tsx bin/cli.ts "create a login form in react"
```
Expected: Optimized prompt printed in terminal with execution plan, then Y/n prompt.

- [ ] **Step 6: Verify MCP config**

Check `bin/mcp.ts` runs without errors:
```bash
npx tsx bin/mcp.ts
```
Expected: Process starts listening on stdio with no crashes.

- [ ] **Step 7: Final commit**

```bash
git add .
git commit -m "chore: final polish and verification"
```
