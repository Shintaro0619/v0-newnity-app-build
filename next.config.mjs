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
  webpack: (config, { isServer }) => {
    // 外部モジュールの警告を抑制
    config.externals.push('pino-pretty', 'lokijs', 'encoding')
    
    // React Native関連のモジュールを無視
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        '@react-native-async-storage/async-storage': false,
      }
    }
    
    return config
  },
  // 出力設定を最適化
  output: 'standalone',
}

export default nextConfig
