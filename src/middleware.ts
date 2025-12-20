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

  // Enforce HTTPS redirect (for non-localhost)
  const host = req.headers.get('host') || ''
  if (!host.includes('localhost') && req.headers.get('x-forwarded-proto') !== 'https') {
    const httpsUrl = new URL(req.url)
    httpsUrl.protocol = 'https:'
    return NextResponse.redirect(httpsUrl, 308)
  }

  // Enforce www canonical (optional - uncomment if you want to force www)
  // if (host === 'fittrahmoms.com') {
  //   const wwwUrl = new URL(req.url)
  //   wwwUrl.host = 'www.fittrahmoms.com'
  //   return NextResponse.redirect(wwwUrl, 308)
  // }

  const response = NextResponse.next()

  // Security headers (supplemental to next.config.js headers)
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next (Next.js internals)
     * - static files (files with extensions like .js, .css, .png, etc.)
     * - sitemap.xml, robots.txt (SEO files)
     * - favicon.ico, logo files
     */
    '/((?!_next|.*\\..*|sitemap\\.xml|robots\\.txt|favicon\\.ico).*)',
  ],
}

