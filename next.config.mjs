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
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        path: false,
        os: false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        '@react-native-async-storage/async-storage': false,
        '@metamask/sdk': false,
        '@metamask/sdk-react': false,
        '@metamask/sdk-react-ui': false,
        'eventemitter2': false,
        'eventemitter3': false,
      };
    }

    config.ignoreWarnings = [
      { module: /node_modules\/@walletconnect/ },
      { module: /node_modules\/eventemitter/ },
      { module: /node_modules\/@metamask/ },
    ];

    return config;
  },
}

export default nextConfig
