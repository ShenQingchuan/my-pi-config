#!/usr/bin/env bash
# Link this repository's tracked Pi configuration into the current user's Pi home.
set -euo pipefail

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
pi_dir="${PI_CONFIG_DIR:-$HOME/.pi/agent}"
backup_dir="$pi_dir/backups/$(date +%Y%m%d-%H%M%S)"

link_file() {
  local source="$1"
  local target="$2"

  mkdir -p "$(dirname "$target")"
  if [[ -L "$target" && "$(readlink -f "$target")" == "$source" ]]; then
    return
  fi
  if [[ -e "$target" || -L "$target" ]]; then
    mkdir -p "$backup_dir/$(dirname "${target#$pi_dir/}")"
    mv "$target" "$backup_dir/${target#$pi_dir/}"
  fi
  ln -s "$source" "$target"
}

link_file "$repo_dir/config/settings.json" "$pi_dir/settings.json"
link_file "$repo_dir/system.md" "$pi_dir/system.md"
link_file "$repo_dir/extension-config/open-tui.json" "$pi_dir/open-tui.json"
link_file "$repo_dir/extension-config/pi-fff.json" "$pi_dir/pi-fff.json"
link_file "$repo_dir/npm/package.json" "$pi_dir/npm/package.json"
link_file "$repo_dir/npm/package-lock.json" "$pi_dir/npm/package-lock.json"

echo "Pi configuration is linked from: $repo_dir"
[[ -d "$backup_dir" ]] && echo "Previous files were backed up to: $backup_dir"
echo "Run 'pi update --extensions' to install or reconcile the configured packages."
