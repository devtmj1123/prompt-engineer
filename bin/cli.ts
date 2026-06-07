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
