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

## 快速开始

```bash
git clone git@github.com:ShenQingchuan/my-pi-config.git
cd my-pi-config
bun install
./scripts/install.sh
pi update --extensions
```

