import { spawn, spawnSync } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const frontendDir = path.dirname(fileURLToPath(import.meta.url))
const rootDir = path.resolve(frontendDir, '..')

function talkflowBackendPlugin() {
  let backendProcess = null

  function findPython() {
    const candidates = process.platform === 'win32'
      ? [
          ['py', ['-3']],
          ['python', []],
          ['python3', []],
        ]
      : [
          ['python3', []],
          ['python', []],
        ]

    return candidates.find(([command, args]) => {
      const result = spawnSync(command, [...args, '--version'], {
        cwd: rootDir,
        encoding: 'utf8',
        shell: false,
        windowsHide: true,
      })
      return result.status === 0 && /Python 3\./.test(`${result.stdout}${result.stderr}`)
    })
  }

  return {
    name: 'talkflow-backend',
    apply: 'serve',
    configureServer(server) {
      if (process.env.TALKFLOW_SKIP_BACKEND === '1') return

      const python = findPython()
      if (!python) {
        console.error('\n[talkflow-backend] Python 3 is not installed or is not on PATH.')
        console.error('[talkflow-backend] Install Python, reopen this terminal, then run npm run dev again.\n')
        return
      }

      const [command, prefixArgs] = python
      backendProcess = spawn(command, [
        ...prefixArgs,
        '-m', 'uvicorn',
        'app.main:app',
        '--app-dir', 'backend',
        '--host', '127.0.0.1',
        '--port', '8000',
        '--reload',
      ], {
        cwd: rootDir,
        shell: false,
        stdio: 'inherit',
        env: process.env,
        windowsHide: true,
      })

      backendProcess.on('error', (error) => {
        console.error(`[talkflow-backend] failed to start: ${error.message}`)
      })

      server.httpServer?.once('close', () => {
        if (backendProcess && !backendProcess.killed) backendProcess.kill()
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), talkflowBackendPlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  }
})
