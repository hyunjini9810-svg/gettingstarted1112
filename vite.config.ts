import { Buffer } from 'node:buffer'
import type { IncomingMessage } from 'node:http'
import type { VercelRequest, VercelResponse } from '@vercel/node'
import react from '@vitejs/plugin-react'
import { loadEnv, type Plugin, defineConfig } from 'vite'
import chatHandler from './api/chat.ts'

function localChatFunction(): Plugin {
  return {
    name: 'local-chat-function',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/chat', async (request, response, next) => {
        if (request.method !== 'POST') {
          response.setHeader('Allow', 'POST')
          response.statusCode = 405
          response.end(JSON.stringify({ error: 'POST 요청만 지원해요.' }))
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of request) chunks.push(Buffer.from(chunk))
          const rawBody = Buffer.concat(chunks).toString('utf8')
          ;(request as IncomingMessage & { body?: unknown }).body = rawBody ? JSON.parse(rawBody) : undefined

          const vercelResponse = Object.assign(response, {
            status(code: number) {
              response.statusCode = code
              return this
            },
            json(payload: unknown) {
              response.setHeader('Content-Type', 'application/json; charset=utf-8')
              response.end(JSON.stringify(payload))
              return this
            },
          })

          await chatHandler(request as VercelRequest, vercelResponse as VercelResponse)
        } catch (error) {
          if (response.headersSent) return
          if (error instanceof SyntaxError) {
            response.statusCode = 400
            response.setHeader('Content-Type', 'application/json; charset=utf-8')
            response.end(JSON.stringify({ error: '요청 형식이 올바르지 않아요.' }))
            return
          }
          next(error)
        }
      })
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  if (env.OPENAI_API_KEY) process.env.OPENAI_API_KEY = env.OPENAI_API_KEY

  return {
    plugins: [react(), localChatFunction()],
  }
})
