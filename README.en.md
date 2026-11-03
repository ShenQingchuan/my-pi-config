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

## Remote Access (Pi Web + Cloudflare Tunnel)

Turns Pi into a service you can reach from your phone. Both processes run under PM2 and restart automatically if they die.

1. Install `pm2` globally (`bun add -g pm2`) and `cloudflared` (`brew install cloudflared`, or drop the binary into `~/.local/bin`).
2. Copy the secrets file and fill it in: `cp .env.example .env.local` (`.env.local` is git-ignored; re-create it once per machine).
3. Start everything: `bun run stack:start`, then save the boot snapshot: `bun run stack:save`.

| Command | Effect |
| --- | --- |
| `bun run stack:start` | Start / reload Pi Web and Cloudflare Tunnel |
| `bun run stack:stop` | Stop both processes |
| `bun run stack:restart` | Restart both processes |
| `bun run stack:status` | Show running state |
| `bun run stack:logs` | Tail live logs |
| `bun run stack:save` | Save the current process list as the boot snapshot |
| `bun run stack:autostart` | Install boot autostart + tunnel health check (macOS LaunchAgent, no sudo needed) |

Order for boot autostart: start the services → `bun run stack:save` to freeze the snapshot → `bun run stack:autostart`. It installs two LaunchAgents:

- `dev.local.pm2-resurrect`: runs `pm2 resurrect` on login to bring the snapshot back
- `dev.local.pi-stack-health`: probes the public URL every 5 minutes and restarts `cloudflared` after two consecutive failures

The health check is not optional: PM2 only watches process liveness, while `cloudflared` can keep a process alive with a tunnel that never connects — PM2 sees nothing wrong.

> `cloudflared` should only run under PM2. If it was ever installed as a system service with `sudo cloudflared service install`, remove it first, otherwise two connectors fight over the same tunnel:
> `sudo launchctl bootout system/com.cloudflare.cloudflared && sudo rm /Library/LaunchDaemons/com.cloudflare.cloudflared.plist`
>
> Likewise, if you tried `sudo pm2 startup` before, it may have left a broken plist behind: `sudo rm -f ~/Library/LaunchAgents/pm2.*.plist`

## Quick Start

```bash
git clone git@github.com:ShenQingchuan/my-pi-config.git
cd my-pi-config
bun install
./scripts/install.sh
pi update --extensions
```

