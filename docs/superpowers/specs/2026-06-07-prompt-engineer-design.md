# Design Spec: Prompt Engineer — Hybrid Orchestration System (CLI + MCP + Next.js Web App)

A hybrid AI-powered **Prompt Engineering** system. It doesn't just reformat prompts — it *thinks*, *analyzes*, *plans*, and *orchestrates*. Given a raw natural language intent, the Prompt Engineer produces a fully structured prompt, identifies what tools the agent needs, and lays out an execution strategy (sequential or parallel/fan-out subagents).

**Four Delivery Surfaces:**
1. **Next.js Web Dashboard** — Visual, Neumorphic UI for interactive prompt engineering.
2. **CLI Tool** — Terminal-based interface for developers integrating into workflows.
3. **MCP Server** — Model Context Protocol server installable via `npm` for agents like Claude Code, Cursor, Codex.
4. **Shared Core Engine** — Reusable TypeScript module shared by all surfaces.

---

## 1. System Architecture

```
prompt_engineer/
├── bin/
│   ├── cli.ts               # CLI entry point
│   └── mcp.ts               # MCP server entry point
├── docs/
│   └── superpowers/
│       ├── specs/
│       └── plans/
├── public/
├── src/
│   ├── app/                 # Next.js App Router
│   │   ├── api/
│   │   │   ├── config/      # Read/write API keys and settings
│   │   │   ├── refine/      # Core prompt engineering endpoint
│   │   │   └── knowledge/   # Add/list/delete knowledge sources
│   │   ├── layout.tsx
│   │   └── page.tsx         # Main workspace UI
│   ├── core/                # Shared logic (used by web, CLI, and MCP)
│   │   ├── clients/
│   │   │   ├── groq.ts
│   │   │   ├── cerebras.ts
│   │   │   ├── gemini.ts
│   │   │   └── claude.ts
│   │   ├── config.ts        # Config manager (local + global fallback)
│   │   ├── engine.ts        # Main prompt engineering logic (analyze → plan → generate)
│   │   ├── knowledge.ts     # Knowledge manager (GitHub fetcher + file upload handler)
│   │   └── templates.ts     # Target model prompt templates
│   ├── components/          # Reusable Next.js React components
│   └── types/               # Shared TypeScript types
├── knowledge/               # Default knowledge base (user-added docs live here)
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 2. The Prompt Engineering Engine (`src/core/engine.ts`)

This is the brain. Given a raw user intent, it does 3 stages:

### Stage 1: Intent Analysis
- Reads the raw prompt and calls the configured LLM to extract:
  - **Core Task**: What is the user actually trying to accomplish?
  - **Domain**: coding, image-gen, writing, video-gen
  - **Complexity**: simple/moderate/complex (determines execution strategy)
  - **Ambiguities**: List of unclear aspects that need resolution

### Stage 2: Context Enrichment
- Retrieves relevant documents from the **Knowledge Base** (user-added GitHub docs or uploaded files).
- Applies the appropriate **Target Model Template** (coding → XML tags, image → parameter strings, etc.).

### Stage 3: Output Generation
Returns a structured `PromptEngineerResult`:
```typescript
interface PromptEngineerResult {
  optimizedPrompt: string;         // The fully engineered, model-specific prompt
  explanation: string;             // Why it was structured this way
  requiredTools: string[];         // e.g. ["web_search", "read_file", "bash"]
  executionStrategy: "sequential" | "fan_out";  // How the agent should execute
  suggestedSubtasks?: string[];    // If fan_out: ordered list of parallel subtasks
  targetModel: string;             // The model this prompt is optimized for
  category: PromptCategory;        // coding | image | writing | video
}
```

---

## 3. Knowledge Base (`src/core/knowledge.ts`)

Users can enrich the prompt engine with custom context:

### Input Sources
- **GitHub Repository URL**: Fetches README + all `.md`, `.yaml`, `.json` files from the default branch of any public GitHub repo. Indexes content for retrieval.
- **File Upload**: Users can upload `.md`, `.txt`, `.yaml`, `.json` files directly via the web dashboard.

### Storage
- Fetched/uploaded documents are stored locally under `/knowledge/` as flat markdown files.
- A `knowledge-index.json` file tracks each entry: `{ id, name, source, addedAt, description }`.

### Usage
- At Stage 2 of the engine, relevant knowledge documents are retrieved based on task domain and injected as context into the meta-prompt sent to the LLM.

---

## 4. Prompt Category Templates (`src/core/templates.ts`)

Each category defines how to engineer the prompt for the target model:

### Priority Order (Phase 1 → Phase 4)
1. **Coding & Engineering** (Claude/Gemini/GPT) — XML tags, role definition, constraints, output format, error boundaries.
2. **Image Generation** (Midjourney/Stable Diffusion/DALL-E) — Style, lighting, subject, composition, camera parameters, aspect ratio, negative prompts.
3. **Writing & Persona** (Claude/GPT) — Tone, audience, length, persona, structure requirements.
4. **Video Generation** (Sora/Runway/Pika) — Scene, camera motion, speed, mood, temporal coherence.

---

## 5. Multi-Provider LLM Client (`src/core/clients/`)

A unified `LLMClient` interface implemented by:
- **Groq** — via `openai` SDK with Groq base URL.
- **Cerebras** — via `openai` SDK with Cerebras base URL.
- **Gemini** — via `@google/genai` SDK.
- **Claude** — via `@anthropic-ai/sdk`.

Selected provider is read from `config.ts`. All clients implement:
```typescript
interface LLMClient {
  complete(systemPrompt: string, userMessage: string): Promise<string>;
}
```

---

## 6. Configuration Manager (`src/core/config.ts`)

- Reads/writes `.prompt-eng-config.json` in the project root (if present) OR `~/.config/prompt-engineer/config.json` globally.
- Schema:
```json
{
  "defaultProvider": "groq",
  "providers": {
    "groq": { "apiKey": "", "model": "llama-3.3-70b-specdec" },
    "cerebras": { "apiKey": "", "model": "llama3.1-70b" },
    "gemini": { "apiKey": "", "model": "gemini-2.0-flash" },
    "claude": { "apiKey": "", "model": "claude-3-5-sonnet-latest" }
  }
}
```

---

## 7. Web Dashboard (`src/app/`)

**Stack:** Next.js 15 App Router + TypeScript + Tailwind CSS v4 + Neumorphism design language.

### Pages
- **`/` (Workspace)**: Main prompt engineering interface. Two-pane layout:
  - **Left Pane**: Raw prompt input, target model selector, category preset selector.
  - **Right Pane**: Optimized prompt output, execution plan, required tools badges, explanation panel, one-click copy button.
- **`/knowledge` (Knowledge Base)**: Browse, add (by GitHub URL or file upload), and delete knowledge sources.
- **`/settings` (Settings)**: Configure API keys and default provider per LLM.

### Design System
- **Base**: Soft-UI / Neumorphism using Tailwind's `shadow-*` utilities.
- **Dark Mode**: Default dark Neumorphic palette (`#0f172a` base with layered shadows).
- **Light Mode**: Available via toggle, light Neumorphic palette (`#e2e8f0` base).
- **Typography**: `Inter` from Google Fonts.
- **Animations**: Subtle fade/slide transitions on prompt output appearance.

