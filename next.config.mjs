/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Removed deprecated key
  },
  // Correct way for external packages
  serverExternalPackages: ['firebase-admin'],
};

export default nextConfig;