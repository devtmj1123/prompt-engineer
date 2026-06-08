import type { WebSearchResult } from "@/types";

// Rotate User-Agent to avoid bot detection
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
];

function randomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Strip HTML tags and clean up text content.
 * Removes ads, navigation, boilerplate, and collapses whitespace.
 */
function cleanHtml(html: string): string {
  return html
    // Remove script/style tags and their content
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, "")
    // Remove all remaining tags
    .replace(/<[^>]+>/g, " ")
    // Decode common HTML entities
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#\d+;/g, "")
    // Remove ad / boilerplate markers
    .replace(/\b(Sponsored|Ad|Advertisement|Cookie|Subscribe|Newsletter|Sign up|Log in)\b/gi, "")
    // Collapse whitespace
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Extract text between two regex patterns from HTML.
 */
function extractBetween(html: string, startRe: RegExp, endRe: RegExp): string {
  const startMatch = startRe.exec(html);
  if (!startMatch) return "";
  const startIdx = startMatch.index + startMatch[0].length;
  const rest = html.slice(startIdx);
  const endMatch = endRe.exec(rest);
  const endIdx = endMatch ? endMatch.index : rest.length;
  return rest.slice(0, endIdx);
}

/**
 * Parse DuckDuckGo HTML search results.
 * DDG lite returns a simple HTML page with result blocks.
 */
function parseResults(html: string, maxResults: number): WebSearchResult[] {
  const results: WebSearchResult[] = [];

  // Split by result blocks — each result lives inside <div class="result ...">
  const resultBlocks = html.split(/<div\s+class="result[\s"]/i);

  for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
    const block = resultBlocks[i];

    // Extract title from <a class="result__a" ...>Title</a>
    const titleMatch = block.match(/<a\s+class="result__a"[^>]*>([\s\S]*?)<\/a>/i);
    // Extract snippet from <a class="result__snippet" ...>snippet</a> or <td class="result-snippet">
    const snippetMatch = block.match(/<a\s+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i)
      || block.match(/<td\s+class="result-snippet"[^>]*>([\s\S]*?)<\/td>/i);
    // Extract URL from <a class="result__url" href="...">
    const urlMatch = block.match(/<a\s+class="result__url"[^>]*href="([^"]+)"/i);

    if (titleMatch) {
      const title = cleanHtml(titleMatch[1]).trim();
      const snippet = snippetMatch ? cleanHtml(snippetMatch[1]).trim() : "";
      let url = urlMatch ? urlMatch[1].trim() : "";

      // DDG redirects through //duckduckgo.com/l/?uddg=... — extract real URL
      const uddgMatch = url.match(/uddg=([^&]+)/);
      if (uddgMatch) url = decodeURIComponent(uddgMatch[1]);

      if (title) {
        results.push({ title, snippet, url });
      }
    }
  }

  return results;
}

/**
 * Search the web via DuckDuckGo HTML lite endpoint.
 * Free, no API key, no signup. Includes bot-block prevention.
 */
export async function searchWeb(query: string, maxResults: number = 5): Promise<WebSearchResult[]> {
  const encoded = encodeURIComponent(query);
  const url = `https://html.duckduckgo.com/html/?q=${encoded}`;

  const headers: Record<string, string> = {
    "User-Agent": randomUA(),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://duckduckgo.com/",
    "Connection": "keep-alive",
  };

  // Try up to 2 times with different User-Agent on failure
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      if (attempt > 0) {
        headers["User-Agent"] = randomUA();
        await delay(300 + Math.random() * 400);
      }

      const res = await fetch(url, {
        headers,
        redirect: "follow",
        signal: AbortSignal.timeout(8000),
      });

      if (!res.ok) {
        if (attempt === 0 && (res.status === 403 || res.status === 429)) continue;
        return [];
      }

      const html = await res.text();
      return parseResults(html, maxResults);
    } catch {
      if (attempt === 0) continue;
      return [];
    }
  }

  return [];
}

/**
 * Clean and trim search results to a token-efficient text block.
 * Caps at ~3500 chars (~875 tokens) to stay within context budgets.
 */
function formatResults(results: WebSearchResult[], maxChars: number = 3500): string {
  if (results.length === 0) return "";

  const lines: string[] = [];
  let total = 0;

  for (const r of results) {
    // Clean each field
    const title = cleanHtml(r.title).slice(0, 120);
    const snippet = cleanHtml(r.snippet).slice(0, 300);
    const url = r.url.slice(0, 200);

    const line = snippet ? `${title} — ${snippet} (${url})` : `${title} (${url})`;

    if (total + line.length + 1 > maxChars) break;
    lines.push(line);
    total += line.length + 1;
  }

  return lines.join("\n");
}

/**
 * High-level: search the web and return a clean context string for the LLM.
 * Returns empty string on failure (graceful degradation).
 */
export async function getWebContext(query: string): Promise<{ context: string; results: WebSearchResult[] }> {
  try {
    const results = await searchWeb(query, 5);
    const context = formatResults(results);
    return { context, results };
  } catch {
    return { context: "", results: [] };
  }
}
