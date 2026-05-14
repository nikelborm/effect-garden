import { randomUUID } from 'node:crypto'
import { createWriteStream } from 'node:fs'
import path from 'node:path'
import { pipeline } from 'node:stream/promises'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const makeResponse = (body?: BodyInit | null, status = 200) =>
  new Response(body, { status, headers: corsHeaders })

const goaway = () => makeResponse('{ "go": "away" }')

Bun.serve({
  port: 3000,
  async fetch(req) {
    if (req.method === 'OPTIONS') return makeResponse(null, 204)
    if (req.method !== 'POST') return goaway()

    const url = new URL(req.url)
    if (url.pathname !== '/data') return goaway()

    const filePath = path.join('temp-store', randomUUID() + '.txt')
    if (!req.body) return goaway()

    await pipeline(req.body, createWriteStream(filePath))

    return makeResponse('Hello, world!')
  },
})

// await fetch('http://localhost:3000/data', {
//   method: 'POST',
//   body: JSON.stringify({ hello: 'world' }),
// })
