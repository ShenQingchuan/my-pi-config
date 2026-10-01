#!/usr/bin/env bun
import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { $ } from "bun";

// 用法 / Usage:
//   bun run update-extensions             检查并更新 / check and update
//   bun run update-extensions -- --check  只检查，不写入 / check only, no writes

interface PackageJson {
  dependencies?: Record<string, string>;
  [key: string]: unknown;
}

interface LockFile {
  packages?: Record<string, { version?: string }>;
}

interface Outdated {
  name: string;
  range: string;
  installed: string;
  latest: string;
}

const npmDir = join(resolve(import.meta.dir, ".."), "npm");
const packagePath = join(npmDir, "package.json");
const lockPath = join(npmDir, "package-lock.json");
const checkOnly = process.argv.includes("--check");

// 锁文件统一使用官方源，避免写入本机私有镜像地址。
// Always use the public registry so lockfiles never contain machine-specific mirror URLs.
const registry = "https://registry.npmjs.org/";

const versionPattern = /\d+\.\d+\.\d+(?:-[\w.]+)?/;

function rangeBase(range: string): string {
  return range.match(versionPattern)?.[0] ?? "0.0.0";
}

async function fetchLatest(name: string): Promise<string> {
  const output = await $`npm view ${name} version --registry ${registry}`.quiet().text();
  const version = output.trim();
  if (!versionPattern.test(version)) throw new Error(`无法解析 ${name} 的最新版本 / Cannot parse latest version: ${version}`);
  return version;
}

async function main(): Promise<void> {
  const pkg: PackageJson = JSON.parse(await readFile(packagePath, "utf8"));
  const dependencies = pkg.dependencies ?? {};
  const lock: LockFile = JSON.parse(await readFile(lockPath, "utf8"));

  const names = Object.keys(dependencies);
  const results = await Promise.allSettled(names.map(fetchLatest));

  const outdated: Outdated[] = [];
  const failed: string[] = [];

  results.forEach((result, index) => {
    const name = names[index]!;
    const range = dependencies[name]!;
    const installed = lock.packages?.[`node_modules/${name}`]?.version ?? rangeBase(range);

    if (result.status === "rejected") {
      failed.push(name);
      console.error(`✗ ${name}: ${result.reason instanceof Error ? result.reason.message : result.reason}`);
      return;
    }

    const latest = result.value;
    // 同时对比锁定版本和声明范围下限，避免 ^0.x 范围内被锁在旧版本而漏报。
    // Compare against both the locked version and the range floor so ^0.x ranges are not missed.
    const current = Bun.semver.order(installed, rangeBase(range)) >= 0 ? installed : rangeBase(range);
    if (Bun.semver.order(latest, current) > 0) {
      outdated.push({ name, range, installed, latest });
      console.log(`↑ ${name}: ${installed} (${range}) → ${latest}`);
    } else {
      console.log(`✓ ${name}: ${installed}`);
    }
  });

  if (outdated.length === 0) {
    console.log("\n所有扩展均已是最新版本 / All extensions are up to date");
  } else if (checkOnly) {
    console.log(`\n发现 ${outdated.length} 个可更新扩展（--check 模式，未写入） / ${outdated.length} update(s) available (--check, nothing written)`);
  } else {
    for (const { name, range, latest } of outdated) {
      const prefix = range.match(/^[\^~]/)?.[0] ?? "";
      dependencies[name] = `${prefix}${latest}`;
    }
    await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
    console.log("\n已更新 npm/package.json，正在刷新 package-lock.json … / Updated package.json, refreshing lockfile …");
    await $`npm install --package-lock-only --ignore-scripts --registry ${registry}`.cwd(npmDir);
    console.log(`已更新 ${outdated.length} 个扩展 / Updated ${outdated.length} extension(s)`);
    console.log("请运行 / Run: pi update --extensions");
  }

  if (failed.length > 0) {
    console.error(`\n以下扩展检查失败 / Failed to check: ${failed.join(", ")}`);
    process.exit(1);
  }
}

await main();
