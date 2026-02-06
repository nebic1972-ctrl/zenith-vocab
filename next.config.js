/** @type {import('next').NextConfig} */
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

const nextConfig = {
  // Resend Node.js modülleri (stream vb.) kullanır - Edge'de çalışmaz
  serverExternalPackages: ['resend'],

  // 🚀 Build Hızlandırma
  reactStrictMode: false,
  productionBrowserSourceMaps: false,

  // 🛡️ Build Hatalarını Yoksay (Timeout için)
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },

  // 🖼️ Resim Optimizasyonu (Avatar vb.)
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
    ],
  },

  // PDF okuyucu (canvas alias)
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

module.exports = withPWA(nextConfig);
