/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: 'https',
    hostname: 'cdn.apartmenttherapy.info',
  },
  {
    protocol: 'https',
    hostname: 'blogger.googleusercontent.com',
  },
  {
    protocol: 'https',
    hostname: 'i.ibb.co',
  },
]

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
if (supabaseUrl) {
  try {
    const { hostname, protocol } = new URL(supabaseUrl)
    if (hostname) {
      remotePatterns.push({ protocol: protocol.replace(':', '') || 'https', hostname })
    }
  } catch (error) {
    console.warn('Invalid SUPABASE_URL provided, skipping image whitelist:', error)
  }
}

// Security headers
const securityHeaders = [
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=31536000; includeSubDomains',
  },
]

const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  poweredByHeader: false,
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/(.*)\\.(js|css|woff2|woff|ttf|otf|ico|png|jpg|jpeg|gif|webp|avif|svg)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ]
  },
  async rewrites() {
    return [
      { source: '/دخول', destination: '/login' },
    ]
  },
}

module.exports = nextConfig
