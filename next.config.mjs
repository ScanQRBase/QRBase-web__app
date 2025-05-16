import { join } from 'path';

/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    config.externals.push("pino-pretty", "lokijs", "encoding");

    if (!isServer && process.env.NODE_ENV === "production") {
      import("webpack-obfuscator").then((JavaScriptObfuscator) => {
        config.plugins.push(
          new JavaScriptObfuscator.default(
            {
              compact: true,
              stringArray: true,
              stringArrayEncoding: ["none"],
              stringArrayThreshold: 0.5,
              rotateStringArray: true,
              controlFlowFlattening: false,
              deadCodeInjection: false,
              disableConsoleOutput: false,
              selfDefending: false,
              reservedNames: [
                "QrBaseMain",
                "QrBaseQrcodeItems",
                "QrBaseCoinInfo",
                "QrBasePartnerInfo",
                "QrBaseFooter",
                "QrBaseProvider",
                "marketCap",
                "maxMarketCap",
                "coinInfo",
              ],
            },
            ["vendor**.js", "polyfills**.js", "webpack**.js"]
          )
        );
      });
    }

    return config;
  },

  productionBrowserSourceMaps: false,

  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ik.imagekit.io",
        pathname: "/**",
      },
    ],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 3600,
    deviceSizes: [320, 640, 768, 1024, 1280],
    imageSizes: [64, 96, 128, 146],
  },

  compress: true,

  async headers() {
    return [
      {
        source: "/base/:address*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, must-revalidate",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
          },
        ],
      },
    ];
  },
};

export default nextConfig;