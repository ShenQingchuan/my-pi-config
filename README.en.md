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
```

> Context7 and AnySearch work without a key too, just with lower rate limits; DeepWiki is entirely free.

## Quick Start

```bash
git clone git@github.com:ShenQingchuan/my-pi-config.git
cd my-pi-config
bun install
./scripts/install.sh
pi update --extensions
```