---

## 8. CLI Tool (`bin/cli.ts`)

| Command | Behavior |
|---|---|
| `prompt-eng "raw prompt"` | Engineers the prompt, prints result, shows execution plan, asks `Y/n` to copy to clipboard |
| `prompt-eng` (no args) | Interactive terminal questionnaire |
| `prompt-eng ui` | Starts Next.js server and opens web dashboard in browser |
| `prompt-eng config` | Interactive API key configuration wizard |
| `prompt-eng knowledge add <url>` | Adds a GitHub repo URL to the knowledge base |
| `prompt-eng knowledge list` | Lists all knowledge sources |

---

## 9. MCP Server (`bin/mcp.ts`)

Installable via:
- `npm install -g prompt-engineer-mcp`
- `npx prompt-engineer-mcp` (zero install)

Configured in agent tools config:
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

**Exposed Tool:**

`refine_prompt`:
- **Input**: `rawPrompt` (string, required), `targetModel` (string?), `category` (string?), `customInstructions` (string?)
- **Output**: `{ optimizedPrompt, explanation, requiredTools, executionStrategy, suggestedSubtasks }`

---

## 10. Verification Plan

### Automated Tests
- `src/core/config.ts` — test read/write and fallback to global path.
- `src/core/engine.ts` — test all 3 stages with mocked LLM client.
- `src/core/knowledge.ts` — test GitHub fetch parsing and file indexing.
- `src/core/clients/` — test each client maps args correctly (mocked API calls).

### Manual Verification
- **Web App**: Launch `npm run dev`, input a raw coding prompt, verify structured output + execution plan display.
- **CLI**: Run `npx ts-node bin/cli.ts "build a login page in react"` and confirm output + clipboard copy.
- **MCP**: Configure in Claude Code or Codex, call `refine_prompt` with a sample prompt, verify structured JSON response.
- **Knowledge**: Add a GitHub URL (`https://github.com/anthropics/prompt-library`), input a prompt, verify the fetched docs appear in the explanation.
