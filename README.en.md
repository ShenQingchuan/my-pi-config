# My Pi Configuration

A portable Pi configuration repository for consistent setup across multiple computers.

[中文](README.md)

## Included

- Global system prompt
- Selected Pi packages and locked versions
- Extension settings for `pi-open-tui`, `pi-fff`, and more
- Built-in MCP servers (Context7, DeepWiki, AnySearch)

## Features

- Restore a consistent Pi experience on different computers
- Keep model selection local to each computer

## MCP Servers

Configuration lives in `extension-config/mcp.json`, linked to `~/.pi/agent/mcp.json` on install.

| Server | Purpose | Key |
| --- | --- | --- |
| Context7 | Up-to-date library / framework docs | Optional, `CONTEXT7_API_KEY` (get one at [context7.com/dashboard](https://context7.com/dashboard)) |
| DeepWiki | AI docs for GitHub repositories | No key needed (free) |
| AnySearch | Web / vertical-domain search | Optional, `ANYSEARCH_API_KEY` (get one at [anysearch.com/console/api-keys](https://anysearch.com/console/api-keys)) |

Keys are supplied via environment variables; add them to your shell profile (e.g. `~/.zshrc`):

```bash
export CONTEXT7_API_KEY="your Context7 key"
export ANYSEARCH_API_KEY="your AnySearch key"
# pi-claude-code-ui reads ~/.pi/settings.json by default; point it at the real settings file
export PI_CODING_AGENT_DIR="$HOME/.pi/agent"
```

> Context7 and AnySearch work without a key too, just with lower rate limits; DeepWiki is entirely free.

## Model providers

Configuration lives in `extension-config/models.json`, linked to `~/.pi/agent/models.json` on install.

`sub2tok` is an OpenAI-compatible proxy that serves Claude, GPT and Gemini models (22 in total).

```bash
export SUB2TOK_API_KEY="sk-..."
```

Only the environment variable is referenced; no plaintext key is stored. Pick a model with `/model`, or name it on the command line:

```bash
pi --provider sub2tok --model gemini-3.8-flash
```

Prices are not recorded in the config (all set to 0), and `contextWindow` / `maxTokens` are conservative estimates. Check the proxy's documentation for exact billing.

## Quick Start

```bash
git clone git@github.com:ShenQingchuan/my-pi-config.git
cd my-pi-config
bun install
./scripts/install.sh
pi update --extensions
```

