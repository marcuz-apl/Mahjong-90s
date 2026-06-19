/** @type {import('next').NextConfig} */
const nextConfig = {
  devIndicators: {
    appIsrStatus: false
  },
  serverExternalPackages: ['better-sqlite3']
};

export default nextConfig;
