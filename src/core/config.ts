import fs from "fs";
import path from "path";
import os from "os";
import type { AppConfig, LLMProvider } from "@/types";

const DEFAULT_CONFIG: AppConfig = {
  defaultProvider: "groq",
  providers: {
    groq: { apiKey: "", model: "llama-3.3-70b-versatile" },
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
