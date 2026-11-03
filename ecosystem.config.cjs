const fs = require('node:fs')
const os = require('node:os')
const path = require('node:path')

const home = os.homedir()

// 从 .env.local 读取本机密钥，避免把密码和 Tunnel Token 写进仓库
function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {}
  }
  return fs
    .readFileSync(filePath, 'utf8')
    .split('\n')
    .reduce((acc, line) => {
      const trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        return acc
      }
      const index = trimmed.indexOf('=')
      if (index === -1) {
        return acc
      }
      acc[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim()
      return acc
    }, {})
}

const fileEnv = loadEnvFile(path.join(__dirname, '.env.local'))

// 优先级：.env.local > 当前 shell 环境变量
const env = { ...process.env, ...fileEnv }

const sharedPath = `${home}/.local/bin:${home}/.bun/bin:${home}/.local/share/mise/shims:${process.env.PATH}`

function envFile(name) {
  return path.join(home, '.pi/agent/logs', name)
}

module.exports = {
  apps: [
    {
      name: 'pi-web',
      script: 'bun',
      // 不要加 --bun：内置终端用 node-pty 的原生 forkpty，Bun 运行时下会卡住
      // spawn-helper，导致终端无输出且 resize 报 ioctl(2) failed
      args: 'x @agegr/pi-web --no-open',
      cwd: __dirname,
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        PATH: sharedPath,
        NODE_ENV: 'production',
        PORT: env.PI_WEB_PORT || '30141',
        PI_WEB_HOSTNAME: env.PI_WEB_HOSTNAME || '127.0.0.1',
        PI_WEB_PASSWORD: env.PI_WEB_PASSWORD || '',
        PI_WEB_ALLOWED_HOSTS: env.PI_WEB_ALLOWED_HOSTS || '',
        PI_CODING_AGENT_DIR: env.PI_CODING_AGENT_DIR || `${home}/.pi/agent`,
      },
      error_file: envFile('pi-web-error.log'),
      out_file: envFile('pi-web-out.log'),
      time: true,
    },
    {
      // Cloudflare Tunnel。--protocol http2 是必要的：本机开着 FlClash 的
      // fake-ip/TUN 代理，QUIC（UDP 7844）过代理会一直超时，退到 TCP 443 才稳定。
      name: 'cloudflared',
      script: `${home}/.local/bin/cloudflared`,
      args: `tunnel run --protocol http2 --token ${env.CLOUDFLARE_TUNNEL_TOKEN || ''}`,
      cwd: __dirname,
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 3000,
      env: {
        PATH: sharedPath,
      },
      error_file: envFile('cloudflared-error.log'),
      out_file: envFile('cloudflared-out.log'),
      time: true,
    },
  ],
}
