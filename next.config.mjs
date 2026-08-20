/** @type {import('next').NextConfig} */
import path from "path"
import { fileURLToPath } from "url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  turbopack: {
    root: __dirname,
  },
  // Ensure we're using App Router consistently
  trailingSlash: false,
  // React configuration for better hydration handling
  reactStrictMode: false,
  experimental: {
    optimizePackageImports: ['@radix-ui/react-toast'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'i0.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'i1.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'i2.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'epiccomputers.co.tz',
      },
      {
        protocol: 'https',
        hostname: '**.wp.com',
      },
      {
        protocol: 'https',
        hostname: 'shopflix.co.tz',
      },
    ],
  },
  // Ensure proper headers for XML files
  async headers() {
    return [
      {
        source: '/products.xml',
        headers: [
          {
            key: 'Content-Type',
            value: 'application/xml; charset=UTF-8',
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=3600, s-maxage=3600',
          },
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
        ],
      },
    ]
  },
  // Webpack configuration to handle server-only packages
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        url: false,
        zlib: false,
        http: false,
        https: false,
        assert: false,
        os: false,
        path: false,
      }
      config.externals = config.externals || []
      config.externals.push('nodemailer')
    }
    return config
  },
}

export default nextConfig
