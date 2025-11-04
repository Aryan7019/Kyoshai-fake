/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "randomuser.me"
      }
    ]
  },
  // Disable Turbopack for now
  experimental: {
    turbo: false,
    serverComponentsExternalPackages: ['@prisma/client']
  }
}

module.exports = nextConfig