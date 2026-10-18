const os = require('node:os')
const path = require('node:path')

const home = os.homedir()

module.exports = {
  apps: [
    {
      name: 'pi-web',
      script: 'bun',
      args: 'x --bun @agegr/pi-web --no-open',
      cwd: path.resolve(__dirname),
      interpreter: 'none',
      autorestart: true,
      max_restarts: 10,
      restart_delay: 2000,
      env: {
        PATH: `${home}/.local/bin:${home}/.bun/bin:${home}/.local/share/mise/shims:${process.env.PATH}`,
        NODE_ENV: 'production',
        PORT: process.env.PI_WEB_PORT || '30141',
        PI_WEB_HOSTNAME: process.env.PI_WEB_HOSTNAME || '127.0.0.1',
        PI_WEB_PASSWORD: process.env.PI_WEB_PASSWORD || '',
        PI_WEB_ALLOWED_HOSTS: process.env.PI_WEB_ALLOWED_HOSTS || 'pi.dokduk.cc',
        PI_CODING_AGENT_DIR: process.env.PI_CODING_AGENT_DIR || `${home}/.pi/agent`,
      },
      error_file: path.resolve(home, '.pi/agent/logs/pi-web-error.log'),
      out_file: path.resolve(home, '.pi/agent/logs/pi-web-out.log'),
      time: true,
    },
  ],
}
