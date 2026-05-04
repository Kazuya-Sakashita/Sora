/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Exclude react-pdf from Turbopack bundling so Node.js resolves it natively
  // (prevents the "browser" field from overriding the Node.js bundle in API routes)
  serverExternalPackages: ["@react-pdf/renderer", "sharp"],
  turbopack: {},
}

export default nextConfig
