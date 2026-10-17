#!/usr/bin/env bash
# 此启动器只负责确认 Bun 已存在；实际安装逻辑在 install.ts 中。
# This launcher only checks for Bun; install.ts contains the actual logic.
set -euo pipefail

if ! command -v bun >/dev/null 2>&1; then
  echo "错误：未找到 Bun。请先使用你自己的环境管理工具安装 Bun，再重新运行本脚本。" >&2
  echo "Error: Bun was not found. Install Bun with your preferred environment manager, then rerun this script." >&2
  exit 1
fi

repo_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
exec bun run "$repo_dir/install.ts"
