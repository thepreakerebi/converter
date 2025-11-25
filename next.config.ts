import type { NextConfig } from "next";
import webpack from "webpack";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'assets.coingecko.com',
        pathname: '/coins/images/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Aggressively externalize problematic packages on the server side
      // This prevents webpack from trying to bundle Node.js-only packages
      const externals = [
        "pino",
        "pino-pretty",
        "thread-stream",
        "lokijs",
        "encoding",
        "desm",
        "fastbench",
        "pino-elasticsearch",
        "tap",
        "why-is-node-running",
      ];
      
      // Create a function to check if a request should be externalized
      // This handles both direct imports and nested dependencies
      const shouldExternalize = (request: string): boolean => {
        // Check exact matches
        if (externals.includes(request)) {
          return true;
        }
        // Check if request starts with any external package name
        // This handles nested imports like "pino/lib/logger" or "thread-stream/index"
        return externals.some((pkg) => request === pkg || request.startsWith(`${pkg}/`));
      };
      
      // Add to externals array
      // Webpack externals function signature: (context, request, callback) => void
      const externalsFunction = (context: string, request: string, callback: Function) => {
        if (shouldExternalize(request)) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      };
      
      if (Array.isArray(config.externals)) {
        // Add both exact matches and a function to handle nested imports
        config.externals.push(...externals, externalsFunction);
      } else if (typeof config.externals === "function") {
        const originalExternals = config.externals;
        config.externals = [
          originalExternals,
          externalsFunction,
        ];
      } else {
        config.externals = [...externals, externalsFunction];
      }
      
      // Ignore problematic files from thread-stream and pino packages
      // This prevents webpack from trying to process test files, benchmarks, etc.
      config.module = config.module || {};
      config.module.rules = config.module.rules || [];
      config.module.rules.push({
        test: /node_modules[\\/](thread-stream|pino)[\\/].*\.(test|spec|benchmark|example|zip|sh|yaml|yml|md|txt|LICENSE)$/i,
        type: "javascript/auto",
        use: [],
      });
      
      // Ignore dev dependencies that shouldn't be bundled
      // Note: pino, thread-stream, and pino-pretty are externalized above, not aliased to false
      config.resolve = config.resolve || {};
      config.resolve.alias = config.resolve.alias || {};
      config.resolve.alias = {
        ...config.resolve.alias,
        "desm": false,
        "fastbench": false,
        "pino-elasticsearch": false,
        "tap": false,
        "why-is-node-running": false,
      };
    }
    
    // Ignore optional dependencies from @wagmi/connectors that we don't use
    config.plugins = config.plugins || [];
    config.plugins.push(
      new webpack.IgnorePlugin({
        resourceRegExp: /^@gemini-wallet\/core$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^porto$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@safe-global\/safe-apps-sdk$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@base-org\/account$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@coinbase\/wallet-sdk$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@safe-global\/safe-apps-provider$/,
      }),
      new webpack.IgnorePlugin({
        resourceRegExp: /^@react-native-async-storage\/async-storage$/,
      })
    );
    
    return config;
  },
  // Mark problematic packages as external (server-only)
  // This works for both webpack and Turbopack in Next.js 16
  serverExternalPackages: [
    "pino",
    "pino-pretty",
    "thread-stream",
    "lokijs",
    "encoding",
    "desm",
    "fastbench",
    "pino-elasticsearch",
    "tap",
    "why-is-node-running",
  ],
  // Use experimental API as fallback for older Next.js versions
  experimental: {
    serverComponentsExternalPackages: [
      "pino",
      "pino-pretty",
      "thread-stream",
      "lokijs",
      "encoding",
      "desm",
      "fastbench",
      "pino-elasticsearch",
      "tap",
      "why-is-node-running",
    ],
  },
};

export default nextConfig;
