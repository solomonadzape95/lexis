const path = require('path')

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    // Ensure @ alias resolves in all environments (e.g. Docker build)
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    }
    // Suppress source map parsing errors for missing WASM files
    config.ignoreWarnings = [
      { module: /node_modules\/next\/dist\/compiled\/source-map/ },
      { message: /Failed to parse source map/ },
      { message: /ENOENT.*mappings\.wasm/ },
    ];
    return config;
  },
  // Disable source maps in production to avoid WASM issues
  productionBrowserSourceMaps: false,
  // Suppress source map warnings in development
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

module.exports = nextConfig;
