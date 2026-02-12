/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Ensure we're using App Router consistently
  trailingSlash: false,
  // React configuration for better hydration handling
  reactStrictMode: false,
  // Fix Vercel build issues with turbopack
  turbopack: {},
  // Experimental features to help with hydration
  experimental: {
    optimizePackageImports: ['@radix-ui/react-toast'],
  },
  // Webpack configuration to handle server-only packages
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Exclude server-only packages from client bundle
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
