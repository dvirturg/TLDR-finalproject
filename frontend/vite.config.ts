/// <reference types="vitest" />
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import type { Plugin } from 'vite'
import type { IncomingMessage, ServerResponse } from 'node:http'
import fs from 'node:fs' 
import path from 'node:path'

const COLORS: Record<string, string> = {
  info:  '\x1b[36m', 
  warn:  '\x1b[33m', 
  error: '\x1b[31m', 
  debug: '\x1b[90m', 
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

export default defineConfig({
  plugins: [react(), terminalLoggerPlugin()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, './localhost-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, './localhost.pem')),
    },
    proxy: {
      '/uploads': {
        target: 'https://localhost:5000', 
        secure: false, 
      },
      '/public': {
        target: 'https://localhost:5000', 
        secure: false,
      },
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