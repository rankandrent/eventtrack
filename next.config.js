/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['ncsxlqpwiaixnsvjtlgc.supabase.co'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Externalize whatsapp-web.js and puppeteer for server-side only
      config.externals = config.externals || []
      config.externals.push({
        'whatsapp-web.js': 'commonjs whatsapp-web.js',
        'puppeteer': 'commonjs puppeteer',
      })
    }
    return config
  },
}

module.exports = nextConfig

