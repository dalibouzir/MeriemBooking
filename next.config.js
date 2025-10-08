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

const nextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    remotePatterns,
  },
  async rewrites() {
    return [
      { source: '/دخول', destination: '/login' },
    ]
  },
}

module.exports = nextConfig
