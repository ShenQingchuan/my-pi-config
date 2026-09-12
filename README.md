# My Pi configuration

This repository is the portable source of truth for my Pi setup. It intentionally **does not** contain credentials, session history, memory databases, caches, or installed `node_modules`.

## Contents

- `config/settings.json` — Pi global settings and selected package list.
- `system.md` — global system prompt.
- `extension-config/open-tui.json` — settings for `pi-open-tui`.
- `extension-config/pi-fff.json` — settings for `@ff-labs/pi-fff`.
- `npm/package.json` and `npm/package-lock.json` — selected packages plus exact resolved dependency versions.

## Install on a new computer

1. Install Pi and ensure `pi` is on `PATH`.
2. Clone this repository anywhere.
3. Run:

   ```bash
   ./install.sh
   pi update --extensions
   ```

`install.sh` creates symbolic links in `~/.pi/agent` (or `$PI_CONFIG_DIR`) for all tracked configuration files. Existing files are moved to a timestamped backup under `~/.pi/agent/backups/` first. The `pi update --extensions` command downloads/reconciles packages listed in `config/settings.json`.

Authenticate providers separately on each computer; authentication data is deliberately not committed.

## Update this setup

Edit the files in this repository, then commit them. When using Pi's package manager, the linked `npm/package.json` and `npm/package-lock.json` will capture package selection and resolved versions; review and commit those changes too.
