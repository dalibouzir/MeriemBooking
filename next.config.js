/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: __dirname,
  async rewrites() {
    return [
      { source: '/دخول', destination: '/login' },
    ]
  },
}
  
  module.exports = nextConfig
  
