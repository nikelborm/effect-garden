import { type NextRequest, NextResponse } from 'next/server'

const AXIOM_API_KEY = 'xaat-33319bc6-9594-410a-a9d8-50be82ce7951'

export async function proxy(req: NextRequest, upstream: string) {
  const body = await req.arrayBuffer()
  const res = await fetch(upstream, {
    method: 'POST',
    headers: {
      'Content-Type': req.headers.get('Content-Type') ?? 'application/json',
      Authorization: `Bearer ${AXIOM_API_KEY}`,
      'X-Axiom-Dataset': 'next-midi-demo-web-dev',
    },
    body,
  })
  return new NextResponse(null, { status: res.status })
}
