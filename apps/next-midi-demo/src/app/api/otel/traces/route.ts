import type { NextRequest } from 'next/server'

import { proxy } from '../proxy.ts'

export async function POST(req: NextRequest) {
  return proxy(req, 'https://api.axiom.co/v1/traces')
}
