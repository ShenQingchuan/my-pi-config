#!/usr/bin/env bun
/**
 * 隧道健康检查：公网入口打不通就重启 cloudflared。
 *
 * PM2 只管「进程还活着」，管不了「连接是否还在」：cloudflared 进程可能一直
 * 在重连却始终连不上边缘节点，此时 PM2 认为一切正常，隧道实际上是断的。
 * 这个脚本由 launchd 每 5 分钟跑一次，补上这一层。
 *
 * 判定逻辑：连续两次公网请求失败（间隔 10 秒）才动手，避免网络抖动误重启。
 */
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'

const home = homedir()

function readAllowedHost(): string {
  const envPath = join(import.meta.dir, '..', '.env.local')
  if (existsSync(envPath)) {
    const line = readFileSync(envPath, 'utf8')
      .split('\n')
      .find(l => l.trim().startsWith('PI_WEB_ALLOWED_HOSTS='))
    if (line) {
      const value = line.slice(line.indexOf('=') + 1).trim()
      const first = value.split(',')[0]?.trim()
      if (first) {
        return first
      }
    }
  }
  return ''
}

async function probe(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'manual',
      signal: AbortSignal.timeout(15000),
    })
    // 200 登录页、307 跳转都算通；5xx 是 Cloudflare 边缘报错
    return response.status < 500
  }
  catch {
    return false
  }
}

const host = readAllowedHost()
if (!host) {
  console.log('未配置 PI_WEB_ALLOWED_HOSTS，跳过健康检查')
  process.exit(0)
}

const url = `https://${host}/login`

if (await probe(url)) {
  process.exit(0)
}

await Bun.sleep(10000)

if (await probe(url)) {
  process.exit(0)
}

console.log(`${new Date().toISOString()} ${url} 连续两次不可用，重启 cloudflared`)
try {
  execFileSync(join(home, '.bun/bin/pm2'), ['restart', 'cloudflared'], { stdio: 'inherit' })
}
catch (error) {
  console.error('重启失败：', error instanceof Error ? error.message : error)
  process.exit(1)
}
