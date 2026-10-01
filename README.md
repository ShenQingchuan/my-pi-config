# 我的 Pi 配置

一套可在多台电脑复用的 Pi 配置仓库。

[English](README.en.md)

## 包含内容

- 全局系统提示词
- 已选 Pi 插件与锁定版本
- `pi-open-tui`、`pi-fff` 等扩展配置

## 特性

- 在不同电脑上快速恢复一致的 Pi 使用体验
- 保留每台电脑各自的模型选择

## 快速开始

```bash
git clone git@github.com:ShenQingchuan/my-pi-config.git
cd my-pi-config
bun install
./scripts/install.sh
pi update --extensions
```

