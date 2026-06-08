import fs from "fs";
import path from "path";
import os from "os";
import type { AppConfig, LLMProvider } from "@/types";
import { encrypt, decrypt, isEncrypted } from "./crypto";

const DEFAULT_CONFIG: AppConfig = {
  defaultProvider: "groq",
  providers: {
    groq: { apiKey: "", model: "llama-3.3-70b-versatile" },
    cerebras: { apiKey: "", model: "llama3.1-70b" },
    gemini: { apiKey: "", model: "gemini-2.0-flash" },
    claude: { apiKey: "", model: "claude-3-5-sonnet-latest" },
    openai: { apiKey: "", model: "gpt-4o" },
    deepseek: { apiKey: "", model: "deepseek-chat" },
    xiaomi: { apiKey: "", model: "mimo-chat" },
  },
};

function getConfigPath(): string | null {
  // On Vercel / serverless: read-only filesystem, skip file-based config
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL_ENV) {
    return null;
  }
  const localPath = path.join(process.cwd(), ".prompt-eng-config.json");
  if (fs.existsSync(localPath)) return localPath;
  try {
    const globalDir = path.join(os.homedir(), ".config", "prompt-engineer");
    fs.mkdirSync(globalDir, { recursive: true });
    return path.join(globalDir, "config.json");
  } catch {
    // Filesystem is read-only (e.g. serverless), fall back to env vars only
    return null;
  }
}

/**
 * Decrypt all API keys in a config object (in-place).
 * Handles both encrypted ("enc:...") and legacy plaintext keys.
 */
function decryptConfig(config: AppConfig): AppConfig {
  for (const provider of Object.keys(config.providers) as LLMProvider[]) {
    const key = config.providers[provider].apiKey;
    if (key && isEncrypted(key)) {
      config.providers[provider].apiKey = decrypt(key);
    }
  }
  return config;
}

/**
 * Encrypt all non-empty API keys in a config object (returns a new object).
 */
function encryptConfig(config: AppConfig): AppConfig {
  const encrypted = structuredClone(config);
  for (const provider of Object.keys(encrypted.providers) as LLMProvider[]) {
    const key = encrypted.providers[provider].apiKey;
    if (key && !isEncrypted(key)) {
      encrypted.providers[provider].apiKey = encrypt(key);
    }
  }
  return encrypted;
}

export function readConfig(): AppConfig {
  const configPath = getConfigPath();

  // Serverless / no config file on disk — build from env vars
  if (!configPath || !fs.existsSync(configPath)) {
    const config = structuredClone(DEFAULT_CONFIG);
    if (process.env.GROQ_API_KEY) config.providers.groq.apiKey = process.env.GROQ_API_KEY;
    if (process.env.CEREBRAS_API_KEY) config.providers.cerebras.apiKey = process.env.CEREBRAS_API_KEY;
    if (process.env.GEMINI_API_KEY) config.providers.gemini.apiKey = process.env.GEMINI_API_KEY;
    if (process.env.ANTHROPIC_API_KEY) config.providers.claude.apiKey = process.env.ANTHROPIC_API_KEY;
    if (process.env.OPENAI_API_KEY) config.providers.openai.apiKey = process.env.OPENAI_API_KEY;
    if (process.env.DEEPSEEK_API_KEY) config.providers.deepseek.apiKey = process.env.DEEPSEEK_API_KEY;
    if (process.env.XIAOMI_API_KEY) config.providers.xiaomi.apiKey = process.env.XIAOMI_API_KEY;
    if (process.env.DEFAULT_PROVIDER) config.defaultProvider = process.env.DEFAULT_PROVIDER as LLMProvider;
    return config;
  }

  const raw = JSON.parse(fs.readFileSync(configPath, "utf-8")) as AppConfig;
  return decryptConfig(raw);
}

export function writeConfig(config: AppConfig): void {
  const configPath = getConfigPath();
  if (!configPath) return; // read-only filesystem, skip persist
  const encrypted = encryptConfig(config);
  fs.writeFileSync(configPath, JSON.stringify(encrypted, null, 2), "utf-8");
}
