# My Pi Configuration

This repository is the portable source of truth for my Pi configuration. It intentionally excludes credentials, session history, memory databases, caches, and `node_modules`.

中文说明请见 [README.md](README.md)。

## Contents

- `config/settings.shared.json` — shared Pi settings and selected packages; model preferences are deliberately excluded.
- `system.md` — global system prompt.
- `extension-config/open-tui.json` — configuration for `pi-open-tui`.
- `extension-config/pi-fff.json` — configuration for `@ff-labs/pi-fff`.
- `npm/package.json` and `npm/package-lock.json` — package selection and exact resolved versions.
- `install.ts` — installation and merge logic written in Bun + TypeScript.

## Model-setting merge rule

`defaultProvider`, `defaultModel`, `defaultThinkingLevel`, `modelThinkingLevels`, and `enabledModels` are local-only settings. During installation, their values from an existing `~/.pi/agent/settings.json` are kept and never replaced by this repository. On a new computer with no existing values, Pi uses its own defaults until you select and save a model.

## Install on a new computer

1. Install Pi and make sure `pi` is on `PATH`.
2. Install Bun with your own environment manager. This repository checks for Bun but never installs it automatically.
3. Clone this repository and run:

   ```bash
   ./install.sh
   pi update --extensions
   ```

`install.sh` verifies Bun and then invokes `install.ts`. The installer merges shared settings with machine-local model settings into `~/.pi/agent/settings.json`, then creates symbolic links for the other managed files. Replaced files are first backed up under `~/.pi/agent/backups/`.

Authenticate providers separately on each computer; authentication data is intentionally not committed.

## Update this setup

Edit and commit repository files. When Pi's package manager changes packages, the linked `npm/package.json` and `npm/package-lock.json` record the selection and resolved versions; review and commit those changes too.
