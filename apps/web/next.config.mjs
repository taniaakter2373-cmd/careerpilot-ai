/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    "@careerpilot/shared",
    "@careerpilot/matching",
    "@careerpilot/ai",
    "@careerpilot/job-sources",
    "@careerpilot/database",
  ],
  experimental: {
    serverComponentsExternalPackages: ["@prisma/client", "bcryptjs"],
  },
};

export default nextConfig;
