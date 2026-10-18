#!/usr/bin/env bun
/**
 * 生成并加载「开机自动 resurrect PM2」的 macOS LaunchAgent。
 *
 * 为什么不用 pm2 startup：它会要求 sudo，并且把 root 拥有的 plist 写进用户目录，
 * 用户名打错时还会静默失效。这里直接写一个属于当前用户、路径全部绝对化的 agent，
 * 不需要 sudo，换机器时重跑一次即可。
 */
import { execFileSync } from 'node:child_process'
import { homedir } from 'node:os'
import { join } from 'node:path'

const LABEL = 'dev.local.pm2-resurrect'
const home = homedir()
const agentDir = join(home, 'Library/LaunchAgents')
const agentPath = join(agentDir, `${LABEL}.plist`)
const nodeBin = which('node')
const pm2Script = join(home, '.bun/install/global/node_modules/pm2/bin/pm2')

const pathDirs = [
  join(home, '.local/bin'),
  join(home, '.bun/bin'),
  join(nodeBin, '..'),
  join(home, '.local/share/mise/shims'),
  '/opt/homebrew/bin',
  '/usr/local/bin',
  '/usr/bin',
  '/bin',
  '/usr/sbin',
  '/sbin',
].join(':')

function which(command: string): string {
  return execFileSync('which', [command], { encoding: 'utf8' }).trim()
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

const plist = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${LABEL}</string>
  <key>ProgramArguments</key>
  <array>
    <string>${escapeXml(join(nodeBin, '..', 'node'))}</string>
    <string>${escapeXml(pm2Script)}</string>
    <string>resurrect</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>KeepAlive</key>
  <false/>
  <key>EnvironmentVariables</key>
  <dict>
    <key>HOME</key>
    <string>${escapeXml(home)}</string>
    <key>PM2_HOME</key>
    <string>${escapeXml(join(home, '.pm2'))}</string>
    <key>PATH</key>
    <string>${escapeXml(pathDirs)}</string>
  </dict>
  <key>StandardOutPath</key>
  <string>${escapeXml(join(home, '.pm2/pm2-resurrect.out.log'))}</string>
  <key>StandardErrorPath</key>
  <string>${escapeXml(join(home, '.pm2/pm2-resurrect.err.log'))}</string>
</dict>
</plist>
`

await Bun.write(agentPath, plist)
console.log(`✅ 已写入 ${agentPath}`)

const uid = process.getuid?.() ?? 501
try {
  execFileSync('launchctl', ['bootout', `gui/${uid}/${LABEL}`], { stdio: 'ignore' })
}
catch {
  // 首次安装时服务还不存在，忽略
}
execFileSync('launchctl', ['bootstrap', `gui/${uid}`, agentPath], { stdio: 'inherit' })
console.log('✅ 已加载 LaunchAgent，下次开机会自动执行 pm2 resurrect')

console.log('\n提示：如果之前用 sudo 跑过 `pm2 startup`，可能会留下一个无效的旧 plist，执行下面这行清掉：')
console.log('  sudo rm -f ~/Library/LaunchAgents/pm2.*.plist')
