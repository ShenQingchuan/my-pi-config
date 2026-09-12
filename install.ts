#!/usr/bin/env bun
import { existsSync, lstatSync, mkdirSync, readlinkSync } from "node:fs";
import { cp, mkdir, readFile, rename, rm, symlink, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

// 这些配置与当前机器、账号或模型偏好有关，不由仓库覆盖。
// These settings are machine/account/model specific and are never overwritten by this repository.
const localOnlySettings = new Set([
  "defaultProvider",
  "defaultModel",
  "defaultThinkingLevel",
  "modelThinkingLevels",
  "enabledModels",
]);

const repoDir = resolve(import.meta.dir);
const piDir = process.env.PI_CONFIG_DIR ?? join(process.env.HOME ?? "", ".pi", "agent");
const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
const backupDir = join(piDir, "backups", timestamp);

function deepMerge(base: Record<string, unknown>, override: Record<string, unknown>): Record<string, unknown> {
  // 对象递归合并；数组和普通值以 override 为准。
  // Merge objects recursively; arrays and scalar values are replaced by override.
  const result = { ...base };
  for (const [key, value] of Object.entries(override)) {
    const oldValue = result[key];
    if (isPlainObject(oldValue) && isPlainObject(value)) {
      result[key] = deepMerge(oldValue, value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

async function readJson(path: string): Promise<Record<string, unknown>> {
  if (!existsSync(path)) return {};
  const value: unknown = JSON.parse(await readFile(path, "utf8"));
  if (!isPlainObject(value)) throw new Error(`JSON 根节点必须是对象 / JSON root must be an object: ${path}`);
  return value;
}

async function backupThenLink(source: string, target: string): Promise<void> {
  await mkdir(dirname(target), { recursive: true });
  if (existsSync(target) || isSymlink(target)) {
    if (isSymlink(target) && resolve(dirname(target), readlinkSync(target)) === source) return;
    const backupPath = join(backupDir, relative(piDir, target));
    await mkdir(dirname(backupPath), { recursive: true });
    await rename(target, backupPath);
  }
  await symlink(source, target);
}

function isSymlink(path: string): boolean {
  try {
    return lstatSync(path).isSymbolicLink();
  } catch {
    return false;
  }
}

async function install(): Promise<void> {
  const sharedSettingsPath = join(repoDir, "config", "settings.shared.json");
  const targetSettingsPath = join(piDir, "settings.json");
  const sharedSettings = await readJson(sharedSettingsPath);
  const existingSettings = await readJson(targetSettingsPath);

  // 共享配置覆盖普通键；模型相关键始终保留本机已有值。
  // Shared settings win for normal keys; existing machine-specific model settings always win.
  const localSettings = Object.fromEntries(
    Object.entries(existingSettings).filter(([key]) => localOnlySettings.has(key)),
  );
  const mergedSettings = deepMerge(sharedSettings, localSettings);

  // settings.json 必须是实体文件，才能保存每台机器不同的模型选择。
  // settings.json must be a real file so each machine can retain its own model choices.
  if (isSymlink(targetSettingsPath)) {
    const backupPath = join(backupDir, relative(piDir, targetSettingsPath));
    await mkdir(dirname(backupPath), { recursive: true });
    await rename(targetSettingsPath, backupPath);
  }
  await mkdir(piDir, { recursive: true });
  await writeFile(targetSettingsPath, `${JSON.stringify(mergedSettings, null, 2)}\n`);

  await backupThenLink(join(repoDir, "system.md"), join(piDir, "system.md"));
  await backupThenLink(join(repoDir, "extension-config", "open-tui.json"), join(piDir, "open-tui.json"));
  await backupThenLink(join(repoDir, "extension-config", "pi-fff.json"), join(piDir, "pi-fff.json"));
  await backupThenLink(join(repoDir, "npm", "package.json"), join(piDir, "npm", "package.json"));
  await backupThenLink(join(repoDir, "npm", "package-lock.json"), join(piDir, "npm", "package-lock.json"));

  console.log(`Pi 配置已安装 / Pi configuration installed: ${repoDir}`);
  if (existsSync(backupDir)) console.log(`旧文件备份 / Previous files backed up: ${backupDir}`);
  console.log("请运行 / Run: pi update --extensions");
}

await install();
