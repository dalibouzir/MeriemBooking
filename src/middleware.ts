import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const p = url.pathname

  // Normalize Arabic login path to English alias to avoid FS Unicode issues
  if (p === '/دخول' || p === '/%D8%AF%D8%AE%D9%88%D9%84') {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next|.*\\..*).*)'],
}

