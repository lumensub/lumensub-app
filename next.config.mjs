/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  webpack(config) {
    // stellar-base tries the optional native `sodium-native` module and falls
    // back to tweetnacl. Bundlers can't follow that dynamic require, so tell
    // webpack the module isn't there and let the fallback kick in.
    config.resolve.alias = { ...config.resolve.alias, "sodium-native": false };
    return config;
  },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
};

export default nextConfig;
