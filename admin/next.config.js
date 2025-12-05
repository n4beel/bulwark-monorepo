/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  eslint: {
    // Disable ESLint during builds
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Optional: Also disable TypeScript errors during builds if needed
    // ignoreBuildErrors: true,
  },
}

module.exports = nextConfig

