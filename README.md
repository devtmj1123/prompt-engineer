# Prompt Engineer 🧠

A professional, model-specific prompt engineering orchestration engine and hybrid app. It helps you design and refine natural language prompts into optimized instructions tailored specifically for target LLMs, with custom guidelines, structural strategies, and external context.

Powered by Next.js 16 (App Router + Tailwind CSS v4), TypeScript, Groq, Cerebras, Google Gemini, and Anthropic Claude.

---

## 🚀 Features

- **Dashboard Workspace**: Beautiful, premium neumorphic UI with smooth transitions supporting both **Light Mode** and **Dark Mode**.
- **Model-Specific Optimization**: Tailors outputs to structural patterns preferred by Groq, Cerebras, Gemini, and Claude.
- **Knowledge Base & Skills**: Upload text files or fetch from public GitHub repositories (up to 50 markdown/txt/yaml files) to serve as prompt context.
- **Category Strategies**: Specialized instruction sets for Coding, Images, Writing, and Video generation.
- **Execution Plans**: Outlines the tools required and suggested strategies (Sequential vs. Fan-Out subagents) to complete the engineered prompt's goal.
- **CLI Binary**: Run `prompt-eng` commands from the terminal to refine prompts, update settings, search knowledge bases, or spin up the web dashboard.
- **MCP Server Protocol**: Zero-install stdio MCP server for agentic workspaces (like Claude Desktop) to request prompt optimization tools.

---

## 🛠️ Getting Started

### 1. Setup API Keys
Before running, copy `.env.example` to `.env` and configure your API keys (Groq is set as default):
```bash
cp .env.example .env
```
Or use the dashboard Settings tab, or the CLI tool:
```bash
npm run cli config set groq API_KEY
```

### 2. Run the Web Dashboard
Start the development server:
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser.

### 3. Run the CLI
Optimizing a prompt via terminal:
```bash
npm run cli "React login form" -- -m llama-3.3-70b-versatile
```

### 4. Run MCP Server
To start the Model Context Protocol stdio server:
```bash
npm run mcp
```
See [MCP_SETUP.md](file:///c:/Users/mjtan/Desktop/prompt_engineer/MCP_SETUP.md) for full configuration guidelines.

---

## 📜 Open Source & Licensing

Licensed under the [Apache License 2.0](LICENSE). 

Copyright © 2026 devtmj1123. All rights reserved.

