/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@prisma/client'],
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
    turbo: false
  }
}

module.exports = nextConfig