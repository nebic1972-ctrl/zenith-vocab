/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  buildExcludes: [/middleware-manifest\.json$/],
  publicExcludes: ['!robots.txt', '!sitemap.xml']
})

const path = require('path')

const nextConfig = {
  reactStrictMode: false,

  typescript: {
    ignoreBuildErrors: true
  },

  eslint: {
    ignoreDuringBuilds: true
  },

  webpack: (config, { isServer, dev }) => {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        canvas: false,
        encoding: false,
        'pdfjs-dist/build/pdf.worker.entry': false
      }

      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
        canvas: false,
        encoding: false
      }
    }

    config.module = config.module || {}
    config.module.rules = config.module.rules || []

    config.module.rules.push({
      test: /pdf\.worker\.(min\.)?js/,
      type: 'asset/resource',
      generator: {
        filename: 'static/worker/[hash][ext][query]'
      }
    })

    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300
      }
    }

    return config
  },

  experimental: {
    optimizePackageImports: ['lucide-react', '@radix-ui/react-icons']
  },

  turbopack: {
    resolveAlias: {
      canvas: path.resolve(process.cwd(), 'src/lib/empty-module.js'),
      encoding: path.resolve(process.cwd(), 'src/lib/empty-module.js')
    }
  },

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**' }],
    unoptimized: process.env.NODE_ENV === 'development'
  },

  serverExternalPackages: ['resend', 'canvas', 'pdfjs-dist']
}

module.exports = withPWA(nextConfig)
