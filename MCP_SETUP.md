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
