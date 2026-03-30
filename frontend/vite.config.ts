/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ── Terminal logger plugin ────────────────────────────────────────────────────
// Exposes POST /__log on the Vite dev server.
// The browser logger POSTs { level, args } here and Vite prints it to the shell.
const COLORS: Record<string, string> = {
  info:  '\x1b[36m',   // cyan
  warn:  '\x1b[33m',   // yellow
  error: '\x1b[31m',   // red
  debug: '\x1b[90m',   // grey
  reset: '\x1b[0m',
}

function terminalLoggerPlugin(): Plugin {
  return {
    name: 'terminal-logger',
    configureServer(server) {
      server.middlewares.use(
        '/__log',
        (req: IncomingMessage, res: ServerResponse) => {
          if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }

          let body = ''
          req.on('data', (chunk: Buffer) => { body += chunk.toString(); })
          req.on('end', () => {
            try {
              const { level = 'info', args = [] } = JSON.parse(body) as {
                level: string;
                args: unknown[];
              }
              const color = COLORS[level] ?? COLORS.reset
              const label = `${color}[${level.toUpperCase()}]${COLORS.reset}`
              const text = args
                .map(a => (typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)))
                .join(' ')
              // Emit through Vite's own logger so it formats alongside HMR output
              if (level === 'error') server.config.logger.error(`${label} ${text}`)
              else if (level === 'warn') server.config.logger.warn(`${label} ${text}`)
              else server.config.logger.info(`${label} ${text}`)
            } catch { /* ignore malformed payloads */ }
            res.statusCode = 204
            res.end()
          })
        },
      )
    },
  }
}
// ─────────────────────────────────────────────────────────────────────────────

export default defineConfig({
  plugins: [react(), terminalLoggerPlugin()],
  server: {
    proxy: {
      '/uploads': 'http://localhost:5000',
      '/public':  'http://localhost:5000',
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/setupTests.ts'],
    coverage: {
      provider: 'v8',
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/main.tsx', 'src/vite-env.d.ts'],
    },
  },
})
