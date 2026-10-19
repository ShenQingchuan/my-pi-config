#!/usr/bin/env bun
/**
 * 安装两个 macOS LaunchAgent（都不需要 sudo）：
 *
 * 1. dev.local.pm2-resurrect  登录后执行 pm2 resurrect，把快照里的进程拉回来
 * 2. dev.local.pi-stack-health 每 5 分钟检查公网入口，不通就重启 cloudflared
 *
 * 为什么不用 pm2 startup：它要求 sudo，还会把 root 拥有的 plist 写进用户目录，
 * 用户名打错时静默失效。这里自己写 plist，路径全部绝对化，换机器重跑一次即可。
 */
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const home = homedir()
const agentDir = join(home, 'Library/LaunchAgents')
const uid = process.getuid?.() ?? 501

const nodePath = which('node')
const bunPath = which('bun')

const pathDirs = [
  join(home, '.local/bin'),
  join(home, '.bun/bin'),
  join(nodePath, '..'),
  join(home, '.local/share/mise/shims'),
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin',
].join(':')

interface AgentOptions {
  label: string
  program: string[]
  /** 只有定时任务需要，单位秒 */
  startInterval?: number
}

function which(command: string): string {
  return execFileSync('which', [command], { encoding: 'utf8' }).trim()
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function buildPlist(options: AgentOptions): string {
  const args = options.program
    .map(arg => `    <string>${escapeXml(arg)}</string>`)
    .join('\n')
  const interval = options.startInterval
    ? `  <key>StartInterval</key>\n  <integer>${options.startInterval}</integer>\n`
    : ''
  const logs = (suffix: string): string =>
    escapeXml(join(home, `.pm2/${options.label}.${suffix}.log`))

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${options.label}</string>
  <key>ProgramArguments</key>
  <array>
${args}
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
${interval}  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>${escapeXml(home)}</string>
    <key>PM2_HOME</key>
    <string>${escapeXml(join(home, '.pm2'))}</string>
    <key>PATH</key>
    <string>${escapeXml(pathDirs)}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${logs('out')}</string>
  <key>StandardErrorPath</key>
  <string>${logs('err')}</string>
</dict>
</plist>
`
}

function install(options: AgentOptions): void {
  const agentPath = join(agentDir, `${options.label}.plist`)
  Bun.write(agentPath, buildPlist(options))

  try {
    execFileSync('launchctl', ['bootout', `gui/${uid}/${options.label}`], { stdio: 'ignore' })
  }
  catch {
    // 首次安装时服务还不存在，忽略
  }
  execFileSync('launchctl', ['bootstrap', `gui/${uid}`, agentPath], { stdio: 'inherit' })
  console.log(`✅ ${options.label}`)
}

// 登录后恢复 PM2 快照
install({
  label: 'dev.local.pm2-resurrect',
  program: [
    join(nodePath, '..', 'node'),
    join(home, '.bun/install/global/node_modules/pm2/bin/pm2'),
    'resurrect',
  ],
})

// 定时做隧道健康检查，进程活着但连不上时也能自愈
install({
  label: 'dev.local.pi-stack-health',
  program: [bunPath, join(import.meta.dir, 'stack-healthcheck.ts')],
  startInterval: 300,
})

console.log('\n提示：如果之前用 sudo 跑过 `pm2 startup`，可能会留下一个无效的旧 plist，执行下面这行清掉：')
console.log('  sudo rm -f ~/Library/LaunchAgents/pm2.*.plist')
