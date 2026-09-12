# 我的 Pi 配置 / My Pi Configuration

这个仓库是我可迁移的 Pi 配置唯一来源。它不保存认证信息、会话历史、记忆数据库、缓存或 `node_modules`。

This repository is the portable source of truth for my Pi configuration. It does not contain credentials, session history, memory databases, caches, or `node_modules`.

English-first documentation is available in [README.en.md](README.en.md).

## 内容 / Contents

- `config/settings.shared.json`：跨电脑共享的 Pi 设置和已选插件；刻意不包含模型偏好。
- `system.md`：全局系统提示词。
- `extension-config/open-tui.json`：`pi-open-tui` 配置。
- `extension-config/pi-fff.json`：`@ff-labs/pi-fff` 配置。
- `npm/package.json` 和 `npm/package-lock.json`：插件选择及其精确解析版本。
- `install.ts`：用 Bun + TypeScript 编写的安装和合并逻辑。

## 模型设置的合并规则 / Model-setting merge rule

`defaultProvider`、`defaultModel`、`defaultThinkingLevel`、`modelThinkingLevels` 和 `enabledModels` 都是本机配置。安装时它们会从已有的 `~/.pi/agent/settings.json` 保留，不会被仓库覆盖；新电脑没有已有值时，Pi 使用它自己的默认值。

`defaultProvider`, `defaultModel`, `defaultThinkingLevel`, `modelThinkingLevels`, and `enabledModels` are local-only. The installer preserves them from an existing `~/.pi/agent/settings.json` rather than overwriting them. On a new computer, Pi uses its defaults until you choose and save a model.

## 在新电脑安装 / Install on a new computer

1. 安装 Pi，并确认 `pi` 已在 `PATH` 中。
2. 使用自己的环境管理工具安装 Bun；本仓库只检查 Bun，不会自动安装它。
3. 克隆本仓库后运行：

   ```bash
   ./install.sh
   pi update --extensions
   ```

`install.sh` 会先检查 Bun，再调用 `install.ts`。安装器会把共享设置和当前机器的模型设置合并到 `~/.pi/agent/settings.json`，并为其余受管文件创建符号链接。被替换的文件会先备份到 `~/.pi/agent/backups/`。

Authenticate providers separately on each computer; authentication data is intentionally not committed.

## 更新配置 / Update the configuration

修改仓库里的文件并提交。使用 Pi 的插件管理命令后，已链接的 `npm/package.json` 和 `npm/package-lock.json` 会记录插件选择和解析版本；请检查并提交这些修改。

Edit the repository files and commit them. Pi package-manager changes update the linked `npm/package.json` and `npm/package-lock.json`; review and commit those changes too.
