# 我的 Pi 配置

一套可在多台电脑复用的 Pi 配置仓库。

[English](README.en.md)

## 包含内容

- 全局系统提示词
- 已选 Pi 插件与锁定版本
- `pi-open-tui`、`pi-fff` 等扩展配置
- 内置 MCP 服务器（Context7、DeepWiki、AnySearch）

## 特性

- 在不同电脑上快速恢复一致的 Pi 使用体验
- 保留每台电脑各自的模型选择

## MCP 服务器

配置写在 `extension-config/mcp.json`，安装后链接到 `~/.pi/agent/mcp.json`。

| 服务器 | 用途 | 密钥 |
| --- | --- | --- |
| Context7 | 最新的库 / 框架文档 | 可选，`CONTEXT7_API_KEY`（密钥在 [context7.com/dashboard](https://context7.com/dashboard) 领取） |
| DeepWiki | GitHub 仓库的 AI 文档 | 无需密钥（免费） |
| AnySearch | 联网搜索 / 垂直领域搜索 | 可选，`ANYSEARCH_API_KEY`（密钥在 [anysearch.com/console/api-keys](https://anysearch.com/console/api-keys) 领取） |

密钥通过环境变量提供，写入你的 shell 配置文件（如 `~/.zshrc`）：

```bash
export CONTEXT7_API_KEY="你的 Context7 密钥"
export ANYSEARCH_API_KEY="你的 AnySearch 密钥"
# pi-claude-code-ui 默认去 ~/.pi/settings.json 读配置，设这个让它读到 ~/.pi/agent/settings.json
export PI_CODING_AGENT_DIR="$HOME/.pi/agent"
```

> Context7 与 AnySearch 不填密钥也能用，只是速率上限较低；DeepWiki 完全免费。

## 模型提供商

配置写在 `extension-config/models.json`，安装后链接到 `~/.pi/agent/models.json`。

`sub2tok` 是一个兼容 OpenAI 接口的代理，提供 Claude、GPT、Gemini 等 22 个模型。

```bash
export SUB2TOK_API_KEY="sk-..."
```

配置里只引用环境变量，不存明文密钥。用 `/model` 选择模型，或用命令行指定：

```bash
pi --provider sub2tok --model gemini-3.8-flash
```

模型的价格未在配置里填写（统一记为 0），`contextWindow` 与 `maxTokens` 为保守估值。需要精确计费时请参考代理方的说明。

## 远程访问（Pi Web + Cloudflare Tunnel）

把 Pi 变成手机随时可用的服务。两个进程由 PM2 守护，进程挂掉会自动拉起。

1. 安装依赖：`bun add -g pm2`，并安装 `cloudflared`（`brew install cloudflared`，或把二进制放到 `~/.local/bin`）。
2. 复制密钥文件并填写：`cp .env.example .env.local`（`.env.local` 不入库，换机时手动填一次）。
3. 启动整套服务：`bun run stack:start`，保存开机快照：`bun run stack:save`。

| 命令 | 作用 |
| --- | --- |
| `bun run stack:start` | 启动 / 重载 Pi Web 与 Cloudflare Tunnel |
| `bun run stack:stop` | 停止两个进程 |
| `bun run stack:restart` | 重启两个进程 |
| `bun run stack:status` | 查看运行状态 |
| `bun run stack:logs` | 查看实时日志 |
| `bun run stack:save` | 保存当前进程列表为开机快照 |
| `bun run stack:autostart` | 安装开机自启 + 隧道健康检查（macOS LaunchAgent，不需要 sudo） |

开机自启的安装顺序：先把服务跑起来 → `bun run stack:save` 冻结快照 → `bun run stack:autostart`。它装两个 LaunchAgent：

- `dev.local.pm2-resurrect`：登录后执行 `pm2 resurrect`，把快照里的进程拉回来
- `dev.local.pi-stack-health`：每 5 分钟探测一次公网入口，连续两次不通就重启 `cloudflared`

健康检查是必需的：PM2 只看进程是否存活，`cloudflared` 可能进程在跑、连接却一直超时，这时 PM2 认为一切正常。

> `cloudflared` 只需要跑在 PM2 下。如果之前用 `sudo cloudflared service install` 装过系统级服务，先移除它，否则会有两个连接器抢同一个隧道：
> `sudo launchctl bootout system/com.cloudflare.cloudflared && sudo rm /Library/LaunchDaemons/com.cloudflare.cloudflared.plist`
>
> 同理，如果之前用 `sudo pm2 startup` 试过，它可能留下一个失效的旧 plist，一并清理：`sudo rm -f ~/Library/LaunchAgents/pm2.*.plist`

## 快速开始

```bash
git clone git@github.com:ShenQingchuan/my-pi-config.git
cd my-pi-config
bun install
./scripts/install.sh
pi update --extensions
```

